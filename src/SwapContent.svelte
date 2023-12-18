<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,100,0,0" />
<script>
    //contents for when swapping styles of layers/instances
    import Dropdown from "./Dropdown.svelte";
    import SearchBar from "./SearchBar.svelte";

    export let type='', fromName='something', selectedName, selectedID;
    let options = [], width = 140;
    let threshold = 15;
</script>




<div class='horz'>
    <div class="vert">
        <p>From:</p>
        <p class="bold">{fromName}</p>
    </div>
    <div class="vert">
        <p>To:</p>
        {#if options.length > threshold}
            <SearchBar width={width}/>
        {:else}
            <Dropdown width={width}/>
        {/if}
    </div>
</div>




<style>
    .horz{
        display: flex;
        flex-direction: row;
        align-items: start;
        column-gap: var(--size-ml);
    }

    .vert{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-xs);
    }
</style>