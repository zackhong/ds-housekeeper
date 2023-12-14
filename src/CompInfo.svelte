<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100,1,0" />
<script>
    import Button from "./Button.svelte";

    export let isLocal=true;
    export let id;

    //handler attached to View button
    function viewLocalComp(){
        const customEvent = new CustomEvent('customEvent', {
            detail: { action:'view-local-comp', id:id },
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }
</script>



<div class="cont">
    <span class="material-symbols-outlined icon">grid_view</span>
    {#if isLocal}
        <Button label='View'
            type='secondary'
            onClick={viewLocalComp}
            hasIcon=true
            iconName='visibility'/>
    {/if}
</div>





<style>
    div{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-s);
        width: 80px;
    }

    .icon{
        font-size: var(--size-ml);
        color: var(--color-comp);
        transform: rotate(45deg);
    }
</style>