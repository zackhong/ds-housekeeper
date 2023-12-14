let limit=50, selectIterator;

export function viewSelection(message){
	
    selectIterator = chunkIterator(message.name, message.id, message.nodeIDs,limit);
    processChunk();
}

function* chunkIterator(name, pageID, nodeIDs, chunkSize=100){

    let selectedNodes = [];
    //first, move to the targeted page
	figma.currentPage = figma.getNodeById(pageID) as PageNode;

    //only start showing loading screen if # of nodes exceed our limit
    if(nodeIDs.length > limit){
        figma.ui.postMessage({action:"load-start", text:`Viewing selection at ${name}...`});
        yield {action:"select-progress", text:`Finding objects...`}
    }

    for(let i=0; i<nodeIDs.length; i += chunkSize){

        let chunk = nodeIDs.slice(i, i+chunkSize);
        for(const id of chunk){
            selectedNodes.push(figma.getNodeById(id) as SceneNode);
        }
        //updates loading screen if # of nodes exceed the limit 
        if(nodeIDs.length > chunkSize){
            yield {action:"select-progress", text:`Selecting ${i+chunk.length}/${nodeIDs.length} objects...`}
        }
    }
    //then set selection on that page to be our selected nodes, then tell figma to zoom into view
	figma.currentPage.selection = selectedNodes;
	figma.viewport.scrollAndZoomIntoView(selectedNodes);
    //tell loading screen to hide if it was showing previously ie # of nodeIDs > limit
    if(nodeIDs.length > chunkSize){
        yield {action:"load-end"};
    }
}

export function processChunk(){
    let nextChunk = selectIterator.next();
    if(!nextChunk.done){
        figma.ui.postMessage(nextChunk.value);
    }
}
