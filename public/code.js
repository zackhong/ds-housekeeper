'use strict';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

let localText = new Set();
let localColors = new Set();
let localComps = new Set();
//--------------HELPER FUNCTIONS
//using Promise and setTimeout to temp. pause plugin code so UI has time to update
function delay(timeInMs) { return new Promise((resolve) => setTimeout(resolve, timeInMs)); }
function figmaColorToRGBA(color, opacity) {
    // Convert the RGB values from 0-1 range to 0-255
    const red = Math.round(color.r * 255);
    const green = Math.round(color.g * 255);
    const blue = Math.round(color.b * 255);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}
//------------------FUNCTIONS FOR LOCAL STYLES
function getLocalText() {
    return __awaiter(this, void 0, void 0, function* () {
        const textData = [];
        figma.ui.postMessage({ type: "load-update", text: `Finding local text styles...` });
        yield delay(50);
        const localTextStyles = figma.getLocalTextStyles();
        for (const localStyle of localTextStyles) {
            const styleID = localStyle.id;
            const styleName = localStyle.name;
            const fontName = localStyle.fontName.family;
            const fontWeight = localStyle.fontName.style;
            const fontSize = localStyle.fontSize;
            let lineHeight;
            if (localStyle.lineHeight.unit === 'AUTO') {
                lineHeight = 'auto';
            }
            else if (localStyle.lineHeight.unit === 'PIXELS') {
                lineHeight = localStyle.lineHeight.value + 'px';
            }
            else if (localStyle.lineHeight.unit === 'PERCENT') {
                lineHeight = localStyle.lineHeight.value + '%';
            }
            localText.add(styleID);
            textData.push({ styleID: styleID, name: styleName, fontName: fontName, fontWeight: fontWeight, fontSize: fontSize, lineHeight: lineHeight });
        }
        figma.ui.postMessage({ type: "result-display", dataType: "text-blob", data: textData });
        // console.log(textData);
    });
}
function getLocalColors() {
    return __awaiter(this, void 0, void 0, function* () {
        const colorData = [];
        figma.ui.postMessage({ type: "load-update", text: `Finding local color styles...` });
        yield delay(50);
        const localColorStyles = figma.getLocalPaintStyles();
        for (const localStyle of localColorStyles) {
            const styleID = localStyle.id;
            const styleName = localStyle.name;
            const colorType = localStyle.paints[0].type;
            let colorInfo = '';
            // store rgba info if this is a solid paint style
            if (colorType == 'SOLID') {
                colorInfo = figmaColorToRGBA(localStyle.paints[0].color, localStyle.paints[0].opacity);
            }
            localColors.add(styleID);
            colorData.push({ styleID: styleID, name: styleName, type: colorType, info: colorInfo });
        }
        figma.ui.postMessage({ type: "result-display", dataType: "color-blob", data: colorData });
        // console.log(colorData);
    });
}
function getLocalComps() {
    return __awaiter(this, void 0, void 0, function* () {
        let compData = [];
        figma.ui.postMessage({ type: "load-update", text: `Finding local components...` });
        yield delay(50);
        //we have to search the entire file for components and component with variants
        // split search to page by page
        const pages = figma.root.children;
        for (const page of pages) {
            //filter out component nodes that are part of a component set to avoid double-counting
            let compNodes = page.findAllWithCriteria({ types: ["COMPONENT"] });
            compNodes = compNodes.filter(node => { var _a; return ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) == "COMPONENT_SET"; });
            const variantNodes = page.findAllWithCriteria({ types: ["COMPONENT_SET"] });
            // further split the checking process into chunks so that UI will be more responsive
            const chunkSize = 50;
            for (let i = 0; i < compNodes.length; i += chunkSize) {
                const chunk = compNodes.slice(i, i + chunkSize);
                compData = [];
                // Process the chunk
                for (const node of chunk) {
                    localComps.add(node.id);
                    compData.push({ styleID: node.id, name: node.name });
                }
                // display warning if we're processing a lot of nodes
                if (compNodes.length > (2 * chunkSize)) {
                    figma.ui.postMessage({ type: "load-warning", text: `Processing ${i}/${compNodes.length} components in ${page.name}...` });
                }
                //send comp data in chunks to ui as well
                figma.ui.postMessage({ type: "result-display", dataType: "comp-blob", data: compData });
                yield delay(50);
            }
            //process variants separately to make ui more responsive
            for (let i = 0; i < variantNodes.length; i += chunkSize) {
                const chunk = variantNodes.slice(i, i + chunkSize);
                compData = [];
                for (const node of chunk) {
                    localComps.add(node.id);
                    compData.push({ styleID: node.id, name: node.name });
                }
                // display warning if we're processing a lot of nodes
                if (variantNodes.length > (2 * chunkSize)) {
                    figma.ui.postMessage({ type: "load-warning", text: `Processing ${i}/${variantNodes.length} variants in ${page.name}...` });
                }
                figma.ui.postMessage({ type: "result-display", dataType: "comp-blob", data: compData });
                yield delay(50);
            }
        }
    });
}

figma.skipInvisibleInstanceChildren = false; //set to true to optimise node search using findAll() and findAllWithCriteria()
figma.showUI(__html__, { width: 400, height: 600 });
figma.ui.onmessage = msg => {
    switch (msg.type) {
        case 'start':
            //retrieve styles and components from user file
            processStyles();
            break;
    }
};
function processStyles() {
    return __awaiter(this, void 0, void 0, function* () {
        yield getLocalText();
        yield getLocalColors();
        yield getLocalComps();
        figma.ui.postMessage({ type: "load-end" });
    });
}
