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

export const displayMode = writable('Text'); // 'Text', 'Colors', 'Components', 'Custom'

export const search = writable({
    isSearching:false,
    text:'',
    results:[]
});

export const selectedSearch = writable({
    id:"",
    type:""
});

export const results = writable({
    text:[],
    colors:[],
    comps:[]
});