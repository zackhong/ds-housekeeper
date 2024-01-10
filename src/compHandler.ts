let compStyles = new Set();
let uniqueInstances, myIterator;




//-------FOR RUNNING THROUGH ITERATOR FUNCTIONS
export function runNextChunk(){
  let nextChunk = myIterator.next();
  figma.ui.postMessage(nextChunk.value);
}







//------------------FUNCTIONS FOR LOCAL STYLES
export function getLocal() {

  myIterator = localIterator();
  runNextChunk();
}

function* localIterator(chunkSize=100){

  let comps = figma.root.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"]});
  //filter out components which already belong to a variant
  comps = comps.filter(node => node.parent.type !== "COMPONENT_SET");
  
  let counter = 0, compsToUI = [];

  for(const node of comps){

    if(!compStyles.has(node.id)){
      compStyles.add(node.id);
      compsToUI.push({id:node.id, name:node.name, isLocal:true});
    }

    counter++;
    //updates loading screen after processing every chunk
    if(counter % chunkSize == 0){
      yield {action:"load-local-comps-progress", text:`Processing ${counter}/${comps.length} local components...`};
    }
  }
  yield {action:"display-local-comps", data:compsToUI};
}








//--------FUNCTIONS FOR GETTING REMOTE STYLES
export function getRemote(){

  myIterator = remoteIterator();
  runNextChunk();
}

function* remoteIterator(chunkSize=100){

  let counter = 0, compsToUI = [];
  //find every instance node in file
  let instances = figma.root.findAllWithCriteria({ types: ["INSTANCE"]});

  for(const node of instances){
    let comp = findRootComponent(node as InstanceNode);
    //check if we can find component that instance belongs to, and that component isn't already stored inside 
    if(comp && !compStyles.has(comp.id)){
      compStyles.add(comp.id);
      compsToUI.push({id:comp.id, name:comp.name, isLocal:false});
    }
    counter++;
    //updates loading screen after processing every chunk
    if(counter % chunkSize == 0){
      yield {action:'load-remote-comps-progress', text:`Checking ${counter} instances...`};
    }
  }
  yield { action:'display-remote-comps', data:compsToUI };
}

function findRootComponent(node:InstanceNode){

  let comp = node.mainComponent;
  if(comp){
    let parent = comp.parent;
    if(parent && parent.type == "COMPONENT_SET"){return parent;}
    else {return comp;}
  }
  else return null;
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
    runNextChunk();
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
  runNextChunk();
  // deleteAllChunk();
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








//----------------DELETES LAYERS FROM GIVEN PAGE
export function deleteFromPage(message){
  
  myIterator = deleteFromPageIterator(message);
  runNextChunk();
  // deleteFromPageChunk();
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







//----------------------SWAPS ALL LAYERS FROM STYLE
export function swapAllLayers(message){

  myIterator = swapIterator(message);
  runNextChunk();
  // swapAllChunk();
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








//----------------SWAPS LAYERS FROM GIVEN PAGE
export function swapFromPage(message){
  
  myIterator = swapFromPageIterator(message);
  runNextChunk();
  // swapFromPageChunk();
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





//--------------RESET
export function reset(){
  compStyles = new Set();
}