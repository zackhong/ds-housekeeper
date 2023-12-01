<script>
    export let isLocal=true;
</script>



<div class:remote={!isLocal}><p class="small">{isLocal? "local": "remote"}</p></div>





<style>
    /* style is tagged as local by default */
    div{
        width:auto;
        padding: 2px var(--size-xs);
        outline: 1px solid var(--color-local);
    }

    div p{
        color: var(--color-local);
    }

    /* for rendering remote tag */
    .remote{
        outline: 1px solid var(--color-remote);
    }

    .remote p{
        color: var(--color-remote);
    }
</style>