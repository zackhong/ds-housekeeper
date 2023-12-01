<script>
    //displays the usage stats of a given style

    //total no. of nodes using this style; -1 -> unscanned, 0 and above -> scanned
    export let totalCount = -1;
    export let pages;//using an associative array passed from plugin code

    $: isScanned = (totalCount < 0) ? false: true;

</script>




<div class="header">
    <p class="small" class:scanned={isScanned} >
        {#if !isScanned}
            ? layers
        {:else if totalCount == 1}
            {totalCount} layer
        {:else}
            {totalCount} layers
        {/if}
    </p>
    {#if isScanned && totalCount > 0}
        <span class="material-symbols-outlined icon">expand_more</span>
    {/if}
</div>
<div></div>





<style>
    .header{
        display: flex;
        flex-direction: row;
        align-items: center;
        column-gap: var(--size-xs);
        width: 98px;
    }

    p.small{
        color: var(--color-gray-3);
    }

    p.scanned{
        color: var(--color-link);
    }

    .icon{
        font-size: var(--size-ml);
        color: var(--color-link);
    }

    .body{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-xs);
    }
</style>