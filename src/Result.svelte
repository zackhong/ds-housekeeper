<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100,0,0" />

<script>
    import Button from "./Button.svelte";
    import Tag from "./Tag.svelte";
    import TextInfo from "./TextInfo.svelte";
    import ColorInfo from "./ColorInfo.svelte";
    import Usage from "./Usage.svelte";
    import CompInfo from "./CompInfo.svelte";

    //for formatting data of each style
    export let id;
    export let name;
    export let isLocal=true;
    export let type='text';
    export let info;

    //total no. of nodes using this style; -1 -> unscanned, 0 and above -> scanned
    export let totalCount = -1;
    export let pages;//using an associative array passed from plugin code

    $: isScanned = (totalCount < 0) ? false: true;
</script>


<tr>
    <td class="info">
        <Tag isLocal={isLocal}/>
        {#if type=='text'}
            <TextInfo {...info}/>
        {:else if type=='color'}
            <ColorInfo {...info}/>
        {:else if type=='comp'}
            <CompInfo/>
        {/if}
    </td>
    <td class="name">
        <p class="large bold">{name}</p>
        <div>
            <Usage totalCount={totalCount} pages={pages}/>
            <Button label={!isScanned? 'Scan' : 'Rescan'} 
                size='small'
                hasTooltip=true 
                tooltipText='Tracks every layer using this style.<br><br>Warning: might be slow for large file!' 
                action='scan-{type}'
                input={{id:id, name:name}}/>
        </div>
    </td>
    <td class="actions">
        {#if totalCount && totalCount.length == 0}
            <Button label='Delete' type='warning'/>
        {:else if totalCount && totalCount.length > 0}
            <Button label='Delete' type='warning'/>
            <Button label='Replace'/>
        {/if}
    </td>
</tr>



<style>
    tr{
        height: auto;
        border-bottom: 1px solid var(--color-gray-1);
        display: flex;
    }

    td{
        padding: var(--size-s);
    }

    td.info{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-s);
        width: 100px;
    }

    td.name{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-s);
        width: 100%;
    }

    td.name div{
        display: flex;
        flex-direction: row;
        align-items: center;
        column-gap: var(--size-s);
    }

    td.actions{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-xs);
    }

</style>