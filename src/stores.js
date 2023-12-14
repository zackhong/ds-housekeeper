import { writable } from 'svelte/store';

export const tooltip = writable({
    isVisible: false,
    text: "",
    targetRect: {}
});

export const options = writable({
    isVisible: false,
    targetX: 0, targetY: 0,
    styleID:'', styleName:'', type:'',
    pageID: '', pageName:'', nodeIDs: []
});

export const resultMode = writable('Text'); // 'Text', 'Colors', 'Components', 'Custom'

export const search = writable({
    isSearching:false,
    text:''
});

export const selectedSearch = writable({
    id:"",
    type:""
});

export const popup = writable({
    isVisible: false,
    mode:'', // 'default', 'delete-style', 'delete-all-layers', 'delete-layers-from-page', 'swap-all-layers', 'swap-layers-from-page'
    styleType: '', styleID: '', styleName:'',
    pageID: '', pageName: '', nodeIDs:[]
});