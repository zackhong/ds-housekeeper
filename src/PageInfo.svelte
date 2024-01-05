<script>
    import { options } from "./stores";
    import {getContext} from 'svelte';
    import { results } from './stores.js';

    export let id, name, nodeIDs;
    let styleInfo = getContext('styleInfo'), canSwap = false;

    $: switch(styleInfo.type){

        case 'text':
        canSwap = $results.canSwapText;
        break;

        case 'color':
        canSwap = $results.canSwapColors;
        break;

        case 'comp':
        canSwap = $results.canSwapComps;
        break;
    }


    function handleRightClick(event) {
        // Prevent the default context menu
        event.preventDefault();
        options.set({ isVisible:true, canSwap, targetX:event.clientX, targetY:event.clientY, 
                        type:styleInfo.type, styleID:styleInfo.id, styleName:styleInfo.name, 
                        pageID:id, pageName:name, nodeIDs});
    }

</script>




<p class="small" on:contextmenu={handleRightClick}><b>{nodeIDs.length}</b> in {name}</p>




<style>
    p{
        color: var(--color-blue-4);
        cursor: default;
    }

    p:hover{
        background-color: var(--color-blue-1);
    }
</style>