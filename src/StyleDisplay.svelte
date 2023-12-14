<script>
    //displays results from plugin code
    import StyleResult from './StyleResult.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { resultMode, selectedSearch } from './stores.js';

    let display;
    let text=[];
    let colors=[];
    let comps=[];

    let searchResult;//to be set when user selects an autocomplete result from the searchbar

    //checks if loading screen is running
    let isLoading = false;





    onMount(() => {
        updateBodyScroll();
        document.addEventListener('customEvent', handleCustomEvent);
    });

    onDestroy(() => {
        document.body.style.overflow = ''; // Reset when the component is destroyed
        document.removeEventListener('customEvent', handleCustomEvent);
    });

    //toggles the overflow style porperty of the document body to disable scrollbars from appearing when loading screen is running
    function updateBodyScroll() {
        document.body.style.overflow = isLoading ? 'hidden' : '';
    }

    //finds and displays selected style when user clicks on a result in the searchbar
    $: if( $resultMode == 'Custom' ){

        switch($selectedSearch.type){

        case 'text':
        searchResult = text.find( item => item.id == $selectedSearch.id );
        break;

        case 'color':
        searchResult = colors.find( item => item.id == $selectedSearch.id );
        break;

        case 'comp':
        searchResult = comps.find( item => item.id == $selectedSearch.id );
        break;
        }
    }




    //handles custom events from other UI components
    function handleCustomEvent(event) {
        switch(event.detail.action){

            case 'search':
			findMatch(event.detail.value);
			break;

            case 'delete-text': case 'delete-color': case 'delete-comp':
			deleteStyle(event.detail);
			break;

            case 'delete-all-layers':
            deleteAllLayers(event.detail);
            break;

            case 'delete-layers-from-page':
            deleteLayersFromPage(event.detail);
            break;
		}
	}

    //handles messages from plugin sent via pluginUI
    export function handleMessage(message){
        switch(message.action){

            case "load-start":
            isLoading = true;
            break;

            case "load-end":
            isLoading = false;
            break;

            case "display-text":
            text.push(...message.data);
            text=[...text];
            break;

            case "display-colors":
            colors.push(...message.data);
            colors=[...colors];
            break;

            case "display-comps":
            comps.push(...message.data);
            comps=[...comps];
            break;

            case "update-text": case "update-color": case "update-comp":
            updateStyle(message);
            break;
        }
    }




    //----------------UPDATING STYLES
    function updateStyle(message){
        let updatedStyles;
        switch(message.action){
            case "update-text":
            //finds the corresponding item inside text list, updates its totalCount and pages props, and remaps an enitrely new array
            updatedStyles = text.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages} : item);
            //use reassignment to trigger refresh on all Result components referencing this array
            text = updatedStyles;
            break;

            case "update-color":
            updatedStyles = colors.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages} : item);
            colors = updatedStyles;
            break;

            case "update-comp":
            updatedStyles = comps.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages} : item);
            comps = updatedStyles;
            break;
        }
        //update usage if it's currently showing selected search result
        if(resultMode == 'Custom' && searchResult.id == message.id){
            searchResult = {...searchResult, totalCount: message.totalCount, pages: message.pages, pageCount: message.pageCount};
        }
    }





    //--------------------FINDS MATCHES FOR SEARCHBAR
    function findMatch(value){

        //compare both input string and style name in lowercase so that the search is case insensitive
        value = value.toLowerCase();
        let names=[];

        for(const textEntry of text){
            if(textEntry.name.toLowerCase().includes(value)){
                names.push({id:textEntry.id, type:'text', name:textEntry.name});
            }
        }

        for(const colorEntry of colors){
            if(colorEntry.name.toLowerCase().includes(value)){
                names.push({id:colorEntry.id, type:'color', name:colorEntry.name});
            }
        }

        for(const compEntry of comps){
            if(compEntry.name.toLowerCase().includes(value)){
                names.push({id:compEntry.id, type:'comp', name:compEntry.name});
            }
        }

        const customEvent = new CustomEvent('customEvent', {
            detail: { action: 'found', names: names},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }




    //-------------------DELETE OPERATIONS
    function deleteStyle(detail){

        let parts = detail.action.split('-');
        switch(parts[1]){
            case 'text':
            text = text.filter( item => item.id != detail.id );
            if($resultMode == 'Custom'){ resultMode.set('Text'); }
            break;

            case 'color':
            colors = colors.filter( item => item.id != detail.id );
            if($resultMode == 'Custom'){ resultMode.set('Colors'); }
            break;

            case 'comp':
            comps = comps.filter( item => item.id != detail.id );
            if($resultMode == 'Custom'){ resultMode.set('Components'); }
            break;
        }
    }

    //deletes all layers from selected style
    function deleteAllLayers(detail){

        //find target style
        let updatedStyles;
        //if we checked yes for deleting the style, just delete the entire entry from its corresponding list
        //otherwise, just clear page info and total count from that style
        switch(detail.type){

            case 'text':
                if(detail.deleteStyle){
                    text = text.filter( item => item.id != detail.id );
                    if($resultMode == 'Custom'){ resultMode.set('Text'); }
                }
                else{
                    updatedStyles = text.map(item => item.id === detail.id ? {...item, totalCount:0, pages:[]} : item);
                    text = updatedStyles;
                }
            break;

            case 'color':
                if(detail.deleteStyle){
                    colors = colors.filter( item => item.id != detail.id );
                    if($resultMode == 'Custom'){ resultMode.set('Colors'); }
                }
                else{
                    updatedStyles = colors.map(item => item.id === detail.id ? {...item, totalCount:0, pages:[]} : item);
                    colors = updatedStyles;
                }
            break;

            case 'comp':
                if(detail.deleteStyle){
                    comps = comps.filter( item => item.id != detail.id );
                    if($resultMode == 'Custom'){ resultMode.set('Components'); }
                }
                else{
                    updatedStyles = comps.map(item => item.id === detail.id ? {...item, totalCount:0, pages:[]} : item);
                    comps = updatedStyles;
                }
            break;
        }
    }

    //deletes layers/instances from selected style and page
    function deleteLayersFromPage(detail){

        let targetStyle, newPages, updatedStyles, newCount;
        switch (detail.type){

            case 'text':
                targetStyle = text.find( item => item.id == detail.styleID );

                newCount = targetStyle.totalCount - detail.nodeIDs.length;
                newPages = targetStyle.pages.filter(pageInfo => pageInfo.id != detail.pageID);

                targetStyle.totalCount = newCount;
                targetStyle.pages = newPages;
                updatedStyles = text.map( item => (item.id == detail.styleID)? targetStyle : item );
                text = updatedStyles;
            break;

            case 'color':
                targetStyle = colors.find( item => item.id == detail.styleID );

                newCount = targetStyle.totalCount - detail.nodeIDs.length;
                newPages = targetStyle.pages.filter(pageInfo => pageInfo.id != detail.pageID);

                targetStyle.totalCount = newCount;
                targetStyle.pages = newPages;
                updatedStyles = colors.map( item => (item.id == detail.styleID)? targetStyle : item );
                colors = updatedStyles;
            break;

            case 'comp':
                targetStyle = comps.find( item => item.id == detail.styleID );

                newCount = targetStyle.totalCount - detail.nodeIDs.length;
                newPages = targetStyle.pages.filter(pageInfo => pageInfo.id != detail.pageID);

                targetStyle.totalCount = newCount;
                targetStyle.pages = newPages;
                updatedStyles = comps.map( item => (item.id == detail.styleID)? targetStyle : item );
                comps = updatedStyles;
            break;
        }
    }

</script>



<table bind:this={display}>
    <tbody>
        {#if $resultMode == 'Text'}
            {#if text.length > 0}
                {#each text as textEntry}
                    <StyleResult type='text' {...textEntry}/>
                {/each}
            {:else}
                <div class="empty"><p class="small">We didn't find any text styles. Would you like to reload the plugin or search from your imported libraries?</p></div>
            {/if}
        {/if}
        
        {#if $resultMode == 'Colors'}
            {#if colors.length > 0}
                {#each colors as colorEntry}
                    <StyleResult type='color' {...colorEntry}/>
                {/each}
            {:else}
                <div class="empty"><p class="small">We didn't find any color styles. Would you like to reload the plugin or search from your imported libraries?</p></div>
            {/if}
        {/if}
        
        {#if $resultMode == 'Components'}
            {#if comps.length > 0}
                {#each comps as compEntry}
                    <StyleResult type='comp' {...compEntry}/>
                {/each}
            {:else}
                <div class="empty"><p class="small">We didn't find any components. Would you like to reload the plugin or search from your imported libraries?</p></div>
            {/if}
        {/if}

        {#if $resultMode == 'Custom'}
            <StyleResult type={$selectedSearch.type} {...searchResult}/>
        {/if}
    </tbody>
</table>





<style>

    table {
        background-color: white;
        width: 100%;
        height: auto;

        border-collapse: collapse;
        border-spacing: 0;
    }

    .empty{
        width: 100%;
        position: fixed;
        top: 50%;
        
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .empty p{
        width: 50%;
        text-align: center;
        color: var(--color-gray-3);
    }

</style>