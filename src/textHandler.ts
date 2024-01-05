let textStyles = new Set(), textNodes = [];
let uniqueConsumers, myIterator;




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
  figma.ui.postMessage({action:"display-text", data: textToUI});
}





//--------FUNCTIONS FOR GETTING REMOTE STYLES
export function getRemote(){

  myIterator = remoteIterator();
  swapFromPageChunk();
}

// since there isn't a getRemoteTextStyles() method, we have to check every text node for text styles that aren't local
function* remoteIterator(chunkSize=100){

  let counter = 0, textToUI=[];
  //retrieve all text nodes in file
  textNodes = figma.root.findAllWithCriteria({ types: ["TEXT"]});

  for(const node of textNodes){

    //check if this node's style is already included in the current list of text styles;
    //if not, then this style must be remote
    let styleID = String(node.textStyleId);
    if(styleID && !styleID.includes('Symbol') && !textStyles.has(styleID)){
      let style = figma.getStyleById(styleID) as TextStyle;
      if(style){ processStyle(style, textToUI, false); }
    }

    counter++;
    //updates loading screen after deleting each chunk of nodes
    if(counter % chunkSize == 0){
      yield {action:'load-remote-text-progress', text:`Checking ${counter} text layers...`};
    }
  }
  yield { action:'display-remote-text', data:textToUI };
}

export function remoteChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
}






//------------SEARCH FUNCTIONS
//gets no. of nodes using this style, sorted by page
//since style.consumers seems to give us invalid nodes ie nodes that don't exist in any pages,
//we'll have to count the no. of valid nodes manually
export function getUsage(message){

  let consumers = figma.getStyleById(message.id).consumers;
  //pass the list of consumers into a set to remove duplicate consumers
  uniqueConsumers = new Set(consumers);

  //sends data back immediately if no consumers are found
  if(uniqueConsumers.size == 0){
    figma.ui.postMessage({action:'update-text', id:message.id, totalCount:0, pages:[]});
  }
  //otherwise, we start processing our consumers in chunks
  else{
    myIterator = usageIterator(message.id);
    usageChunk();
  }
}

//generator function to iterate through set of unique consumers, either yields a "scan-text-progress" message
//if there are more consumers to process, or yields the final output
function* usageIterator(targetStyleID, chunkSize=100){

  let iterator = uniqueConsumers.values();
  let outPages = [], totalCount = 0, pageGroups = new Map();
  let done = false;

  while(!done){

    for (let i = 0; i < chunkSize; i++) {
      let nextValue = iterator.next();
      //exits the for loop if we've processed all nodes in uniqueConsumers
      if(nextValue.done){
        done = true;
        break;
      }
      let consumer = nextValue.value;
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
    if (!done) { yield { action:'scan-text-progress', text:`Processing ${totalCount}/${uniqueConsumers.size} layers...`} ; }
  }

  // After completing the iteration ie done == true, yield the final result
  if (pageGroups.size > 0) {
    outPages = Array.from(pageGroups.values());
    yield { action:'update-text', id:targetStyleID, totalCount, pages:outPages };
  }
}

//called by getUsage() or code.ts; just runs the generator function and post the yielded results
export function usageChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
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


//--------DELETES STYLE FROM USER FILE
export function deleteStyle(message){

  let textStyle = figma.getStyleById(message.id);
  if(textStyle){
    textStyle.remove();
    textStyles.delete(textStyle);
  }
}


//--------DELETES ALL LAYERS FROM STYLE
export function deleteAllLayers(message){
  
  myIterator = deleteAllIterator(message);
  deleteAllChunk();
}

function* deleteAllIterator(message, chunkSize=100){
  
  let counter = 0;
  for(const page of message.pages){
    for(const nodeID of page.nodeIDs){

      let node = figma.getNodeById(nodeID);
      if(node != null){ node.remove(); }

      counter++;
      //updates loading screen after deleting each chunk of nodes
      if(counter % chunkSize == 0){
        yield {action:'delete-all-text-progress', text:`Deleting ${counter} layers...`};
      }
    }
  }
  if(message.deleteStyle) { deleteStyle(message); }
  yield {action:'load-end'};
}

export function deleteAllChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
}



//----------------DELETES LAYERS FROM GIVEN PAGE
export function deleteFromPage(message){
  
  myIterator = deleteFromPageIterator(message);
  deleteFromPageChunk();
}

function* deleteFromPageIterator(message, chunkSize=100){
  
  let counter = 0;
  for(const nodeID of message.nodeIDs){

    let node = figma.getNodeById(nodeID);
    if(node != null){ node.remove(); }

    counter++;
    //updates loading screen after deleting each chunk of nodes
    if(counter % chunkSize == 0){
      yield {action:'delete-text-from-page-progress', text:`Deleting ${counter} layers...`};
    }
  }
  yield {action:'load-end'};
}

export function deleteFromPageChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
}






//--------SWAPS ALL LAYERS FROM STYLE
export function swapAllLayers(message){
  myIterator = swapAllIterator(message);
  swapAllChunk();
}

function* swapAllIterator(message, chunkSize=100){
  
  let counter = 0;
  for(const page of message.pages){
    for(const nodeID of page.nodeIDs){

      let node = figma.getNodeById(nodeID) as TextNode;
      if(node != null){ 
        node.textStyleId = message.swapID;
      }

      counter++;
      //updates loading screen after deleting each chunk of nodes
      if(counter % chunkSize == 0){
        yield {action:'swap-all-text-progress', text:`Swapping ${counter} layers...`};
      }
    }
  }
  if(message.deleteStyle) { deleteStyle(message); }

  //rescans swapped style if necessary
  if(message.rescanSwapped){
    yield {action:'scan-text-start', id:message.swapID, name:message.swapName};
  }
  else{
    yield {action:'load-end'};
  }
}

export function swapAllChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
}



//----------------SWAPS LAYERS FROM GIVEN PAGE
export function swapFromPage(message){
  
  myIterator = swapFromPageIterator(message);
  swapFromPageChunk();
}

function* swapFromPageIterator(message, chunkSize=100){
  
  let counter = 0;
  for(const nodeID of message.nodeIDs){

    let node = figma.getNodeById(nodeID) as TextNode;
    if(node != null){ 
      node.textStyleId = message.swapID;
    }

    counter++;
    //updates loading screen after deleting each chunk of nodes
    if(counter % chunkSize == 0){
      yield {action:'swap-text-from-page-progress', text:`Swapping ${counter} layers...`};
    }
  }

  //rescans swapped style if necessary
  if(message.rescanSwapped){
    yield {action:'scan-text-start', id:message.swapID, name:message.swapName};
  }
  else{
    yield {action:'load-end'};
  }
}

export function swapFromPageChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
}