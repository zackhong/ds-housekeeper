import * as textHandler from './textHandler';
import * as colorHandler from './colorHandler';
import * as compHandler from './compHandler';

figma.skipInvisibleInstanceChildren = false; //set to true to optimise node search using findAll() and findAllWithCriteria()
figma.showUI(__html__, {width: 400, height: 600});

figma.ui.onmessage = message => {
	switch(message.type){

		case 'start':
		figma.ui.postMessage({type:"load-start"});
		textHandler.getLocal();
		colorHandler.getLocal();
		compHandler.getLocal();
		figma.ui.postMessage({type:"load-end"});
		break;

		case 'process-remote-text':
		textHandler.processRemoteChunk();
		break;

		case 'process-remote-color':
		colorHandler.processRemoteChunk();
		break;

		case 'scan-text': 
		textHandler.getUsage(message);
		break;

		case 'scan-color': 
		colorHandler.getUsage(message);
		break;
		
		case 'scan-comp':
		compHandler.getUsage(message);
		break;

		case 'view-local-comp':
		compHandler.viewLocalComp(message);
		break;

		case 'view-selection':
		viewSelection(message);
		break;

		case 'delete-text':
		textHandler.deleteStyle(message);
		break;

		case 'delete-color':
		colorHandler.deleteStyle(message);
		break;

		case 'delete-comp':
		compHandler.deleteStyle(message);
		break;
	}
};


function viewSelection(message, selectionLimit=500){
	//calls up loading screen if selection is qte large
	if(message.nodeIDs.length > selectionLimit){
	  figma.ui.postMessage({type:"load-start"});
	}
  
	//takes in page id and list of node ids
	let selectedNodes = [];
	let i=1;
  
	//first, move to the targeted page
	figma.currentPage = figma.getNodeById(message.id) as PageNode;
	//find every corresponding node in selection and tell Figma to zoom unto selection
	for(const id of message.nodeIDs){
	  selectedNodes.push(figma.getNodeById(id) as SceneNode);
	  if(message.nodeIDs.length > selectionLimit){
		figma.ui.postMessage({type:"load-progress", text:`Selecting ${i}/${message.nodeIDs.length} objects...`});
	  }
	  i++;
	}
	//then set selection on that page to be our selected nodes
	figma.currentPage.selection = selectedNodes;
	//then tell figma to zoom into view
	figma.viewport.scrollAndZoomIntoView(selectedNodes);
  
	if(message.nodeIDs.length > selectionLimit){
	  figma.ui.postMessage({type:"load-end"});
	}
}
