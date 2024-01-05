import { writable } from 'svelte/store';

export const tooltip = writable({
    isVisible: false,
    text: "",
    targetRect: {}
});

export const options = writable({
    isVisible: false, canSwap:false,
    targetX: 0, targetY: 0,
    styleID:'', styleName:'', type:'',
    pageID: '', pageName:'', nodeIDs: []
});

// determines what type of styles to display
// possilbe values: 'text', 'color', 'comp, 'custom'
export const displayMode = writable('text'); 

export const selectedSearch = writable({
    id:"",
    type:""
});

export const results = writable({
    text:[], colors:[], comps:[],
    canSwapText:false, canSwapColors:false, canSwapComps:false,
    canScroll:true
});