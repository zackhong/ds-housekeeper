'use strict';

let localText = new Set();
let localColors = new Set();
let localComps = new Set();
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
//------------------FUNCTIONS FOR LOCAL STYLES
async function getLocalText() {
    //text data to be sent to UI via postMessage(); has to be serialisable object ie Array to be sent in message
    const textToUI = [];
    figma.ui.postMessage({ type: "load-update", text: `Finding local text styles...` });
    await delay(50);
    const localTextStyles = figma.getLocalTextStyles();
    for (const style of localTextStyles) {
        const styleID = style.id;
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
        //finally, populate the ids
        localText.add(styleID);
        textToUI.push({ id: styleID, name: styleName, info: styleInfo, local: true });
    }
    figma.ui.postMessage({ type: "display-text", data: textToUI });
}
async function getLocalColors() {
    const colorsToUI = [];
    figma.ui.postMessage({ type: "load-update", text: `Finding local color styles...` });
    await delay(50);
    const localColorStyles = figma.getLocalPaintStyles();
    for (const style of localColorStyles) {
        const styleID = style.id;
        const styleName = style.name;
        const colorType = style.paints[0].type;
        let styleInfo = {};
        // if this color style is a solid color, store its rgb value and opacity
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
        localColors.add(styleID);
        colorsToUI.push({ id: styleID, name: styleName, info: styleInfo, local: true });
    }
    figma.ui.postMessage({ type: "display-colors", data: colorsToUI });
}
async function getLocalComps() {
    figma.ui.postMessage({ type: "load-update", text: `Finding local components...` });
    await delay(50);
    //we have to search the entire file for components and component with variants
    //split search per page to make UI more responsive
    let pages = figma.root.children;
    for (const page of pages) {
        //filter out component nodes that are part of a component set to avoid double-counting
        let compNodes = page.findAllWithCriteria({ types: ["COMPONENT"] });
        compNodes = compNodes.filter(node => node.parent.type !== "COMPONENT_SET");
        const variantNodes = page.findAllWithCriteria({ types: ["COMPONENT_SET"] });
        // further split the search process into chunks to improve UI responsiveness even more
        processCompsInChunks(compNodes, 'component', page.name);
        processCompsInChunks(variantNodes, 'variant', page.name);
    }
}
async function processCompsInChunks(nodes, compType, page, isLocal = true, chunkSize = 50) {
    let compsToUI = [];
    for (let i = 0; i < nodes.length; i += chunkSize) {
        const chunk = nodes.slice(i, i + chunkSize);
        for (const node of chunk) {
            localComps.add(node.id);
            compsToUI.push({ id: node.id, name: node.name, local: isLocal });
        }
        // display warning if we're processing a lot of nodes
        if (nodes.length > chunkSize) {
            figma.ui.postMessage({ type: "load-warning", text: `Processing ${i}/${nodes.length} ${compType}s in ${page}...` });
        }
        figma.ui.postMessage({ type: "display-comps", data: compsToUI });
        await delay(50);
    }
}
async function getStyleUsage(message) {
    let outType = message.type.replace("scan", "update");
    let outPages = [];
    figma.ui.postMessage({ type: "load-start", text: `Scanning ${message.name} for usage...` });
    await delay(50);
    const consumers = figma.getStyleById(message.id).consumers;
    //process usage stats only if we have layers using that style
    if (consumers.length > 0) {
        // Step 1: Group Node IDs by Page ID
        const pageGroups = new Map();
        consumers.forEach(consumer => {
            //get the corresponding page of each layer
            const page = findPage(consumer.node);
            //if this page is new, we register an entry for it in the page map
            if (page && !pageGroups.has(page.id)) {
                pageGroups.set(page.id, { pageID: page.id, pageName: page.name, nodeIDs: [] });
            }
            //if this page is already mentioned in the page map, we update its list of node ids
            pageGroups.get(page.id).nodeIDs.push(consumer.node.id);
        });
        // Step 2: Convert to Desired Array Format
        outPages = Array.from(pageGroups.values());
    }
    figma.ui.postMessage({ type: outType, id: message.id, totalCount: consumers.length, pages: outPages });
    await delay(50);
    figma.ui.postMessage({ type: "load-end" });
}
//tracks usage for a given component
async function getCompUsage(message) {
    let instances;
    let pairs = [];
    let outPages = {};
    let totalCount = 0;
    let outType = message.type.replace("scan", "update");
    figma.ui.postMessage({ type: "load-start", text: `Scanning ${message.name} for usage...` });
    await delay(50);
    let compNode = figma.getNodeById(message.id);
    if (compNode.type == 'COMPONENT') {
        instances = compNode.instances;
        if (instances.length > 0) {
            totalCount = instances.length;
            for (const instance of instances) {
                const page = findPage(instance);
                if (page) {
                    pairs.push({ nodeID: instance.id, pageID: page.id });
                }
            }
        }
    }
    //for component with variants, each of its children keeps tack of their own instances
    else if (compNode.type == 'COMPONENT_SET') {
        for (const child of compNode.children) {
            instances = child.instances;
            if (instances.length > 0) {
                totalCount += instances.length;
                for (const instance of instances) {
                    const page = findPage(instance);
                    if (page) {
                        pairs.push({ nodeID: instance.id, pageID: page.id });
                    }
                }
            }
        }
    }
    pairs.forEach(pair => {
        if (!outPages[pair.pageID]) {
            outPages[pair.pageID] = [];
        }
        outPages[pair.pageID].push(pair.nodeID);
    });
    figma.ui.postMessage({ type: outType, id: message.id, totalCount: totalCount, pages: outPages });
    await delay(50);
    figma.ui.postMessage({ type: "load-end" });
}
//searches recursively for page that node belongs to
function findPage(node) {
    if (node.parent) {
        if (node.parent.type == 'PAGE') {
            return node.parent;
        }
        else {
            return findPage(node.parent);
        }
    }
    else {
        return null;
    }
}

figma.skipInvisibleInstanceChildren = false; //set to true to optimise node search using findAll() and findAllWithCriteria()
figma.showUI(__html__, { width: 400, height: 600 });
figma.ui.onmessage = message => {
    switch (message.type) {
        case 'start':
            //retrieve styles and components from user file
            processStyles();
            break;
        case 'scan-text':
        case 'scan-color':
            getStyleUsage(message);
            break;
        case 'scan-comp':
            //scans a given style to retrieve all its consumers aka layers/instances using it
            getCompUsage(message);
            break;
    }
};
async function processStyles() {
    await getLocalText();
    await getLocalColors();
    await getLocalComps();
    figma.ui.postMessage({ type: "load-end" });
}
