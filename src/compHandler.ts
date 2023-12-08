let compStyles = new Set();
let instances = [];
let compIndex;
let remoteCompsToUI;





//------------------FUNCTIONS FOR LOCAL STYLES
export function getLocal() {

  figma.ui.postMessage({type:"load-update", text:`Finding local components...`});

  let comps = figma.root.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"]});
  //filter out components which already belong to a variant
  comps = comps.filter(node => node.parent.type !== "COMPONENT_SET");
  
  let compsToUI = [];
  for (const node of comps) {

    if(!compStyles.has(node.id)){
      compStyles.add(node.id);
      compsToUI.push({id: node.id, name: node.name, isLocal:true});
    }
  }
  figma.ui.postMessage({type:"display-comps", data: compsToUI});
}




//--------FUNCTIONS FOR GETTING REMOTE STYLES
export function getRemote(){

  figma.ui.postMessage({type:"load-update", text:`Finding library components...`});

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
    figma.ui.postMessage({type:"display-comps", data:remoteCompsToUI});
    figma.ui.postMessage({type:"remote-comp-complete"});
  }
  else{
    figma.ui.postMessage({type:"process-remote-comp", text:`Checking ${compIndex}/${instances.length} instances...`});
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
  let uniqueInstances;
  let pageGroups = new Map();
  let outPages = {};
  let totalCount = 0;
  let outType = message.type.replace("scan", "update");

  figma.ui.postMessage({type:"load-start", text:`Scanning ${message.name} for usage...`});
  let comp = figma.getNodeById(message.id);
  
  //first, we get the list of instances from the input component
  if(comp.type == 'COMPONENT'){ compInstances = comp.instances; }
  //if we're reading a variant, compile the list of instances from all its children
  else if(comp.type == 'COMPONENT_SET'){
    for(const child of comp.children){
      compInstances.concat((child as ComponentNode).instances);
    }
  }

  //next, we run instances through a set to remove duplicate entries
  uniqueInstances = new Set(compInstances);

  for(const instance of uniqueInstances){

    //find corresponding page for node
    let page = findPageBottomUp(instance as BaseNode);

    //add page to sorting process if it's found
    if(page){  
      if(!pageGroups.has(page.id)){
        pageGroups.set(page.id, { id: page.id, name: page.name, nodeIDs: [] });
      }
      pageGroups.get(page.id).nodeIDs.push(instance.id);
      totalCount ++;
    }
  }
  outPages = Array.from(pageGroups.values());

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






//----------------------DELETE FUNCTIONS
export function deleteStyle(message){

  let comp = figma.getNodeById(message.id);
  if(comp){
    comp.remove();
    compStyles.delete(comp);
  }
}