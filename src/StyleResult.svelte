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
</script>


<tr>
    <td class="info">
        <Tag isLocal={isLocal}/>
        {#if type=='text'}
            <TextInfo {...info}/>
        {:else if type=='color'}
            <ColorInfo id={id} {...info}/>
        {:else if type=='comp'}
            <CompInfo isLocal={isLocal} id={id}/>
        {/if}
    </td>
    <td class="name">
        <div class="style-name">
            <p class="large bold">{name}</p>
            <!-- <p class="small">{id}</p> -->
            {#if totalCount == 0 && isLocal}
                <Button label='Delete' 
                type='warning'
                action='prompt-delete-style'
                input={{id:id, type:type, name:name}}
                hasTooltip=true 
                tooltipText='Delete this style.'/>
            {/if}
        </div>
        <Usage 
        totalCount={totalCount} 
        pages={pages} 
        id={id} 
        type={type} 
        name={name}/>
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

    td.name .style-name{
        display: flex;
        flex-direction: row;
        align-items: center;
        column-gap: var(--size-s);
    }

    td.name p.large{
        max-width: 220px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

</style>