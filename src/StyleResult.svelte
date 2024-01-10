<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100,0,0" />

<script>
    import Button from "./Button.svelte";
    import Tag from "./Tag.svelte";
    import TextInfo from "./TextInfo.svelte";
    import ColorInfo from "./ColorInfo.svelte";
    import Usage from "./Usage.svelte";
    import CompInfo from "./CompInfo.svelte";
    import {setContext} from 'svelte';

    //for formatting data of each style
    export let id, name, isLocal=true, type='text', info;

    //total no. of nodes using this style; -1 -> unscanned, 0 and above -> scanned
    //pages is an array of page ids, each with its own array of nodes that belong to it
    export let totalCount, pages;

    //info for this component's descendants to access w/o having to drill its props down
    //eg no more <Child id={id} name={name}.../> and <GreatGrandChild id={id} name={name}.../>
    let contextValue;
    $: contextValue = {id, name, type, isLocal};
    $: setContext('styleInfo', contextValue);

    //attached to delete button next to local style if scanning reveals 0 layers using it
    function deleteStyle(){
        const customEvent = new CustomEvent('customEvent', {
            detail: { action:'popup-delete-style', type, styleID:id, styleName:name },
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

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
            {#if totalCount == 0 && isLocal}
                <Button label='Delete' 
                type='warning'
                hasTooltip=true 
                tooltipText='Delete this style.'
                onClick={deleteStyle}/>
            {/if}
        </div>
        <Usage  totalCount={totalCount}  pages={pages}/>
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