import * as Helper from './helper';

figma.skipInvisibleInstanceChildren = false; //set to true to optimise node search using findAll() and findAllWithCriteria()
figma.showUI(__html__, {width: 400, height: 600});

figma.ui.onmessage = msg => {
	
	switch(msg.type){

		case'start':
		//retrieve styles and components from user file
		processStyles();
		break;
	}
};

async function processStyles() {
	await Helper.getLocalText();
	await Helper.getLocalColors();
	await Helper.getLocalComps();
	figma.ui.postMessage({type:"load-end"});
}
