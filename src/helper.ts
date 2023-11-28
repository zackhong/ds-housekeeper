let localText = new Set();
let remoteText = new Set();
let localColors = new Set();
let remoteColors = new Set();
let localComps = new Set();
let remoteComps = new Set();


//--------------HELPER FUNCTIONS
//using Promise and setTimeout to temp. pause plugin code so UI has time to update
function delay(timeInMs:number){ return new Promise( (resolve)=> setTimeout(resolve, timeInMs) ); }


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
export async function getLocalText(){

  //text data to be sent to UI via postMessage(); has to be serialisable object ie Array to be sent in message
  const textToUI = [];
  figma.ui.postMessage({type:"load-update", text:`Finding local text styles...`});
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
    if (style.lineHeight.unit === 'AUTO') { lineHeight = 'auto'; }  
    else if (style.lineHeight.unit === 'PERCENT') { lineHeight = Math.floor(style.lineHeight.value) + '%'; }
    else if (style.lineHeight.unit === 'PIXELS') { lineHeight = style.lineHeight.value; }
    const styleInfo = {fontName: fontName, fontWeight: fontWeight, fontSize: fontSize, lineHeight: lineHeight};
    
    localText.add(styleID);
    textToUI.push( {id: styleID, name: styleName, info: styleInfo });
  }
  figma.ui.postMessage({type:"display-text", data: textToUI});
  // console.log(textToUI);
}


export async function getLocalColors(){

  const colorsToUI = [];
  figma.ui.postMessage({type:"load-update", text:`Finding local color styles...`});
  await delay(50);

  const localColorStyles = figma.getLocalPaintStyles();

  for (const style of localColorStyles) {
    const styleID = style.id;
    const styleName = style.name;
    const colorType = style.paints[0].type;
    let colorInfo ={};
    // if this color style is a solid color, store its rgb value and opacity
    if(colorType == 'SOLID'){
      colorInfo = {
        hex:rgbToHex(
          style.paints[0].color.r, 
          style.paints[0].color.g, 
          style.paints[0].color.b), 
        opacity: style.paints[0].opacity};
    }
    
    localColors.add(styleID);
    colorsToUI.push( {styleID: styleID, name: styleName, type: colorType, info: colorInfo });
  }
  figma.ui.postMessage({type:"result-display", dataType: "color", data: colorsToUI});
  // console.log(colorsToUI);
}


export async function getLocalComps() {

  let compsToUI;
  figma.ui.postMessage({type:"load-update", text:`Finding local components...`});
  await delay(50);
  
  //we have to search the entire file for components and component with variants
  // split search to page by page
  const pages = figma.root.children;
  for(const page of pages){
    //filter out component nodes that are part of a component set to avoid double-counting
    let compNodes = page.findAllWithCriteria({ types: ["COMPONENT"]});
    compNodes = compNodes.filter(node => node.parent.type !== "COMPONENT_SET");
    const variantNodes = page.findAllWithCriteria({ types: ["COMPONENT_SET"]});

    // further split the checking process into chunks so that UI will be more responsive
    const chunkSize = 50;

    for (let i = 0; i < compNodes.length; i += chunkSize) {
      
      const chunk = compNodes.slice(i, i + chunkSize);
      compsToUI = [];
      
      // Process the chunk
      for(const node of chunk){
        localComps.add(node.id);
        compsToUI.push({styleID: node.id, name: node.name});
      }
      // display warning if we're processing a lot of nodes
      if(compNodes.length > (2 * chunkSize) ){
        figma.ui.postMessage({type:"load-warning", text:`Processing ${i}/${compNodes.length} components in ${page.name}...`});
      }
      //send comp data in chunks to ui as well
      figma.ui.postMessage({type:"result-display", dataType: "component", data: compsToUI});
      await delay(50);
    }

    //process variants separately to make ui more responsive
    for (let i = 0; i < variantNodes.length; i += chunkSize) {

      const chunk = variantNodes.slice(i, i + chunkSize);
      compsToUI = [];

      for(const node of chunk){
        localComps.add(node.id);
        compsToUI.push({styleID: node.id, name: node.name});
      }
      // display warning if we're processing a lot of nodes
      if(variantNodes.length > (2 * chunkSize) ){
        figma.ui.postMessage({type:"load-warning", text:`Processing ${i}/${variantNodes.length} variants in ${page.name}...`});
      }
      figma.ui.postMessage({type:"result-display", dataType: "comp-blob", data: compsToUI});
      await delay(50);
    }
  }
}




//--------FUNCTIONS FOR GETTING REMOTE STYLES
export async function getRemoteText(){

    // since there isn't a getRemoteTextStyles() method, we have to check every text node for text styles that aren't local
    figma.ui.postMessage({type:"load-update", text:`Finding library text styles...`});
    await delay(50);

    let textToUI = [];
    // split search of text nodes to page by page
    const pages = figma.root.children;
    for(const page of pages){

      const textNodes = page.findAllWithCriteria({ types: ["TEXT"]});
      // console.log(`${textNodes.length} text nodes in ${page.name}`);

      // further split the checking process into chunks so that UI will be more responsive
      const chunkSize = 100;

      for (let i = 0; i < textNodes.length; i += chunkSize) {
          // Get the next chunk
          const chunk = textNodes.slice(i, i + chunkSize);
          
          // Process the chunk
          for(const node of chunk){
            const styleID = String(node.textStyleId);
            // process this node if we find a valid and new style id
            if(styleID && !styleID.includes('Symbol') && !localText.has(styleID)){
              const style = figma.getStyleById(styleID) as TextStyle;
              const styleName = style.name;
              //get info like font name, font weight, font size and line height
              const fontName = style.fontName.family;
              const fontWeight = style.fontName.style;
              const fontSize = style.fontSize;
              let lineHeight;
              if (style.lineHeight.unit === 'AUTO') { lineHeight = 'auto'; } 
              else if (style.lineHeight.unit === 'PIXELS') { lineHeight = style.lineHeight.value + 'px'; } 
              else if (style.lineHeight.unit === 'PERCENT') {lineHeight = style.lineHeight.value + '%';}
              
              remoteText.add(styleID);
              textToUI.push( {styleID: styleID, name: styleName, fontName: fontName, fontWeight: fontWeight, fontSize: fontSize, lineHeight: lineHeight});
            }
          }

          // display warning if we're processing a lot of nodes
          if(textNodes.length > (3 * chunkSize) ){
            figma.ui.postMessage({type:"load-warning", text:`Searching ${i}/${textNodes.length} layers in ${page.name}...`});
          }
          await delay(50);
      }
    }
    figma.ui.postMessage({type:"result-display", dataType: "text", data: textToUI});
    await delay(50);
}



export async function getRemoteColors(){

    let colorsToUI = [];
    // since there isn't a getRemotePaintStyles() method, we have to check every node for color styles that aren't local
    figma.ui.postMessage({type:"load-update", text:`Finding library color styles...`});
    await delay(50);

    // split search of text nodes to page by page
    const pages = figma.root.children;
    for(const page of pages){

      const colorNodes = page.findAllWithCriteria({ types: [
        "BOOLEAN_OPERATION",
        "COMPONENT",
        "COMPONENT_SET",
        "ELLIPSE",
        "FRAME",
        "INSTANCE",
        "LINE",
        "POLYGON",
        "RECTANGLE",
        "STAR",
        "TEXT",
        "VECTOR"]});

        console.log(`${colorNodes.length} text nodes in ${page.name}`);

      // further split the checking process into chunks so that UI will be more responsive
      const chunkSize = 100;
      let styleID;

      for (let i = 0; i < colorNodes.length; i += chunkSize) {
          // Get the next chunk
          const chunk = colorNodes.slice(i, i + chunkSize);
          
          // Process the chunk
          for(const node of chunk){
            //check the node's fill and stroke for color styles
            styleID = String(node.fillStyleId);
            if(styleID && !styleID.includes('Symbol') && !localColors.has(styleID)){
              //todo
            }

            styleID = String(node.strokeStyleId);
            if(styleID && !styleID.includes('Symbol') && !localColors.has(styleID)){
              //todo
            }
          }

          // display warning if we're processing a lot of nodes
          if(colorNodes.length > (3 * chunkSize) ){
            figma.ui.postMessage({type:"load-warning", text:`Searching ${i}/${colorNodes.length} layers in ${page.name}...`});
          }
          await delay(50);
      }
    }
}
