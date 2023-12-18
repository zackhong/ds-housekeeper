<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200,0,0" />
<script>
    //displays the usage stats of a given style
    import { slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import PageInfo from './PageInfo.svelte';
    import Button from "./Button.svelte";
    import {getContext} from 'svelte';
    
    export let totalCount;
    export let pages;//using an associative array passed from plugin code

    let styleInfo = getContext('styleInfo');
    let countText;

    let isExpanded = false;
    $: if(totalCount == undefined || totalCount == null){ 
        countText = `? ${(styleInfo.type == 'comp')? 'instances': 'layers'}`; 
    }
    else if(totalCount == 1){ 
        countText = `1 ${(styleInfo.type == 'comp')? 'instance': 'layer'}`; 
    }
    else{ 
        countText = `${totalCount} ${(styleInfo.type == 'comp')? 'instances': 'layers'}`; 
    }

    //toggles breakdown of pages, if any
    function handleClick(){
        isExpanded = !isExpanded;
    }

    //handler attached to Scan/Rescan button
    function scanStyle(){
        const customEvent = new CustomEvent('customEvent', {
            detail: { action:`scan-${styleInfo.type}-start`, id:styleInfo.id, name:styleInfo.name },
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    //attached to swap button
    function swapAllLayers(){
        const customEvent = new CustomEvent('customEvent', {
            detail: { action:'popup-swap-all-layers', type:styleInfo.type, styleID:styleInfo.id, styleName:styleInfo.name, pages },
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    //attached to delete button next to all layers
    function deleteAllLayers(){
        const customEvent = new CustomEvent('customEvent', {
            detail: { action:'popup-delete-all-layers', type:styleInfo.type, styleID:styleInfo.id, styleName:styleInfo.name, pages },
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }
</script>



<div class="main">
    <div class="header">
        <div>
            {#if totalCount == undefined || totalCount == null}
                <p class="not-scanned">{countText}</p>
            {:else if totalCount == 0}
                <p class="no-count">{countText}</p>
            {:else}
                <p class="has-count">{countText}</p>
                <!-- include this comment below to tell Svelte to STFU about accesibility warnings when coding -->
                <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
                <span class="material-symbols-outlined icon" on:click={handleClick}>{isExpanded? 'expand_less' : 'expand_more'}</span>
            {/if}
        </div>
        
        <!-- list of actions applying to this style-->
        <Button label={(totalCount == undefined || totalCount == null)? 'Scan' : 'Rescan'} 
                hasTooltip=true 
                tooltipText='Tracks every layer using this style.<br><br>Warning: might be slow for large file!' 
                onClick={scanStyle}/>

        {#if !(totalCount == undefined || totalCount == null) && totalCount > 0}

            <Button label='Swap' 
                type='secondary'
                hasTooltip=true 
                tooltipText='Swaps all layers to use another relevant style.'
                onClick={swapAllLayers}/>

            <Button label='Delete' 
                type='warning'
                hasTooltip=true 
                tooltipText='Deletes all layers using this style.'
                onClick={deleteAllLayers}/>
        {/if}
    </div>

    <!-- list of pages, if any -->
    {#if totalCount && totalCount > 0 && isExpanded}
        <div class="body" transition:slide={{duration:200, easing:cubicOut}}>
            {#each pages as page}
                <PageInfo {...page}/>
            {/each}
        </div>
    {/if}
</div>





<style>
    .main{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-xs);
    }

    .header{
        display: flex;
        flex-direction: row;
        align-items: center;
        column-gap: var(--size-xs);
    }

    .header div{
        display: flex;
        flex-direction: row;
        align-items: center;
        column-gap: var(--size-xs);
        width: 98px;
    }

    .not-scanned{
        color: var(--color-gray-3);
        
    }

    .no-count{
        color: var(--color-red-4);
    }

    .has-count{
        color: var(--color-blue-4);
    }

    .icon{
        font-size: var(--size-ml);
        color: var(--color-blue-4);
        cursor: default;
    }

    .body{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-xs);
    }
</style>