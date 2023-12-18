import * as textHandler from './textHandler';
import * as colorHandler from './colorHandler';
import * as compHandler from './compHandler';
import * as selectHandler from './selectionHandler';

figma.skipInvisibleInstanceChildren = false; //set to true to optimise node search using findAll() and findAllWithCriteria()
figma.showUI(__html__, {width: 400, height: 600});

figma.ui.onmessage = message => {
	switch(message.action){

		//-----INITIAL LOADING SEQUENCE
		case 'load-local-text':
		textHandler.getLocal();
		break;

		case 'load-local-colors':
		colorHandler.getLocal();
		break;

		case 'load-local-comps-start':
		compHandler.startLocal();
		break;

		case 'load-local-comps-continue':
		compHandler.processLocalChunk();
		break;

		//-------SCAN STYLE FOR USAGE
		case 'scan-text-start': 
		textHandler.getUsage(message);
		break;

		case 'scan-text-continue': 
		textHandler.usageChunk();
		break;

		case 'scan-color-start': 
		colorHandler.getUsage(message);
		break;

		case 'scan-color-continue': 
		colorHandler.usageChunk();
		break;
		
		case 'scan-comp-start':
		compHandler.getUsage(message);
		break;

		case 'scan-comp-continue': 
		compHandler.usageChunk();
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
		textHandler.deleteAllChunk();
		break;

		case 'delete-all-color':
		colorHandler.deleteAllLayers(message);
		break;

		case 'delete-all-color-continue':
		colorHandler.deleteAllChunk();
		break;

		case 'delete-all-comp':
		compHandler.deleteAllLayers(message);
		break;

		case 'delete-all-comp-continue':
		compHandler.deleteAllChunk();
		break;


		//-------------DELETE LAYERS FROM PAGE
		case 'delete-text-from-page':
		textHandler.deleteFromPage(message);
		break;

		case 'delete-text-from-page-continue':
		textHandler.deleteFromPageChunk();
		break;

		case 'delete-color-from-page':
		colorHandler.deleteFromPage(message);
		break;

		case 'delete-color-from-page-continue':
		colorHandler.deleteFromPageChunk();
		break;

		case 'delete-comp-from-page':
		compHandler.deleteFromPage(message);
		break;

		case 'delete-comp-from-page-continue':
		compHandler.deleteFromPageChunk();
		break;



		//-------------SWAP ALL LAYERS OF SELECTED STYLE
	}
};