let localText = new Set();
let remoteText = new Set();
let localColors = new Set();
let remoteColors = new Set();
let localComps = new Set();
let remoteComps = new Set();


//--------------HELPER FUNCTIONS
//using Promise and setTimeout to temp. pause plugin code so UI has time to update
function delay(timeInMs:number){ return new Promise( (resolve)=> setTimeout(resolve, timeInMs) ); }

function figmaColorToRGBA(color, opacity) {
  // Convert the RGB values from 0-1 range to 0-255
  const red = Math.round(color.r * 255);
  const green = Math.round(color.g * 255);
  const blue = Math.round(color.b * 255);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}




//------------------FUNCTIONS FOR LOCAL STYLES
export async function getLocalText(){

  const textData = [];

  figma.ui.postMessage({type:"load-update", text:`Finding local text styles...`});
  await delay(50);

  const localTextStyles = figma.getLocalTextStyles();

  for (const localStyle of localTextStyles) {
    const styleID = localStyle.id;
    const styleName = localStyle.name;
    const fontName = localStyle.fontName.family;
    const fontWeight = localStyle.fontName.style;
    const fontSize = localStyle.fontSize;
    let lineHeight;
    if (localStyle.lineHeight.unit === 'AUTO') { lineHeight = 'auto'; } 
    else if (localStyle.lineHeight.unit === 'PIXELS') { lineHeight = localStyle.lineHeight.value + 'px'; } 
    else if (localStyle.lineHeight.unit === 'PERCENT') {lineHeight = localStyle.lineHeight.value + '%';}
    
    localText.add(styleID);
    textData.push( {styleID: styleID, name: styleName, fontName: fontName, fontWeight: fontWeight, fontSize: fontSize, lineHeight: lineHeight});
  }
  figma.ui.postMessage({type:"result-display", dataType: "text-blob", data: textData});
  // console.log(textData);
}

export async function getLocalColors(){

  const colorData = [];

  figma.ui.postMessage({type:"load-update", text:`Finding local color styles...`});
  await delay(50);

  const localColorStyles = figma.getLocalPaintStyles();

  for (const localStyle of localColorStyles) {
    const styleID = localStyle.id;
    const styleName = localStyle.name;
    const colorType = localStyle.paints[0].type;
    let colorInfo ='';
    // store rgba info if this is a solid paint style
    if(colorType == 'SOLID'){colorInfo = figmaColorToRGBA(localStyle.paints[0].color, localStyle.paints[0].opacity);}
    
    localColors.add(styleID);
    colorData.push( {styleID: styleID, name: styleName, type: colorType, info: colorInfo });
  }
  figma.ui.postMessage({type:"result-display", dataType: "color-blob", data: colorData});
  // console.log(colorData);
}

export async function getLocalComps() {

  let compData = [];

  figma.ui.postMessage({type:"load-update", text:`Finding local components...`});
  await delay(50);
  
  //we have to search the entire file for components and component with variants
  // split search to page by page
  const pages = figma.root.children;
  for(const page of pages){
    //filter out component nodes that are part of a component set to avoid double-counting
    let compNodes = page.findAllWithCriteria({ types: ["COMPONENT"]});
    compNodes = compNodes.filter(node => node.parent?.type == "COMPONENT_SET");
    const variantNodes = page.findAllWithCriteria({ types: ["COMPONENT_SET"]});

    // further split the checking process into chunks so that UI will be more responsive
    const chunkSize = 50;

    for (let i = 0; i < compNodes.length; i += chunkSize) {
      
      const chunk = compNodes.slice(i, i + chunkSize);
      compData = [];
      
      // Process the chunk
      for(const node of chunk){
        localComps.add(node.id);
        compData.push({styleID: node.id, name: node.name});
      }
      // display warning if we're processing a lot of nodes
      if(compNodes.length > (2 * chunkSize) ){
        figma.ui.postMessage({type:"load-warning", text:`Processing ${i}/${compNodes.length} components in ${page.name}...`});
      }
      //send comp data in chunks to ui as well
      figma.ui.postMessage({type:"result-display", dataType: "comp-blob", data: compData});
      await delay(50);
    }

    //process variants separately to make ui more responsive
    for (let i = 0; i < variantNodes.length; i += chunkSize) {

      const chunk = variantNodes.slice(i, i + chunkSize);
      compData = [];

      for(const node of chunk){
        localComps.add(node.id);
        compData.push({styleID: node.id, name: node.name});
      }
      // display warning if we're processing a lot of nodes
      if(variantNodes.length > (2 * chunkSize) ){
        figma.ui.postMessage({type:"load-warning", text:`Processing ${i}/${variantNodes.length} variants in ${page.name}...`});
      }
      figma.ui.postMessage({type:"result-display", dataType: "comp-blob", data: compData});
      await delay(50);
    }
  }
}




//--------FUNCTIONS FOR GETTING REMOTE STYLES
export async function getRemoteText(){

    // since there isn't a getRemoteTextStyles() method, we have to check every text node for text styles that aren't local
    figma.ui.postMessage({type:"load-update", text:`Finding library text styles...`});
    await delay(50);

    let textData = [];
    // split search of text nodes to page by page
    const pages = figma.root.children;
    for(const page of pages){

      const textNodes = page.findAllWithCriteria({ types: ["TEXT"]});
      console.log(`${textNodes.length} text nodes in ${page.name}`);

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
              const style = figma.getStyleById(styleID);
              //todo: collate info
            }
          }

          // display warning if we're processing a lot of nodes
          if(textNodes.length > (3 * chunkSize) ){
            figma.ui.postMessage({type:"load-warning", text:`Searching ${i}/${textNodes.length} layers in ${page.name}...`});
          }
          await delay(50);
      }
    }
}

export async function getRemoteColors(){

    let colorData = [];

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
