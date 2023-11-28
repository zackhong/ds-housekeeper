<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100,0,0" />

<script>
    import Button from "./Button.svelte";
    import Help from "./Help.svelte";

    //for formatting data of each style
    export let id;
    export let name;
    export let info;
    //total count of all nodes/instances using this style
    export let count = null;
    //this stores an array of page arrays, with each page array holding a list of nodes/instances that use this style
    export let consumers;

    let isIrackingUsage = false;
</script>


<tr>
    <td class="info">
        <p>{info.fontName} {info.fontWeight}</p>
        <p class="bold">{info.fontSize}/{info.lineHeight}</p>
    </td>
    <td class="name">
        <p class="large bold">{name}</p>
        <p class="small">
            {#if !count}
                ?
            {:else}
                {count}
            {/if}
            layers used
        </p>
    </td>
    <td class="actions">
        <Button label='Scan' helpText='Finds how many layers/instances are using this style. \n Warning: might be slow for large file!'/>
    </td>
</tr>



<style>
    tr{
        height: auto;
        border: 1px solid var(--color-row-stripe);
        display: flex;
    }

    td{
        padding: var(--size-s);
    }

    td.info{
        width: 200px;
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-xs);
    }

    td.name{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-xs);
        width: 100%;
    }

    td.name p.small{
        color: var(--color-link);
    }

    td.actions{
        display: flex;
        flex-direction: column;
        align-items: center;
        column-gap: var(--size-xs);
    }
</style>