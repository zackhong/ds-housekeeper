import * as textHandler from './textHandler';
import * as colorHandler from './colorHandler';
import * as compHandler from './compHandler';
import * as selectHandler from './selectionHandler';

let devModeEnabled = false;
figma.skipInvisibleInstanceChildren = false; //set to true to optimise node search using findAll() and findAllWithCriteria()
figma.showUI(__html__, {width: 400, height: 600});

figma.ui.onmessage = message => {
	switch(message.action){

		//-----LOAD LOCAL STYLES (CALLED ON INITIAL LOAD)
		case 'load-local-text':
		textHandler.getLocal();
		break;

		case 'load-local-colors':
		colorHandler.getLocal();
		break;

		case 'load-local-comps-start':
		compHandler.getLocal();
		break;

		case 'load-local-comps-continue':
		compHandler.runNextChunk();
		break;




		//-------LOAD REMOTE STYLES
		case 'load-remote-text-start':
		textHandler.getRemote();
		break;

		case 'load-remote-text-continue':
		textHandler.runNextChunk();
		break;

		case 'load-remote-colors-start':
		colorHandler.getRemote();
		break;

		case 'load-remote-colors-continue':
		colorHandler.runNextChunk();
		break;

		case 'load-remote-comps-start':
		compHandler.getRemote();
		break;

		case 'load-remote-comps-continue':
		compHandler.runNextChunk();
		// compHandler.remoteChunk();
		break;




		//-------SCAN STYLE FOR USAGE
		case 'scan-text-start': 
		textHandler.getUsage(message);
		break;

		case 'scan-text-continue': 
		textHandler.runNextChunk();
		break;

		case 'scan-color-start': 
		colorHandler.getUsage(message);
		break;

		case 'scan-color-continue': 
		colorHandler.runNextChunk();
		break;
		
		case 'scan-comp-start':
		compHandler.getUsage(message);
		break;

		case 'scan-comp-continue': 
		compHandler.runNextChunk();
		// compHandler.usageChunk();
		break;






		//---------VIEW AND SELECT
		case 'view-local-comp':
		compHandler.viewLocalComp(message);
		break;

		case 'select-start':
		selectHandler.viewSelection(message);
		break;

		case 'select-continue':
		selectHandler.processChunk();
		break;





		//-----------DELETE STYLES
		case 'delete-text':
		textHandler.deleteStyle(message);
		break;

		case 'delete-color':
		colorHandler.deleteStyle(message);
		break;

		case 'delete-comp':
		compHandler.deleteStyle(message);
		break;

		//------------DELETE ALL LAYERS FROM STYLE
		case 'delete-all-text':
		textHandler.deleteAllLayers(message);
		break;

		case 'delete-all-text-continue':
		textHandler.runNextChunk();
		break;

		case 'delete-all-color':
		colorHandler.deleteAllLayers(message);
		break;

		case 'delete-all-color-continue':
		colorHandler.runNextChunk();
		break;

		case 'delete-all-comp':
		compHandler.deleteAllLayers(message);
		break;

		case 'delete-all-comp-continue':
		compHandler.runNextChunk();
		// compHandler.deleteAllChunk();
		break;


		//-------------DELETE LAYERS FROM PAGE
		case 'delete-text-from-page':
		textHandler.deleteFromPage(message);
		break;

		case 'delete-text-from-page-continue':
		textHandler.runNextChunk();
		break;

		case 'delete-color-from-page':
		colorHandler.deleteFromPage(message);
		break;

		case 'delete-color-from-page-continue':
		colorHandler.runNextChunk();
		break;

		case 'delete-comp-from-page':
		compHandler.deleteFromPage(message);
		break;

		case 'delete-comp-from-page-continue':
		compHandler.runNextChunk();
		break;





		//-------------SWAP ALL LAYERS FROM STYLE
		case 'swap-all-text':
		textHandler.swapAllLayers(message);
		break;

		case 'swap-all-text-continue':
		textHandler.runNextChunk();
		break;

		case 'swap-all-color':
		colorHandler.swapAllLayers(message);
		break;

		case 'swap-all-color-continue':
		colorHandler.runNextChunk();
		break;

		case 'swap-all-comp':
		compHandler.swapAllLayers(message);
		break;

		case 'swap-all-comp-continue':
		compHandler.runNextChunk();
		break;


		//-------------SWAP LAYERS FROM PAGE
		case 'swap-text-from-page':
		textHandler.swapFromPage(message);
		break;

		case 'swap-text-from-page-continue':
		textHandler.runNextChunk();
		break;

		case 'swap-color-from-page':
		colorHandler.swapFromPage(message);
		break;

		case 'swap-color-from-page-continue':
		colorHandler.runNextChunk();
		break;

		case 'swap-comp-from-page':
		compHandler.swapFromPage(message);
		break;

		case 'swap-comp-from-page-continue':
		compHandler.runNextChunk();
		break;



		//-------------RESET UI
		case 'reset-ui':
		textHandler.reset();
		colorHandler.reset();
		compHandler.reset();
		figma.ui.postMessage({action:"load-local-text"});
		break;
	}
};

// This function is called when the selection changes
function onSelectionChange() {
    // Get the current selection
    const selection = figma.currentPage.selection;

    // Check if at least one node is selected
    if (selection.length > 0) {
        // Get the first selected node
        const node = selection[0];

        // Retrieve the ID and name of the node
        const nodeId = node.id;
        const nodeName = node.name;
		const type = node.type;

		// Log the ID and name
        console.log(`Name: ${nodeName}, Type: ${type}, ID: ${nodeId}`);

		// get stats of its parent, if any
		if(node.type == "INSTANCE"){

			const comp = (node as InstanceNode).mainComponent;
			if(comp){
				console.log(`Main Comp: ${comp.name}, Type: ${comp.type}, ID: ${comp.id}`);

				const variant = comp.parent;
				if(variant){
					console.log(`Variant: ${variant.name}, Type: ${variant.type}, ID: ${variant.id}`);
				}
			}
		}
    }
}

if(devModeEnabled){
	// Add the event listener for selection changes
	figma.on("selectionchange", onSelectionChange);
}