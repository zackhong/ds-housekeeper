<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100,1,0" />
<script>
    import Button from "./Button.svelte";

    export let isLocal=true;
    export let id;
</script>



<div class="cont">
    <span class="material-symbols-outlined icon">grid_view</span>
    {#if isLocal}
        <Button label='View'
            type='secondary'
            action='view-local-comp'
            input={{id:id}}
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