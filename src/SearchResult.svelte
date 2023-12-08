<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100,1,0" />

<script>
    export let id;
    export let type='text';
    export let name;

    function handleClick(){
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: 'search-selection', input: {id:id, type:type} },
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

</script>


<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
<div on:click={handleClick}>
    {#if type == 'text'}
        <span class="material-symbols-outlined icon">format_size</span>
    {:else if type == 'color'}
        <span class="material-symbols-outlined icon">lens</span>
    {:else}
        <span class="material-symbols-outlined icon comp">grid_view</span>
    {/if}
    <p>{name}</p>
</div>





<style>
    div{
        display: flex;
        flex-direction: row;
        align-items: center;
        column-gap: var(--size-s);
        
        box-sizing: border-box;
        width: 100%;
        padding: var(--size-xs);
    }

    div:hover{
        background-color: var(--color-blue-1);
    }

    p{
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    .icon{
        font-size: 16px;
    }

    .comp{
        color: var(--color-comp);
        transform: rotate(45deg);
    }
</style>