'use strict';

let textStyles = new Set();
let uniqueConsumers$1, myIterator$2;
//-------FOR RUNNING THROUGH ITERATOR FUNCTIONS
function runNextChunk$2() {
    let nextChunk = myIterator$2.next();
    figma.ui.postMessage(nextChunk.value);
}
//------------------FUNCTIONS FOR LOCAL STYLES
function getLocal$2() {
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
    figma.ui.postMessage({ action: "display-local-text", data: textToUI });
}
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
//--------FUNCTIONS FOR GETTING REMOTE STYLES
function getRemote$2() {
    myIterator$2 = remoteIterator$2();
    runNextChunk$2();
}
// since there isn't a getRemoteTextStyles() method, we have to check every text node for text styles that aren't local
function* remoteIterator$2(chunkSize = 100) {
    let counter = 0, textToUI = [];
    //retrieve all text nodes in file
    let textNodes = figma.root.findAllWithCriteria({ types: ["TEXT"] });
    for (const node of textNodes) {
        //check if this node's style is already included in the current list of text styles;
        //if not, then this style must be remote
        let styleID = String(node.textStyleId);
        if (styleID && !styleID.includes('Symbol') && !textStyles.has(styleID)) {
            let style = figma.getStyleById(styleID);
            if (style) {
                processStyle$1(style, textToUI, false);
            }
        }
        counter++;
        //updates loading screen after deleting each chunk of nodes
        if (counter % chunkSize == 0) {
            yield { action: 'load-remote-text-progress', text: `Checking ${counter} layers...` };
        }
    }
    yield { action: 'display-remote-text', data: textToUI };
}
//------------SEARCH FUNCTIONS
//gets no. of nodes using this style, sorted by page
//since style.consumers seems to give us invalid nodes ie nodes that don't exist in any pages,
//we'll have to count the no. of valid nodes manually
function getUsage$2(message) {
    let consumers = figma.getStyleById(message.id).consumers;
    //pass the list of consumers into a set to remove duplicate consumers
    uniqueConsumers$1 = new Set(consumers);
    //sends data back immediately if no consumers are found
    if (uniqueConsumers$1.size == 0) {
        figma.ui.postMessage({ action: 'update-text', id: message.id, totalCount: 0, pages: [] });
    }
    //otherwise, we start processing our consumers in chunks
    else {
        myIterator$2 = usageIterator$2(message.id);
        runNextChunk$2();
    }
}
//generator function to iterate through set of unique consumers, either yields a "scan-text-progress" message
//if there are more consumers to process, or yields the final output
function* usageIterator$2(targetStyleID, chunkSize = 100) {
    let iterator = uniqueConsumers$1.values();
    let outPages = [], totalCount = 0, pageGroups = new Map();
    let done = false;
    while (!done) {
        for (let i = 0; i < chunkSize; i++) {
            let nextValue = iterator.next();
            //exits the for loop if we've processed all nodes in uniqueConsumers
            if (nextValue.done) {
                done = true;
                break;
            }
            let consumer = nextValue.value;
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
        if (!done) {
            yield { action: 'scan-text-progress', text: `Processing ${totalCount}/${uniqueConsumers$1.size} layers...` };
        }
    }
    // After completing the iteration ie done == true, yield the final result
    if (pageGroups.size > 0) {
        outPages = Array.from(pageGroups.values());
        yield { action: 'update-text', id: targetStyleID, totalCount, pages: outPages };
    }
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
//--------DELETES STYLE FROM USER FILE
function deleteStyle$2(message) {
    let textStyle = figma.getStyleById(message.id);
    if (textStyle) {
        textStyle.remove();
        textStyles.delete(textStyle);
    }
}
//--------DELETES ALL LAYERS FROM STYLE
function deleteAllLayers$2(message) {
    myIterator$2 = deleteAllIterator$1(message);
    runNextChunk$2();
}
function* deleteAllIterator$1(message, chunkSize = 100) {
    let counter = 0;
    for (const page of message.pages) {
        for (const nodeID of page.nodeIDs) {
            let node = figma.getNodeById(nodeID);
            if (node != null) {
                node.remove();
            }
            counter++;
            //updates loading screen after deleting each chunk of nodes
            if (counter % chunkSize == 0) {
                yield { action: 'delete-all-text-progress', text: `Deleting ${counter} layers...` };
            }
        }
    }
    if (message.deleteStyle) {
        deleteStyle$2(message);
    }
    yield { action: 'load-end' };
}
//----------------DELETES LAYERS FROM GIVEN PAGE
function deleteFromPage$2(message) {
    myIterator$2 = deleteFromPageIterator$2(message);
    runNextChunk$2();
}
function* deleteFromPageIterator$2(message, chunkSize = 100) {
    let counter = 0;
    for (const nodeID of message.nodeIDs) {
        let node = figma.getNodeById(nodeID);
        if (node != null) {
            node.remove();
        }
        counter++;
        //updates loading screen after deleting each chunk of nodes
        if (counter % chunkSize == 0) {
            yield { action: 'delete-text-from-page-progress', text: `Deleting ${counter} layers...` };
        }
    }
    yield { action: 'load-end' };
}
//--------SWAPS ALL LAYERS FROM STYLE
function swapAllLayers$2(message) {
    myIterator$2 = swapAllIterator$1(message);
    runNextChunk$2();
}
function* swapAllIterator$1(message, chunkSize = 100) {
    let counter = 0;
    for (const page of message.pages) {
        for (const nodeID of page.nodeIDs) {
            let node = figma.getNodeById(nodeID);
            if (node != null) {
                node.textStyleId = message.swapID;
            }
            counter++;
            //updates loading screen after deleting each chunk of nodes
            if (counter % chunkSize == 0) {
                yield { action: 'swap-all-text-progress', text: `Swapping ${counter} layers...` };
            }
        }
    }
    if (message.deleteStyle) {
        deleteStyle$2(message);
    }
    //rescans swapped style if necessary
    if (message.rescanSwapped) {
        yield { action: 'scan-text-start', id: message.swapID, name: message.swapName };
    }
    else {
        yield { action: 'load-end' };
    }
}
//----------------SWAPS LAYERS FROM GIVEN PAGE
function swapFromPage$2(message) {
    myIterator$2 = swapFromPageIterator$2(message);
    runNextChunk$2();
}
function* swapFromPageIterator$2(message, chunkSize = 100) {
    let counter = 0;
    for (const nodeID of message.nodeIDs) {
        let node = figma.getNodeById(nodeID);
        if (node != null) {
            node.textStyleId = message.swapID;
        }
        counter++;
        //updates loading screen after deleting each chunk of nodes
        if (counter % chunkSize == 0) {
            yield { action: 'swap-text-from-page-progress', text: `Swapping ${counter} layers...` };
        }
    }
    //rescans swapped style if necessary
    if (message.rescanSwapped) {
        yield { action: 'scan-text-start', id: message.swapID, name: message.swapName };
    }
    else {
        yield { action: 'load-end' };
    }
}
//--------------RESET
function reset$2() {
    textStyles = new Set();
}

let colorStyles = new Set();
let uniqueConsumers, myIterator$1;
//--------------HELPER FUNCTIONS
// Convert values from Figma's color object to an rgba string 
// this converts an rgb component (ranging from 0 to 255) to its hex representation
function componentToHex(c) {
    const hex = c.toString(16);
    //prepends output with '0' if it's only 1 char long
    return hex.length === 1 ? '0' + hex : hex;
}
//-------FOR RUNNING THROUGH ITERATOR FUNCTIONS
function runNextChunk$1() {
    let nextChunk = myIterator$1.next();
    figma.ui.postMessage(nextChunk.value);
}
function getLocal$1() {
    const localColorStyles = figma.getLocalPaintStyles();
    let colorsToUI = [];
    for (const style of localColorStyles) {
        if (!colorStyles.has(style.id)) {
            processStyle(style, colorsToUI);
        }
    }
    figma.ui.postMessage({ action: "display-local-colors", data: colorsToUI });
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
function rgbToHex(r, g, b) {
    const red = componentToHex(Math.round(r * 255));
    const green = componentToHex(Math.round(g * 255));
    const blue = componentToHex(Math.round(b * 255));
    return `#${red}${green}${blue}`;
}
//--------FUNCTIONS FOR GETTING REMOTE STYLES
function getRemote$1() {
    myIterator$1 = remoteIterator$1();
    runNextChunk$1();
}
function* remoteIterator$1(chunkSize = 100) {
    let counter = 0, colorsToUI = [];
    //retrieve all nodes that use color
    let colorNodes = figma.root.findAllWithCriteria({ types: [
            "BOOLEAN_OPERATION", "COMPONENT", "COMPONENT_SET", "INSTANCE",
            "ELLIPSE", "STAR", "RECTANGLE", "LINE", "POLYGON", "VECTOR",
            "FRAME", "TEXT"
        ] });
    for (const node of colorNodes) {
        //check the fill and stroke of every node to see if it's already registered
        let fillID = String(node.fillStyleId);
        if (fillID && !fillID.includes('Symbol') && !colorStyles.has(fillID)) {
            let style = figma.getStyleById(fillID);
            if (style) {
                processStyle(style, colorsToUI, false);
            }
        }
        let strokeID = String(node.strokeStyleId);
        if (strokeID && !strokeID.includes('Symbol') && !colorStyles.has(strokeID)) {
            let style = figma.getStyleById(strokeID);
            if (style) {
                processStyle(style, colorsToUI, false);
            }
        }
        counter++;
        //updates loading screen after deleting each chunk of nodes
        if (counter % chunkSize == 0) {
            yield { action: 'load-remote-colors-progress', text: `Checking ${counter} layers...` };
        }
    }
    yield { action: 'display-remote-colors', data: colorsToUI };
}
//------------SEARCH FUNCTIONS
//gets no. of nodes using this style, sorted by page
//since style.consumers seems to give us invalid nodes ie nodes that don't exist in any pages,
//we'll have to count the no. of valid nodes manually
function getUsage$1(message) {
    let consumers = figma.getStyleById(message.id).consumers;
    //pass the list of consumers into a set to remove duplicate consumers
    uniqueConsumers = new Set(consumers);
    //sends data back immediately if no consumers are found
    if (uniqueConsumers.size == 0) {
        figma.ui.postMessage({ action: 'update-color', id: message.id, totalCount: 0, pages: [] });
    }
    //otherwise, we start processing our consumers in chunks
    else {
        myIterator$1 = usageIterator$1(message.id);
        runNextChunk$1();
    }
}
//generator function to iterate through set of unique consumers, either yields a "scan-text-progress" message
//if there are more consumers to process, or yields the final output
function* usageIterator$1(targetStyleID, chunkSize = 100) {
    let iterator = uniqueConsumers.values();
    let outPages = [], totalCount = 0, pageGroups = new Map();
    let done = false;
    while (!done) {
        for (let i = 0; i < chunkSize; i++) {
            let nextValue = iterator.next();
            //exits the for loop if we've processed all nodes in uniqueConsumers
            if (nextValue.done) {
                done = true;
                break;
            }
            let consumer = nextValue.value;
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
        if (!done) {
            yield { action: 'scan-color-progress', text: `Processing ${totalCount}/${uniqueConsumers.size} layers...` };
        }
    }
    // After completing the iteration ie done == true, yield the final result
    if (pageGroups.size > 0) {
        outPages = Array.from(pageGroups.values());
        yield { action: 'update-color', id: targetStyleID, totalCount, pages: outPages };
    }
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
//--------DELETES STYLE FROM USER FILE
function deleteStyle$1(message) {
    let colorStyle = figma.getStyleById(message.id);
    if (colorStyle) {
        colorStyle.remove();
        colorStyles.delete(colorStyle);
    }
}
//--------DELETES ALL LAYERS FROM STYLE
function deleteAllLayers$1(message) {
    myIterator$1 = deleteAllIterator(message);
    runNextChunk$1();
}
function* deleteAllIterator(message, chunkSize = 100) {
    let counter = 0;
    for (const page of message.pages) {
        for (const nodeID of page.nodeIDs) {
            let node = figma.getNodeById(nodeID);
            if (node != null) {
                node.remove();
            }
            counter++;
            //updates loading screen after deleting each chunk of nodes
            if (counter % chunkSize == 0) {
                yield { action: 'delete-all-color-progress', text: `Deleting ${counter} layers...` };
            }
        }
    }
    if (message.deleteStyle) {
        deleteStyle$1(message);
    }
    yield { action: 'load-end' };
}
//----------------DELETES LAYERS FROM GIVEN PAGE
function deleteFromPage$1(message) {
    myIterator$1 = deleteFromPageIterator$1(message);
    runNextChunk$1();
}
function* deleteFromPageIterator$1(message, chunkSize = 100) {
    let counter = 0;
    for (const nodeID of message.nodeIDs) {
        let node = figma.getNodeById(nodeID);
        if (node != null) {
            node.remove();
        }
        counter++;
        //updates loading screen after deleting each chunk of nodes
        if (counter % chunkSize == 0) {
            yield { action: 'delete-color-from-page-progress', text: `Deleting ${counter} layers...` };
        }
    }
    yield { action: 'load-end' };
}
//--------SWAPS ALL LAYERS FROM STYLE
function swapAllLayers$1(message) {
    myIterator$1 = swapAllIterator(message);
    runNextChunk$1();
}
function* swapAllIterator(message, chunkSize = 100) {
    let counter = 0;
    for (const page of message.pages) {
        for (const nodeID of page.nodeIDs) {
            let node = figma.getNodeById(nodeID);
            if (node != null) {
                if (node.fillStyleId == message.id) {
                    node.fillStyleId = message.swapID;
                }
                if (node.strokeStyleId == message.id) {
                    node.strokeStyleId = message.swapID;
                }
            }
            counter++;
            //updates loading screen after deleting each chunk of nodes
            if (counter % chunkSize == 0) {
                yield { action: 'swap-all-color-progress', text: `Swapping ${counter} layers...` };
            }
        }
    }
    if (message.deleteStyle) {
        deleteStyle$1(message);
    }
    //rescans swapped style if necessary
    if (message.rescanSwapped) {
        yield { action: 'scan-color-start', id: message.swapID, name: message.swapName };
    }
    else {
        yield { action: 'load-end' };
    }
}
//----------------SWAPS LAYERS FROM GIVEN PAGE
function swapFromPage$1(message) {
    myIterator$1 = swapFromPageIterator$1(message);
    runNextChunk$1();
}
function* swapFromPageIterator$1(message, chunkSize = 100) {
    let counter = 0;
    for (const nodeID of message.nodeIDs) {
        let node = figma.getNodeById(nodeID);
        if (node != null) {
            if (node.fillStyleId == message.styleID) {
                node.fillStyleId = message.swapID;
            }
            if (node.strokeStyleId == message.styleID) {
                node.strokeStyleId = message.swapID;
            }
        }
        counter++;
        //updates loading screen after deleting each chunk of nodes
        if (counter % chunkSize == 0) {
            yield { action: 'swap-color-from-page-progress', text: `Swapping ${counter} layers...` };
        }
    }
    //rescans swapped style if necessary
    if (message.rescanSwapped) {
        yield { action: 'scan-color-start', id: message.swapID, name: message.swapName };
    }
    else {
        yield { action: 'load-end' };
    }
}
//--------------RESET
function reset$1() {
    colorStyles = new Set();
}

let compStyles = new Set();
let uniqueInstances, myIterator;
//-------FOR RUNNING THROUGH ITERATOR FUNCTIONS
function runNextChunk() {
    let nextChunk = myIterator.next();
    figma.ui.postMessage(nextChunk.value);
}
//------------------FUNCTIONS FOR LOCAL STYLES
function getLocal() {
    myIterator = localIterator();
    runNextChunk();
}
function* localIterator(chunkSize = 100) {
    let comps = figma.root.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"] });
    //filter out components which already belong to a variant
    comps = comps.filter(node => node.parent.type !== "COMPONENT_SET");
    let counter = 0, compsToUI = [];
    for (const node of comps) {
        if (!compStyles.has(node.id)) {
            compStyles.add(node.id);
            compsToUI.push({ id: node.id, name: node.name, isLocal: true });
        }
        counter++;
        //updates loading screen after processing every chunk
        if (counter % chunkSize == 0) {
            yield { action: "load-local-comps-progress", text: `Processing ${counter}/${comps.length} local components...` };
        }
    }
    yield { action: "display-local-comps", data: compsToUI };
}
//--------FUNCTIONS FOR GETTING REMOTE STYLES
function getRemote() {
    myIterator = remoteIterator();
    runNextChunk();
}
function* remoteIterator(chunkSize = 100) {
    let counter = 0, compsToUI = [];
    //find every instance node in file
    let instances = figma.root.findAllWithCriteria({ types: ["INSTANCE"] });
    for (const node of instances) {
        let comp = findRootComponent(node);
        //check if we can find component that instance belongs to, and that component isn't already stored inside 
        if (comp && !compStyles.has(comp.id)) {
            compStyles.add(comp.id);
            compsToUI.push({ id: comp.id, name: comp.name, isLocal: false });
        }
        counter++;
        //updates loading screen after processing every chunk
        if (counter % chunkSize == 0) {
            yield { action: 'load-remote-comps-progress', text: `Checking ${counter} instances...` };
        }
    }
    yield { action: 'display-remote-comps', data: compsToUI };
}
function findRootComponent(node) {
    let comp = node.mainComponent;
    if (comp) {
        let parent = comp.parent;
        if (parent && parent.type == "COMPONENT_SET") {
            return parent;
        }
        else {
            return comp;
        }
    }
    else
        return null;
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
    let comp = figma.getNodeById(message.id);
    //first, we get the list of instances from the input component
    if (comp.type == 'COMPONENT') {
        compInstances = comp.instances;
    }
    //if we're reading a variant, compile the list of instances from all its children
    else if (comp.type == 'COMPONENT_SET') {
        for (const child of comp.children) {
            let childInstances = child.instances;
            compInstances = compInstances.concat(childInstances);
        }
    }
    //next, we run instances through a set to remove duplicate entries
    uniqueInstances = new Set(compInstances);
    //sends data back immediately if no consumers are found
    if (uniqueInstances.size == 0) {
        figma.ui.postMessage({ action: 'update-comp', id: message.id, totalCount: 0, pages: [] });
    }
    //otherwise, we start processing our consumers in chunks
    else {
        myIterator = usageIterator(message.id);
        runNextChunk();
    }
}
//generator function to iterate through set of unique consumers, either yields a "scan-text-progress" message
//if there are more consumers to process, or yields the final output
function* usageIterator(targetStyleID, chunkSize = 100) {
    let iterator = uniqueInstances.values();
    let outPages = [], totalCount = 0, pageGroups = new Map();
    let done = false;
    while (!done) {
        for (let i = 0; i < chunkSize; i++) {
            let nextValue = iterator.next();
            //exits the for loop if we've processed all nodes in uniqueConsumers
            if (nextValue.done) {
                done = true;
                break;
            }
            let instance = nextValue.value;
            //get the corresponding page of each layer
            let page = findPageBottomUp(instance);
            //only process page if it's found
            if (page) {
                //if this page is new, we register an entry for it in the page map
                if (!pageGroups.has(page.id)) {
                    pageGroups.set(page.id, { id: page.id, name: page.name, nodeIDs: [] });
                }
                //slot the node id under its corresponding page
                pageGroups.get(page.id).nodeIDs.push(instance.id);
                //update totalCount
                totalCount++;
            }
        }
        if (!done) {
            yield { action: 'scan-comp-progress', text: `Processing ${totalCount}/${uniqueInstances.size} instances...` };
        }
    }
    // After completing the iteration ie done == true, yield the final result
    if (pageGroups.size > 0) {
        outPages = Array.from(pageGroups.values());
        yield { action: 'update-comp', id: targetStyleID, totalCount, pages: outPages };
    }
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
//----------------------DELETE STYLE
function deleteStyle(message) {
    let comp = figma.getNodeById(message.id);
    if (comp) {
        comp.remove();
        compStyles.delete(comp);
    }
}
//----------------------DELETE ALL LAYERS FROM STYLE
function deleteAllLayers(message) {
    myIterator = deleteIterator(message);
    runNextChunk();
    // deleteAllChunk();
}
function* deleteIterator(message, chunkSize = 100) {
    let counter = 0;
    for (const page of message.pages) {
        for (const nodeID of page.nodeIDs) {
            let node = figma.getNodeById(nodeID);
            if (node != null) {
                node.remove();
            }
            counter++;
            //updates loading screen after deleting each chunk of nodes
            if (counter % chunkSize == 0) {
                yield { action: 'delete-all-comp-progress', text: `Deleting ${counter} instances...` };
            }
        }
    }
    if (message.deleteStyle) {
        deleteStyle(message);
    }
    yield { action: 'load-end' };
}
//----------------DELETES LAYERS FROM GIVEN PAGE
function deleteFromPage(message) {
    myIterator = deleteFromPageIterator(message);
    runNextChunk();
    // deleteFromPageChunk();
}
function* deleteFromPageIterator(message, chunkSize = 100) {
    let counter = 0;
    for (const nodeID of message.nodeIDs) {
        let node = figma.getNodeById(nodeID);
        if (node != null) {
            node.remove();
        }
        counter++;
        //updates loading screen after deleting each chunk of nodes
        if (counter % chunkSize == 0) {
            yield { action: 'delete-comp-from-page-progress', text: `Deleting ${counter} instances...` };
        }
    }
    yield { action: 'load-end' };
}
//----------------------SWAPS ALL LAYERS FROM STYLE
function swapAllLayers(message) {
    myIterator = swapIterator(message);
    runNextChunk();
    // swapAllChunk();
}
function* swapIterator(message, chunkSize = 100) {
    let counter = 0;
    let swapNode = figma.getNodeById(message.swapID);
    //if swapped node is variant, we want instances to swap to its first child by default
    if (swapNode.type == 'COMPONENT_SET') {
        swapNode = swapNode.children[0];
    }
    for (const page of message.pages) {
        for (const nodeID of page.nodeIDs) {
            let node = figma.getNodeById(nodeID);
            if (node != null) {
                //swaps instance to use another component
                node.swapComponent(swapNode);
            }
            counter++;
            //updates loading screen after deleting each chunk of nodes
            if (counter % chunkSize == 0) {
                yield { action: 'swap-all-comp-progress', text: `Swapping ${counter} instances...` };
            }
        }
    }
    if (message.deleteStyle) {
        deleteStyle(message);
    }
    //rescans swapped style if necessary
    if (message.rescanSwapped) {
        yield { action: 'scan-comp-start', id: message.swapID, name: message.swapName };
    }
    else {
        yield { action: 'load-end' };
    }
}
//----------------SWAPS LAYERS FROM GIVEN PAGE
function swapFromPage(message) {
    myIterator = swapFromPageIterator(message);
    runNextChunk();
    // swapFromPageChunk();
}
function* swapFromPageIterator(message, chunkSize = 100) {
    let counter = 0;
    let swapNode = figma.getNodeById(message.swapID);
    //if swapped node is variant, we want instances to swap to its first child by default
    if (swapNode.type == 'COMPONENT_SET') {
        swapNode = swapNode.children[0];
    }
    for (const nodeID of message.nodeIDs) {
        let node = figma.getNodeById(nodeID);
        if (node != null) {
            //swaps instance to use another component
            node.swapComponent(swapNode);
        }
        counter++;
        //updates loading screen after deleting each chunk of nodes
        if (counter % chunkSize == 0) {
            yield { action: 'swap-comp-from-page-progress', text: `Swapping ${counter} instances...` };
        }
    }
    //rescans swapped style if necessary
    if (message.rescanSwapped) {
        yield { action: 'scan-comp-start', id: message.swapID, name: message.swapName };
    }
    else {
        yield { action: 'load-end' };
    }
}
//--------------RESET
function reset() {
    compStyles = new Set();
}

let limit = 50, selectIterator;
function viewSelection(message) {
    selectIterator = chunkIterator(message.name, message.id, message.nodeIDs, limit);
    processChunk();
}
function* chunkIterator(name, pageID, nodeIDs, chunkSize = 100) {
    let selectedNodes = [];
    //first, move to the targeted page
    figma.currentPage = figma.getNodeById(pageID);
    //only start showing loading screen if # of nodes exceed our limit
    if (nodeIDs.length > limit) {
        figma.ui.postMessage({ action: "load-start", text: `Viewing selection at ${name}...` });
        yield { action: "select-progress", text: `Finding objects...` };
    }
    for (let i = 0; i < nodeIDs.length; i += chunkSize) {
        let chunk = nodeIDs.slice(i, i + chunkSize);
        for (const id of chunk) {
            selectedNodes.push(figma.getNodeById(id));
        }
        //updates loading screen if # of nodes exceed the limit 
        if (nodeIDs.length > chunkSize) {
            yield { action: "select-progress", text: `Selecting ${i + chunk.length}/${nodeIDs.length} objects...` };
        }
    }
    //then set selection on that page to be our selected nodes, then tell figma to zoom into view
    figma.currentPage.selection = selectedNodes;
    figma.viewport.scrollAndZoomIntoView(selectedNodes);
    //tell loading screen to hide if it was showing previously ie # of nodeIDs > limit
    if (nodeIDs.length > chunkSize) {
        yield { action: "load-end" };
    }
}
function processChunk() {
    let nextChunk = selectIterator.next();
    if (!nextChunk.done) {
        figma.ui.postMessage(nextChunk.value);
    }
}

figma.skipInvisibleInstanceChildren = false; //set to true to optimise node search using findAll() and findAllWithCriteria()
figma.showUI(__html__, { width: 400, height: 600 });
figma.ui.onmessage = message => {
    switch (message.action) {
        //-----LOAD LOCAL STYLES (CALLED ON INITIAL LOAD)
        case 'load-local-text':
            getLocal$2();
            break;
        case 'load-local-colors':
            getLocal$1();
            break;
        case 'load-local-comps-start':
            getLocal();
            break;
        case 'load-local-comps-continue':
            runNextChunk();
            break;
        //-------LOAD REMOTE STYLES
        case 'load-remote-text-start':
            getRemote$2();
            break;
        case 'load-remote-text-continue':
            runNextChunk$2();
            break;
        case 'load-remote-colors-start':
            getRemote$1();
            break;
        case 'load-remote-colors-continue':
            runNextChunk$1();
            break;
        case 'load-remote-comps-start':
            getRemote();
            break;
        case 'load-remote-comps-continue':
            runNextChunk();
            // compHandler.remoteChunk();
            break;
        //-------SCAN STYLE FOR USAGE
        case 'scan-text-start':
            getUsage$2(message);
            break;
        case 'scan-text-continue':
            runNextChunk$2();
            break;
        case 'scan-color-start':
            getUsage$1(message);
            break;
        case 'scan-color-continue':
            runNextChunk$1();
            break;
        case 'scan-comp-start':
            getUsage(message);
            break;
        case 'scan-comp-continue':
            runNextChunk();
            // compHandler.usageChunk();
            break;
        //---------VIEW AND SELECT
        case 'view-local-comp':
            viewLocalComp(message);
            break;
        case 'select-start':
            viewSelection(message);
            break;
        case 'select-continue':
            processChunk();
            break;
        //-----------DELETE STYLES
        case 'delete-text':
            deleteStyle$2(message);
            break;
        case 'delete-color':
            deleteStyle$1(message);
            break;
        case 'delete-comp':
            deleteStyle(message);
            break;
        //------------DELETE ALL LAYERS FROM STYLE
        case 'delete-all-text':
            deleteAllLayers$2(message);
            break;
        case 'delete-all-text-continue':
            runNextChunk$2();
            break;
        case 'delete-all-color':
            deleteAllLayers$1(message);
            break;
        case 'delete-all-color-continue':
            runNextChunk$1();
            break;
        case 'delete-all-comp':
            deleteAllLayers(message);
            break;
        case 'delete-all-comp-continue':
            runNextChunk();
            // compHandler.deleteAllChunk();
            break;
        //-------------DELETE LAYERS FROM PAGE
        case 'delete-text-from-page':
            deleteFromPage$2(message);
            break;
        case 'delete-text-from-page-continue':
            runNextChunk$2();
            break;
        case 'delete-color-from-page':
            deleteFromPage$1(message);
            break;
        case 'delete-color-from-page-continue':
            runNextChunk$1();
            break;
        case 'delete-comp-from-page':
            deleteFromPage(message);
            break;
        case 'delete-comp-from-page-continue':
            runNextChunk();
            break;
        //-------------SWAP ALL LAYERS FROM STYLE
        case 'swap-all-text':
            swapAllLayers$2(message);
            break;
        case 'swap-all-text-continue':
            runNextChunk$2();
            break;
        case 'swap-all-color':
            swapAllLayers$1(message);
            break;
        case 'swap-all-color-continue':
            runNextChunk$1();
            break;
        case 'swap-all-comp':
            swapAllLayers(message);
            break;
        case 'swap-all-comp-continue':
            runNextChunk();
            break;
        //-------------SWAP LAYERS FROM PAGE
        case 'swap-text-from-page':
            swapFromPage$2(message);
            break;
        case 'swap-text-from-page-continue':
            runNextChunk$2();
            break;
        case 'swap-color-from-page':
            swapFromPage$1(message);
            break;
        case 'swap-color-from-page-continue':
            runNextChunk$1();
            break;
        case 'swap-comp-from-page':
            swapFromPage(message);
            break;
        case 'swap-comp-from-page-continue':
            runNextChunk();
            break;
        //-------------RESET UI
        case 'reset-ui':
            reset$2();
            reset$1();
            reset();
            figma.ui.postMessage({ action: "load-local-text" });
            break;
    }
};
