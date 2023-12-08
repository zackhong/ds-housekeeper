'use strict';

let textStyles = new Set();
let textNodes = [];
let textIndex;
let remoteTextToUI;
//--------------HELPER FUNCTIONS
function processStyle$1(style, outArray, isLocal = true) {
    const styleName = style.name;
    //get info like font name, font weight, font size and line height
    const fontName = style.fontName.family;
    const fontWeight = style.fontName.style;
    const fontSize = style.fontSize;
    let lineHeight;
    if (style.lineHeight.unit === 'AUTO') {
        lineHeight = 'auto';
    }
    else if (style.lineHeight.unit === 'PERCENT') {
        lineHeight = Math.floor(style.lineHeight.value) + '%';
    }
    else if (style.lineHeight.unit === 'PIXELS') {
        lineHeight = style.lineHeight.value;
    }
    const styleInfo = { fontName: fontName, fontWeight: fontWeight, fontSize: fontSize, lineHeight: lineHeight };
    //finally, register this style into textStyles for next check
    textStyles.add(style.id);
    outArray.push({ id: style.id, name: styleName, info: styleInfo, isLocal: isLocal });
}
//------------------FUNCTIONS FOR LOCAL STYLES
function getLocal$2() {
    figma.ui.postMessage({ type: "load-update", text: `Finding local text styles...` });
    const localTextStyles = figma.getLocalTextStyles();
    let textToUI = [];
    for (const style of localTextStyles) {
        style.id;
        //only process this style if it isn't a duplicate
        if (!textStyles.has(style.id)) {
            processStyle$1(style, textToUI);
        }
    }
    //finally, convert processed text style  to serializable form
    figma.ui.postMessage({ type: "display-text", data: textToUI });
}
//checks a chunk of text nodes for new remote text styles
function processRemoteChunk$1(chunkSize = 100) {
    let chunk = textNodes.slice(textIndex, textIndex + chunkSize);
    for (const node of chunk) {
        let styleID = String(node.textStyleId);
        //check if node has a text style that isn't found yet
        if (styleID && !styleID.includes('Symbol') && !textStyles.has(styleID)) {
            let style = figma.getStyleById(styleID);
            //then check if that style is valid, then process style info
            if (style) {
                processStyle$1(style, remoteTextToUI, false);
            }
        }
    }
    textIndex = textIndex + chunkSize;
    //if we still have more text nodes to process, tell the UI to update loading screen progress
    //otherwise, send process remote text style info to UI
    if (chunk.length < chunkSize) {
        figma.ui.postMessage({ type: "display-text", data: remoteTextToUI });
        figma.ui.postMessage({ type: "remote-text-complete" });
    }
    else {
        figma.ui.postMessage({ type: "process-remote-text", text: `Checking ${textIndex}/${textNodes.length} text layers...` });
    }
}
//------------SEARCH FUNCTIONS
//gets no. of nodes using this style, sorted by page
//since style.consumers seems to give us invalid nodes ie nodes that don't exist in any pages,
//we'll have to count the no. of valid nodes manually
async function getUsage$2(message) {
    let outType = message.type.replace("scan", "update");
    let outPages = [];
    let totalCount = 0;
    figma.ui.postMessage({ type: "load-start", text: `Scanning ${message.name} for usage...` });
    let consumers = figma.getStyleById(message.id).consumers;
    //pass the list of consumers into a set to remove duplicate consumers
    let uniqueConsumers = new Set(consumers);
    //process usage stats only if we have layers using that style
    if (uniqueConsumers.size > 0) {
        // Step 1: Group Node IDs by Page ID
        let pageGroups = new Map();
        for (const consumer of uniqueConsumers) {
            //get the corresponding page of each layer
            let page = findPageBottomUp$2(consumer.node);
            //only process page if it's found
            if (page) {
                //if this page is new, we register an entry for it in the page map
                if (!pageGroups.has(page.id)) {
                    pageGroups.set(page.id, { id: page.id, name: page.name, nodeIDs: [] });
                }
                //slot the node id under its corresponding page
                pageGroups.get(page.id).nodeIDs.push(consumer.node.id);
                //update totalCount
                totalCount++;
            }
        }
        // Step 2: Convert to Desired Array Format
        outPages = Array.from(pageGroups.values());
    }
    figma.ui.postMessage({ type: outType, id: message.id, totalCount: totalCount, pages: outPages });
    figma.ui.postMessage({ type: "load-end" });
}
//searches recursively for page that node belongs to from the bottom up; more efficient but may not always work
function findPageBottomUp$2(node) {
    if (node.parent) {
        if (node.parent.type == 'PAGE') {
            return node.parent;
        }
        else {
            return findPageBottomUp$2(node.parent);
        }
    }
    else {
        return null;
    }
}
//deletes text style from user file and internal storage
function deleteStyle$2(message) {
    let textStyle = figma.getStyleById(message.id);
    if (textStyle) {
        textStyle.remove();
        textStyles.delete(textStyle);
    }
}

let colorStyles = new Set();
let colorNodes = [];
let colorIndex;
let remoteColorsToUI;
//--------------HELPER FUNCTIONS
//using Promise and setTimeout to temp. pause plugin code so UI has time to update
function delay(timeInMs) { return new Promise((resolve) => setTimeout(resolve, timeInMs)); }
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
function processStyle(style, outArray, isLocal = true) {
    const styleName = style.name;
    const colorType = style.paints[0].type;
    let styleInfo = {};
    // if this color is a solid color, store its rgb value and opacity
    if (colorType == 'SOLID') {
        styleInfo = {
            subtype: colorType,
            hex: rgbToHex(style.paints[0].color.r, style.paints[0].color.g, style.paints[0].color.b),
            opacity: Math.floor(style.paints[0].opacity * 100) + '%'
        };
    }
    else {
        styleInfo = { subtype: colorType };
    }
    colorStyles.add(style.id);
    outArray.push({ id: style.id, name: styleName, info: styleInfo, isLocal: isLocal });
}
function getLocal$1() {
    figma.ui.postMessage({ type: "load-update", text: `Finding local color styles...` });
    const localColorStyles = figma.getLocalPaintStyles();
    let colorsToUI = [];
    for (const style of localColorStyles) {
        if (!colorStyles.has(style.id)) {
            processStyle(style, colorsToUI);
        }
    }
    figma.ui.postMessage({ type: "display-colors", data: colorsToUI });
}
//checks a chunk of text nodes for new remote text styles
function processRemoteChunk(chunkSize = 100) {
    let chunk = colorNodes.slice(colorIndex, colorIndex + chunkSize);
    for (const node of chunk) {
        //check the fill and stroke of every node to see if it's already registered
        let fillID = String(node.fillStyleId);
        if (fillID && !fillID.includes('Symbol') && !colorStyles.has(fillID)) {
            let style = figma.getStyleById(fillID);
            if (style) {
                processStyle(style, remoteColorsToUI, false);
            }
        }
        let strokeID = String(node.strokeStyleId);
        if (strokeID && !strokeID.includes('Symbol') && !colorStyles.has(strokeID)) {
            let style = figma.getStyleById(strokeID);
            if (style) {
                processStyle(style, remoteColorsToUI, false);
            }
        }
    }
    colorIndex = colorIndex + chunkSize;
    //if we still have more color nodes to process, tell the UI to update loading screen progress
    //otherwise, send process remote color style info to UI
    if (chunk.length < chunkSize) {
        figma.ui.postMessage({ type: "display-colors", data: remoteColorsToUI });
        figma.ui.postMessage({ type: "remote-color-complete" });
    }
    else {
        figma.ui.postMessage({ type: "process-remote-color", text: `Checking ${colorIndex}/${colorNodes.length} layers...` });
    }
}
//------------SEARCH FUNCTIONS
//gets no. of nodes using this style, sorted by page
//since style.consumers seems to give us invalid nodes ie nodes that don't exist in any pages,
//we'll have to count the no. of valid nodes manually
async function getUsage$1(message) {
    let outType = message.type.replace("scan", "update");
    let outPages = [];
    let totalCount = 0;
    figma.ui.postMessage({ type: "load-start", text: `Scanning ${message.name} for usage...` });
    await delay(50);
    let consumers = figma.getStyleById(message.id).consumers;
    //pass the list of consumers into a set to remove duplicate consumers
    let uniqueConsumers = new Set(consumers);
    //process usage stats only if we have layers using that style
    if (uniqueConsumers.size > 0) {
        // Step 1: Group Node IDs by Page ID
        let pageGroups = new Map();
        for (const consumer of uniqueConsumers) {
            //get the corresponding page of each layer
            let page = findPageBottomUp$1(consumer.node);
            //only process page if it's found
            if (page) {
                //if this page is new, we register an entry for it in the page map
                if (!pageGroups.has(page.id)) {
                    pageGroups.set(page.id, { id: page.id, name: page.name, nodeIDs: [] });
                }
                //slot the node id under its corresponding page
                pageGroups.get(page.id).nodeIDs.push(consumer.node.id);
                //update totalCount
                totalCount++;
            }
        }
        // Step 2: Convert to Desired Array Format
        outPages = Array.from(pageGroups.values());
    }
    figma.ui.postMessage({ type: outType, id: message.id, totalCount: totalCount, pages: outPages });
    await delay(50);
    figma.ui.postMessage({ type: "load-end" });
}
//searches recursively for page that node belongs to from the bottom up; more efficient but may not always work
function findPageBottomUp$1(node) {
    if (node.parent) {
        if (node.parent.type == 'PAGE') {
            return node.parent;
        }
        else {
            return findPageBottomUp$1(node.parent);
        }
    }
    else {
        return null;
    }
}
//----------------------DELETE FUNCTIONS
function deleteStyle$1(message) {
    let colorStyle = figma.getStyleById(message.id);
    if (colorStyle) {
        colorStyle.remove();
        colorStyles.delete(colorStyle);
    }
}

let compStyles = new Set();
//------------------FUNCTIONS FOR LOCAL STYLES
function getLocal() {
    figma.ui.postMessage({ type: "load-update", text: `Finding local components...` });
    let comps = figma.root.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"] });
    //filter out components which already belong to a variant
    comps = comps.filter(node => node.parent.type !== "COMPONENT_SET");
    let compsToUI = [];
    for (const node of comps) {
        if (!compStyles.has(node.id)) {
            compStyles.add(node.id);
            compsToUI.push({ id: node.id, name: node.name, isLocal: true });
        }
    }
    figma.ui.postMessage({ type: "display-comps", data: compsToUI });
}
//zooms unto component in user file; only for local components
function viewLocalComp(message) {
    let selectedComp = figma.getNodeById(message.id);
    let selectedPage = findPageBottomUp(selectedComp);
    figma.currentPage = selectedPage;
    figma.currentPage.selection = [selectedComp];
    figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
}
//------------SEARCH FUNCTIONS
//gets no. of nodes using this style, sorted by page
function getUsage(message) {
    let compInstances = [];
    let uniqueInstances;
    let pageGroups = new Map();
    let outPages = {};
    let totalCount = 0;
    let outType = message.type.replace("scan", "update");
    figma.ui.postMessage({ type: "load-start", text: `Scanning ${message.name} for usage...` });
    let comp = figma.getNodeById(message.id);
    //first, we get the list of instances from the input component
    if (comp.type == 'COMPONENT') {
        compInstances = comp.instances;
    }
    //if we're reading a variant, compile the list of instances from all its children
    else if (comp.type == 'COMPONENT_SET') {
        for (const child of comp.children) {
            compInstances.concat(child.instances);
        }
    }
    //next, we run instances through a set to remove duplicate entries
    uniqueInstances = new Set(compInstances);
    for (const instance of uniqueInstances) {
        //find corresponding page for node
        let page = findPageBottomUp(instance);
        //add page to sorting process if it's found
        if (page) {
            if (!pageGroups.has(page.id)) {
                pageGroups.set(page.id, { id: page.id, name: page.name, nodeIDs: [] });
            }
            pageGroups.get(page.id).nodeIDs.push(instance.id);
            totalCount++;
        }
    }
    outPages = Array.from(pageGroups.values());
    figma.ui.postMessage({ type: outType, id: message.id, totalCount: totalCount, pages: outPages });
    figma.ui.postMessage({ type: "load-end" });
}
//searches recursively for page that node belongs to from the bottom up; more efficient but may not always work
function findPageBottomUp(node) {
    if (node.parent) {
        if (node.parent.type == 'PAGE') {
            return node.parent;
        }
        else {
            return findPageBottomUp(node.parent);
        }
    }
    else {
        return null;
    }
}
//----------------------DELETE FUNCTIONS
function deleteStyle(message) {
    let comp = figma.getNodeById(message.id);
    if (comp) {
        comp.remove();
        compStyles.delete(comp);
    }
}

figma.skipInvisibleInstanceChildren = false; //set to true to optimise node search using findAll() and findAllWithCriteria()
figma.showUI(__html__, { width: 400, height: 600 });
figma.ui.onmessage = message => {
    switch (message.type) {
        case 'start':
            figma.ui.postMessage({ type: "load-start" });
            getLocal$2();
            getLocal$1();
            getLocal();
            figma.ui.postMessage({ type: "load-end" });
            break;
        case 'process-remote-text':
            processRemoteChunk$1();
            break;
        case 'process-remote-color':
            processRemoteChunk();
            break;
        case 'scan-text':
            getUsage$2(message);
            break;
        case 'scan-color':
            getUsage$1(message);
            break;
        case 'scan-comp':
            getUsage(message);
            break;
        case 'view-local-comp':
            viewLocalComp(message);
            break;
        case 'view-selection':
            viewSelection(message);
            break;
        case 'delete-text':
            deleteStyle$2(message);
            break;
        case 'delete-color':
            deleteStyle$1(message);
            break;
        case 'delete-comp':
            deleteStyle(message);
            break;
    }
};
function viewSelection(message, selectionLimit = 500) {
    //calls up loading screen if selection is qte large
    if (message.nodeIDs.length > selectionLimit) {
        figma.ui.postMessage({ type: "load-start" });
    }
    //takes in page id and list of node ids
    let selectedNodes = [];
    let i = 1;
    //first, move to the targeted page
    figma.currentPage = figma.getNodeById(message.id);
    //find every corresponding node in selection and tell Figma to zoom unto selection
    for (const id of message.nodeIDs) {
        selectedNodes.push(figma.getNodeById(id));
        if (message.nodeIDs.length > selectionLimit) {
            figma.ui.postMessage({ type: "load-progress", text: `Selecting ${i}/${message.nodeIDs.length} objects...` });
        }
        i++;
    }
    //then set selection on that page to be our selected nodes
    figma.currentPage.selection = selectedNodes;
    //then tell figma to zoom into view
    figma.viewport.scrollAndZoomIntoView(selectedNodes);
    if (message.nodeIDs.length > selectionLimit) {
        figma.ui.postMessage({ type: "load-end" });
    }
}
