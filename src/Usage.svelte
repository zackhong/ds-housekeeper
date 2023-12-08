<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200,0,0" />
<script>
    //displays the usage stats of a given style
    import { slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import PageInfo from './PageInfo.svelte';
    import Button from "./Button.svelte";
    
    //total no. of nodes using this style; -1 -> unscanned, 0 and above -> scanned
    export let totalCount = -1;
    export let pages;//using an associative array passed from plugin code

    export let id;
    export let type;
    export let name;

    $: isScanned = (totalCount < 0) ? false: true;
    let isExpanded = false;

    //toggles breakdown of pages, if any
    function handleClick(){
        isExpanded = !isExpanded;
    }

</script>



<div class="main">
    <div class="header">
        <div>
            <p class={isScanned? (totalCount > 0? 'has-count': 'no-count'): 'not-scanned'} >
                {#if !isScanned}
                    ? layers
                {:else if totalCount == 1}
                    {totalCount} layer
                {:else}
                    {totalCount} layers
                {/if}
            </p>
            {#if isScanned && totalCount > 0}
                <!-- include this comment below to tell Svelte to STFU about accesibility warnings when coding -->
                <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
                <span class="material-symbols-outlined icon" on:click={handleClick}>{isExpanded? 'expand_less' : 'expand_more'}</span>
            {/if}
        </div>
        
        <!-- list of actions applying to this style-->
        <Button label={!isScanned? 'Scan' : 'Rescan'} 
                hasTooltip=true 
                tooltipText='Tracks every layer using this style.<br><br>Warning: might be slow for large file!' 
                action='scan-{type}'
                input={{id:id, name:name}}/>

        {#if isScanned && totalCount > 0}

            <Button label='Swap' 
                type='secondary'
                hasTooltip=true 
                tooltipText='Swaps all layers to use another relevant style.'/>

            <Button label='Delete' 
                type='warning'
                hasTooltip=true 
                tooltipText='Deletes all layers using this style.'/>
        {/if}
    </div>

    <!-- list of pages, if any -->
    {#if isScanned && totalCount > 0 && isExpanded}
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