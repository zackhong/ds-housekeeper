let colorStyles = new Set(), colorNodes = [];
let colorIndex, remoteColorsToUI;

let uniqueConsumers, myIterator;



//--------------HELPER FUNCTIONS
//using Promise and setTimeout to temp. pause plugin code so UI has time to update
function delay(timeInMs:number){ return new Promise( (resolve)=> setTimeout(resolve, timeInMs) ); }


// Convert values from Figma's color object to an rgba string 
// this converts an rgb component (ranging from 0 to 255) to its hex representation
function componentToHex(c) {
  const hex = c.toString(16);
  //prepends output with '0' if it's only 1 char long
  return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  const red = componentToHex(Math.round(r * 255));
  const green = componentToHex(Math.round(g * 255));
  const blue = componentToHex(Math.round(b * 255));
  return `#${red}${green}${blue}`;
}

//extracts style info and adds it to its appropriate array
function processStyle(style, outArray, isLocal=true){

  const styleName = style.name;
      const colorType = style.paints[0].type;
      let styleInfo ={};
      // if this color is a solid color, store its rgb value and opacity
      if(colorType == 'SOLID'){
        styleInfo = {
          subtype:colorType,
          hex:rgbToHex(
            style.paints[0].color.r, 
            style.paints[0].color.g, 
            style.paints[0].color.b), 
          opacity: Math.floor(style.paints[0].opacity*100)+'%'};
      }
      else{ styleInfo = {subtype:colorType}; }
      
      colorStyles.add(style.id);
      outArray.push( {id:style.id, name:styleName, info:styleInfo, isLocal:isLocal});
}






export function getLocal(){

  const localColorStyles = figma.getLocalPaintStyles();
  let colorsToUI = [];

  for (const style of localColorStyles) {
    if(!colorStyles.has(style.id)){ processStyle(style, colorsToUI); }
  }
  figma.ui.postMessage({action:"display-colors", data: colorsToUI});
}





export function getRemote(){

  // since there isn't a getRemotePaintStyles() method, we have to check every node for color styles that aren't local
  figma.ui.postMessage({action:"load-update", text:`Finding library color styles...`});

  colorNodes = figma.root.findAllWithCriteria({ types: [
    "BOOLEAN_OPERATION", "COMPONENT", "COMPONENT_SET", "INSTANCE",
    "ELLIPSE", "STAR", "RECTANGLE", "LINE", "POLYGON", "VECTOR",
    "FRAME", "TEXT" ]});

    //start by processing 1st chunk of color nodes
    colorIndex=0;
    remoteColorsToUI=[];
    processRemoteChunk();
}

//checks a chunk of text nodes for new remote text styles
export function processRemoteChunk(chunkSize=100){

  let chunk = colorNodes.slice(colorIndex, colorIndex + chunkSize);

  for(const node of chunk){
    
    //check the fill and stroke of every node to see if it's already registered
    let fillID = String(node.fillStyleId);
    if(fillID && !fillID.includes('Symbol') && !colorStyles.has(fillID)){

      let style = figma.getStyleById(fillID) as PaintStyle;
      if(style){ processStyle(style, remoteColorsToUI, false); }
    }

    let strokeID = String(node.strokeStyleId);
    if(strokeID && !strokeID.includes('Symbol') && !colorStyles.has(strokeID)){

      let style = figma.getStyleById(strokeID) as PaintStyle;
      if(style){ processStyle(style, remoteColorsToUI, false); }
    }
  }
  colorIndex = colorIndex+chunkSize;

  //if we still have more color nodes to process, tell the UI to update loading screen progress
  //otherwise, send process remote color style info to UI
  if(chunk.length < chunkSize){
    figma.ui.postMessage({action:"display-colors", data:remoteColorsToUI});
    figma.ui.postMessage({action:"remote-color-complete"});
  }
  else{
    figma.ui.postMessage({action:"process-remote-color", text:`Checking ${colorIndex}/${colorNodes.length} layers...`});
  }
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
    figma.ui.postMessage({action:'update-color', id:message.id, totalCount:0, pages:[]});
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
    if (!done) { yield { action:'scan-color-progress', text:`Processing ${totalCount}/${uniqueConsumers.size} layers...`} ; }
  }

  // After completing the iteration ie done == true, yield the final result
  if (pageGroups.size > 0) {
    outPages = Array.from(pageGroups.values());
    yield { action:'update-color', id:targetStyleID, totalCount, pages:outPages };
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

  let colorStyle = figma.getStyleById(message.id);
  if(colorStyle){
    colorStyle.remove();
    colorStyles.delete(colorStyle);
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
        yield {action:'delete-all-color-progress', text:`Deleting ${counter} layers...`};
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
      yield {action:'delete-color-from-page-progress', text:`Deleting ${counter} layers...`};
    }
  }
  yield {action:'load-end'};
}

export function deleteFromPageChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
}