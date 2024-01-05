let compStyles = new Set();
let comps = [], instances = [];
let compIndex, localCompsToUI, remoteCompsToUI;

let uniqueInstances, myIterator;





//------------------FUNCTIONS FOR LOCAL STYLES
export function startLocal() {

  comps = figma.root.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"]});
  //filter out components which already belong to a variant
  comps = comps.filter(node => node.parent.type !== "COMPONENT_SET");
  
  compIndex = 0;
  localCompsToUI = [];
  processLocalChunk();
}

export function processLocalChunk(chunkSize=100){

  let chunk = comps.slice(compIndex, compIndex + chunkSize);
  for(const node of chunk){

    if(!compStyles.has(node.id)){
      compStyles.add(node.id);
      localCompsToUI.push({id: node.id, name: node.name, isLocal:true});
    }
  }
  compIndex = compIndex + chunkSize;

  if(chunk.length < chunkSize){
    figma.ui.postMessage({action:"display-comps", data:localCompsToUI});
  }
  else{
    figma.ui.postMessage({action:"load-local-comps-progress", text:`Processing ${compIndex}/${comps.length} local components...`});
  }
}




//--------FUNCTIONS FOR GETTING REMOTE STYLES
export function getRemote(){

  figma.ui.postMessage({action:"load-update", text:`Finding library components...`});

  instances = figma.root.findAllWithCriteria({ types: ["INSTANCE"]});

  //start by processing 1st chunk of instance nodes
  compIndex=0;
  remoteCompsToUI=[];
  processRemoteChunk();
}

export function processRemoteChunk(chunkSize=100){

  let chunk = instances.slice(compIndex, compIndex + chunkSize);

  for(const instance of chunk){

    if(!compStyles.has(instance.id)){
      compStyles.add(instance.id);
      remoteCompsToUI.push({id:instance.id, name:instance.name, isLocal:false});
    }
  }
  compIndex = compIndex + chunkSize;
  //if we still have more color nodes to process, tell the UI to update loading screen progress
  //otherwise, send process remote color style info to UI
  if(chunk.length < chunkSize){
    figma.ui.postMessage({action:"display-comps", data:remoteCompsToUI});
    figma.ui.postMessage({action:"remote-comp-complete"});
  }
  else{
    figma.ui.postMessage({action:"process-remote-comp", text:`Checking ${compIndex}/${instances.length} instances...`});
  }
}





//zooms unto component in user file; only for local components
export function viewLocalComp(message){

  let selectedComp = figma.getNodeById(message.id) as SceneNode;
  let selectedPage = findPageBottomUp(selectedComp);

  figma.currentPage = selectedPage;
  figma.currentPage.selection = [selectedComp];
  figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
}




//------------SEARCH FUNCTIONS
//gets no. of nodes using this style, sorted by page
export function getUsage(message){

  let compInstances = [];
  let comp = figma.getNodeById(message.id);
  
  //first, we get the list of instances from the input component
  if(comp.type == 'COMPONENT'){ compInstances = comp.instances; }
  //if we're reading a variant, compile the list of instances from all its children
  else if(comp.type == 'COMPONENT_SET'){
    for(const child of comp.children){
      let childInstances = (child as ComponentNode).instances;
      compInstances = compInstances.concat(childInstances);
    }
  }
  //next, we run instances through a set to remove duplicate entries
  uniqueInstances = new Set(compInstances);

  //sends data back immediately if no consumers are found
  if(uniqueInstances.size == 0){
    figma.ui.postMessage({action:'update-comp', id:message.id, totalCount:0, pages:[]});
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

  let iterator = uniqueInstances.values();
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
      let instance = nextValue.value;
      //get the corresponding page of each layer
      let page = findPageBottomUp(instance as BaseNode);

      //only process page if it's found
      if(page){

        //if this page is new, we register an entry for it in the page map
        if(!pageGroups.has(page.id)){
          pageGroups.set(page.id, { id: page.id, name: page.name, nodeIDs: [] });
        }
        //slot the node id under its corresponding page
        pageGroups.get(page.id).nodeIDs.push(instance.id);

        //update totalCount
        totalCount++;
      }
    }
    if (!done) { yield { action:'scan-comp-progress', text:`Processing ${totalCount}/${uniqueInstances.size} instances...`} ; }
  }

  // After completing the iteration ie done == true, yield the final result
  if (pageGroups.size > 0) {
    outPages = Array.from(pageGroups.values());
    yield { action:'update-comp', id:targetStyleID, totalCount, pages:outPages };
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






//----------------------DELETE STYLE
export function deleteStyle(message){

  let comp = figma.getNodeById(message.id);
  if(comp){
    comp.remove();
    compStyles.delete(comp);
  }
}




//----------------------DELETE ALL LAYERS FROM STYLE
export function deleteAllLayers(message){
  
  myIterator = deleteIterator(message);
  deleteAllChunk();
}

function* deleteIterator(message, chunkSize=100){
  
  let counter = 0;
  for(const page of message.pages){
    for(const nodeID of page.nodeIDs){

      let node = figma.getNodeById(nodeID);
      if(node != null){ node.remove(); }

      counter++;
      //updates loading screen after deleting each chunk of nodes
      if(counter % chunkSize == 0){
        yield {action:'delete-all-comp-progress', text:`Deleting ${counter} instances...`};
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
      yield {action:'delete-comp-from-page-progress', text:`Deleting ${counter} instances...`};
    }
  }
  yield {action:'load-end'};
}

export function deleteFromPageChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
}





//----------------------SWAPS ALL LAYERS FROM STYLE
export function swapAllLayers(message){
  myIterator = swapIterator(message);
  swapAllChunk();
}

function* swapIterator(message, chunkSize=100){
  
  let counter = 0;
  let swapNode = figma.getNodeById(message.swapID);
  //if swapped node is variant, we want instances to swap to its first child by default
  if(swapNode.type == 'COMPONENT_SET'){
    swapNode = (swapNode as ComponentSetNode).children[0] as ComponentNode;
  }

  for(const page of message.pages){
    for(const nodeID of page.nodeIDs){

      let node = figma.getNodeById(nodeID) as InstanceNode;
      if(node != null){ 
        //swaps instance to use another component
        node.swapComponent(swapNode as ComponentNode);
      }

      counter++;
      //updates loading screen after deleting each chunk of nodes
      if(counter % chunkSize == 0){
        yield {action:'swap-all-comp-progress', text:`Swapping ${counter} instances...`};
      }
    }
  }
  if(message.deleteStyle) { deleteStyle(message); }
  //rescans swapped style if necessary
  if(message.rescanSwapped){
    yield {action:'scan-comp-start', id:message.swapID, name:message.swapName};
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
  let swapNode = figma.getNodeById(message.swapID);
  //if swapped node is variant, we want instances to swap to its first child by default
  if(swapNode.type == 'COMPONENT_SET'){
    swapNode = (swapNode as ComponentSetNode).children[0] as ComponentNode;
  }

  for(const nodeID of message.nodeIDs){

    let node = figma.getNodeById(nodeID) as InstanceNode;
    if(node != null){ 
      //swaps instance to use another component
      node.swapComponent(swapNode as ComponentNode);
    }

    counter++;
    //updates loading screen after deleting each chunk of nodes
    if(counter % chunkSize == 0){
      yield {action:'swap-comp-from-page-progress', text:`Swapping ${counter} instances...`};
    }
  }
  //rescans swapped style if necessary
  if(message.rescanSwapped){
    yield {action:'scan-comp-start', id:message.swapID, name:message.swapName};
  }
  else{
    yield {action:'load-end'};
  }
}

export function swapFromPageChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
}