let textStyles = new Set();
let textNodes = [];
let textIndex;
let remoteTextToUI;



//--------------HELPER FUNCTIONS
function processStyle(style, outArray, isLocal=true){
  const styleName = style.name;

      //get info like font name, font weight, font size and line height
      const fontName = style.fontName.family;
      const fontWeight = style.fontName.style;
      const fontSize = style.fontSize;
      let lineHeight;
      if (style.lineHeight.unit === 'AUTO') { lineHeight = 'auto'; }  
      else if (style.lineHeight.unit === 'PERCENT') { lineHeight = Math.floor(style.lineHeight.value) + '%'; }
      else if (style.lineHeight.unit === 'PIXELS') { lineHeight = style.lineHeight.value; }
      const styleInfo = {fontName: fontName, fontWeight: fontWeight, fontSize: fontSize, lineHeight: lineHeight};

      //finally, register this style into textStyles for next check
      textStyles.add(style.id);
      outArray.push({id: style.id, name: styleName, info: styleInfo, isLocal:isLocal});
}



//------------------FUNCTIONS FOR LOCAL STYLES
export function getLocal(){

  figma.ui.postMessage({type:"load-update", text:`Finding local text styles...`});

  const localTextStyles = figma.getLocalTextStyles();
  let textToUI = [];

  for (const style of localTextStyles) {

    const styleID = style.id;
    //only process this style if it isn't a duplicate
    if(!textStyles.has(style.id)){
      processStyle(style, textToUI);
    }
  }
  //finally, convert processed text style  to serializable form
  figma.ui.postMessage({type:"display-text", data: textToUI});
}




//--------FUNCTIONS FOR GETTING REMOTE STYLES
export function getRemote(){

    // since there isn't a getRemoteTextStyles() method, we have to check every text node for text styles that aren't local
    figma.ui.postMessage({type:"load-update", text:`Finding library text styles...`});
   
    //retrieve all text nodes in file
    textNodes = figma.root.findAllWithCriteria({ types: ["TEXT"]});

    //start by processing 1st chunk of text nodes
    textIndex=0;
    remoteTextToUI=[];
    processRemoteChunk();
}

//checks a chunk of text nodes for new remote text styles
export function processRemoteChunk(chunkSize=100){

  let chunk = textNodes.slice(textIndex, textIndex + chunkSize);

  for(const node of chunk){
    
    let styleID = String(node.textStyleId);

    //check if node has a text style that isn't found yet
    if(styleID && !styleID.includes('Symbol') && !textStyles.has(styleID)){
      let style = figma.getStyleById(styleID) as TextStyle;
      //then check if that style is valid, then process style info
      if(style){ processStyle(style, remoteTextToUI, false); }
    }
  }
  textIndex = textIndex+chunkSize;

  //if we still have more text nodes to process, tell the UI to update loading screen progress
  //otherwise, send process remote text style info to UI
  if(chunk.length < chunkSize){
    figma.ui.postMessage({type:"display-text", data:remoteTextToUI});
    figma.ui.postMessage({type:"remote-text-complete"});
  }
  else{
    figma.ui.postMessage({type:"process-remote-text", text:`Checking ${textIndex}/${textNodes.length} text layers...`});
  }
}



//------------SEARCH FUNCTIONS
//gets no. of nodes using this style, sorted by page
//since style.consumers seems to give us invalid nodes ie nodes that don't exist in any pages,
//we'll have to count the no. of valid nodes manually
export async function getUsage(message){

  let outType = message.type.replace("scan", "update");
  let outPages = [];
  let totalCount = 0;

  figma.ui.postMessage({type:"load-start", text:`Scanning ${message.name} for usage...`});

  let consumers = figma.getStyleById(message.id).consumers;
  //pass the list of consumers into a set to remove duplicate consumers
  let uniqueConsumers = new Set(consumers);

  //process usage stats only if we have layers using that style
  if(uniqueConsumers.size > 0){

    // Step 1: Group Node IDs by Page ID
    let pageGroups = new Map();

    for(const consumer of uniqueConsumers){

      //get the corresponding page of each layer
      let page = findPageBottomUp(consumer.node as BaseNode);

      //only process page if it's found
      if(page){

        //if this page is new, we register an entry for it in the page map
        if(!pageGroups.has(page.id)){
          pageGroups.set(page.id, { id: page.id, name: page.name, nodeIDs: [] });
        }
        //slot the node id under its corresponding page
        pageGroups.get(page.id).nodeIDs.push(consumer.node.id);

        //update totalCount
        totalCount++;
      }
    }
    // Step 2: Convert to Desired Array Format
    outPages = Array.from(pageGroups.values());
  }
  figma.ui.postMessage({type:outType, id:message.id, totalCount:totalCount, pages:outPages});
  figma.ui.postMessage({type:"load-end"});
}



//searches recursively for page that node belongs to from the bottom up; more efficient but may not always work
function findPageBottomUp(node:BaseNode){
  if(node.parent){

      if(node.parent.type == 'PAGE'){
          return node.parent;
      }
      else{return findPageBottomUp(node.parent);}
  }
  else{
      return null;
  }
}


//deletes text style from user file and internal storage
export function deleteStyle(message){

  let textStyle = figma.getStyleById(message.id);
  if(textStyle){
    textStyle.remove();
    textStyles.delete(textStyle);
  }
}