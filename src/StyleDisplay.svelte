<script>
    //displays results from plugin code
    import StyleResult from './StyleResult.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { displayMode, selectedSearch, results } from './stores.js';

    let searchResult;//to be set when user selects an autocomplete result from the searchbar
    let scrollClass = $results.canScroll ? '' : 'no-scroll';





    onMount(() => {
        document.addEventListener('customEvent', handleCustomEvent);
    });

    onDestroy(() => {
        document.removeEventListener('customEvent', handleCustomEvent);
    });

    //finds and displays selected style when user clicks on a result in the searchbar
    $: if( $displayMode == 'custom' ){

        switch($selectedSearch.type){

        case 'text':
        searchResult = $results.text.find( item => item.id == $selectedSearch.id );
        break;

        case 'color':
        searchResult = $results.colors.find( item => item.id == $selectedSearch.id );
        break;

        case 'comp':
        searchResult = $results.comps.find( item => item.id == $selectedSearch.id );
        break;
        }
    }




    //handles custom events from other UI components
    function handleCustomEvent(event) {
        switch(event.detail.action){

            case 'delete-style':
			deleteStyle(event.detail);
			break;

            case 'delete-all-layers':
            deleteAllLayers(event.detail);
            break;

            case 'delete-layers-from-page':
            deleteLayersFromPage(event.detail);
            break;

            case 'swap-all-layers':
            swapAllLayers(event.detail);
            break;

            case 'swap-layers-from-page':
            swapLayersFromPage(event.detail);
            break;
		}
	}

    //handles messages from plugin sent via pluginUI
    export function handleMessage(message){
        switch(message.action){

            case "load-start":
            results.update(currResults => {
                return {...currResults, canScroll:false};
            });
            break;

            case "load-end":
            results.update(currResults => {
                return {...currResults, canScroll:true};
            });
            break;

            case "display-text":
            results.update(currResults => {
                const newText = [...currResults.text, ...message.data];
                return {...currResults, text:newText};
            });
            updateSwappableText();
            break;

            case "display-colors":
            results.update(currResults => {
                const newColors = [...currResults.colors, ...message.data];
                return {...currResults, colors:newColors};
            });
            updateSwappableColors();
            break;

            case "display-comps":
            results.update(currResults => {
                const newComps = [...currResults.comps, ...message.data];
                return {...currResults, comps:newComps};
            });
            updateSwappableComps();
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
            updatedStyles = $results.text.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages} : item);
            //use reassignment to trigger refresh on all Result components referencing this array
            results.update(currResults => {
                return {...currResults, text:updatedStyles}
            });
            break;

            case "update-color":
            updatedStyles = $results.colors.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages} : item);
            results.update(currResults => {
                return {...currResults, colors:updatedStyles}
            });
            break;

            case "update-comp":
            updatedStyles = $results.comps.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages} : item);
            results.update(currResults => {
                return {...currResults, comps:updatedStyles}
            });
            break;
        }
        //update usage if it's currently showing selected search result
        if(displayMode == 'custom' && searchResult.id == message.id){
            searchResult = {...searchResult, totalCount: message.totalCount, pages: message.pages, pageCount: message.pageCount};
        }
    }







    //----------------UPDATES WHICH STYLES ARE SWAPPABLE
    function updateSwappableText(){
        if($results.text.length > 1) {
            results.update(currResults => { return {...currResults, canSwapText:true} });
        }
        else{
            results.update(currResults => { return {...currResults, canSwapText:false} });
        }
    }

    function updateSwappableColors(){
        if($results.colors.length > 1) {
            results.update(currResults => { return {...currResults, canSwapColors:true} });
        }
        else{
            results.update(currResults => { return {...currResults, canSwapColors:false} });
        }
    }

    function updateSwappableComps(){
        if($results.comps.length > 1) {
            results.update(currResults => { return {...currResults, canSwapComps:true} });
        }
        else{
            results.update(currResults => { return {...currResults, canSwapComps:false} });
        }
    }






    //-------------------DELETE OPERATIONS
    function deleteStyle(detail){

        switch(detail.type){
            case 'text':
            const newText = $results.text.filter( item => item.id != detail.id );
            results.update(currResults => { return {...currResults, text:newText} });
            updateSwappableText();
            if($displayMode == 'custom'){ displayMode.set('text'); }
            break;

            case 'color':
            const newColors = $results.colors.filter( item => item.id != detail.id );
            results.update(currResults => { return {...currResults, colors:newColors} });
            updateSwappableColors();
            if($displayMode == 'custom'){ displayMode.set('color'); }
            break;

            case 'comp':
            const newComps = $results.comps.filter( item => item.id != detail.id );
            results.update(currResults => { return {...currResults, comps:newComps} });
            updateSwappableComps();
            if($displayMode == 'custom'){ displayMode.set('comp'); }
            break;
        }
    }

    //deletes all layers from selected style
    function deleteAllLayers(detail){

        //find target style
        let updatedStyles;
        //if we checked yes for deleting the style, just delete the entire entry from its corresponding list
        if(detail.deleteStyle){ deleteStyle(detail); }
        //otherwise, just clear page info and total count from that style
        else{
            switch(detail.type){
                case 'text':
                    updatedStyles = $results.text.map(item => item.id === detail.id ? {...item, totalCount:0, pages:[]} : item);
                    results.update(currResults => {
                        return {...currResults, text:updatedStyles}
                    });
                break;

                case 'color':
                    updatedStyles = $results.colors.map(item => item.id === detail.id ? {...item, totalCount:0, pages:[]} : item);
                    results.update(currResults => {
                        return {...currResults, colors:updatedStyles}
                    });
                break;

                case 'comp':
                    updatedStyles = $results.comps.map(item => item.id === detail.id ? {...item, totalCount:0, pages:[]} : item);
                    results.update(currResults => {
                        return {...currResults, comps:updatedStyles}
                    });
                break;
            }
        }
    }

    //deletes layers/instances from selected style and page
    function deleteLayersFromPage(detail){

        let targetStyle, newPages, updatedStyles, newCount;
        switch (detail.type){

            case 'text':
                targetStyle = $results.text.find( item => item.id == detail.styleID );

                newCount = targetStyle.totalCount - detail.nodeIDs.length;
                newPages = targetStyle.pages.filter(pageInfo => pageInfo.id != detail.pageID);

                targetStyle.totalCount = newCount;
                targetStyle.pages = newPages;
                updatedStyles = $results.text.map( item => (item.id == detail.styleID)? targetStyle : item );
                results.update(currResults => {
                    return {...currResults, text:updatedStyles}
                });
            break;

            case 'color':
                targetStyle = $results.colors.find( item => item.id == detail.styleID );

                newCount = targetStyle.totalCount - detail.nodeIDs.length;
                newPages = targetStyle.pages.filter(pageInfo => pageInfo.id != detail.pageID);

                targetStyle.totalCount = newCount;
                targetStyle.pages = newPages;
                updatedStyles = $results.colors.map( item => (item.id == detail.styleID)? targetStyle : item );
                results.update(currResults => {
                    return {...currResults, colors:updatedStyles}
                });
            break;

            case 'comp':
                targetStyle = $results.comps.find( item => item.id == detail.styleID );

                newCount = targetStyle.totalCount - detail.nodeIDs.length;
                newPages = targetStyle.pages.filter(pageInfo => pageInfo.id != detail.pageID);

                targetStyle.totalCount = newCount;
                targetStyle.pages = newPages;
                updatedStyles = $results.comps.map( item => (item.id == detail.styleID)? targetStyle : item );
                results.update(currResults => {
                    return {...currResults, comps:updatedStyles}
                });
            break;
        }
    }






    //---------------SWAPS LAYERS
    //swaps all layers from selected style
    function swapAllLayers(detail){

        //find the target and swapped styles
        let targetStyle, swappedStyle;
        switch(detail.type){
            case 'text':
                targetStyle = $results.text.find( item => item.id == detail.id );
                swappedStyle = $results.text.find( item => item.id == detail.swapID );
            break;

            case 'color':
                targetStyle = $results.colors.find( item => item.id == detail.id );
                swappedStyle = $results.colors.find( item => item.id == detail.swapID );
            break;

            case 'comp':
                targetStyle = $results.comps.find( item => item.id == detail.id );
                swappedStyle = $results.comps.find( item => item.id == detail.swapID );
            break;
        }

        //next, transfer page info and total count from target to swapped style
        //if swapped style is scanned ie pages is not null, update its page info on UI side
        if(swappedStyle.pages){
            for(const targetPage of targetStyle.pages){
                //find matching page in swapped style
                const matchingPage = swappedStyle.pages.find(page => page.id == targetPage.id);
                //if matching page is found, merge node ids of both pages into merged page
                if(matchingPage){
                    matchingPage.nodeIDs = matchingPage.nodeIDs.concat(targetPage.nodeIDs);
                }
                //if no matching page found, just push target page into merged pages
                else{
                    swappedStyle.pages.push(targetPage);
                }
                swappedStyle.totalCount += targetPage.nodeIDs.length;
            }
        }

        //then, update the target style
        targetStyle.pages = [];
        targetStyle.totalCount = 0;

        //if we checked yes for deleting the style, just delete the entire entry from its corresponding list
        if(detail.deleteStyle){ deleteStyle(detail); }
    }

    //deletes layers/instances from selected style and page
    function swapLayersFromPage(detail){

        //find the target and swapped styles
        let targetStyle, swappedStyle;
        switch(detail.type){
            case 'text':
                targetStyle = $results.text.find( item => item.id == detail.styleID );
                swappedStyle = $results.text.find( item => item.id == detail.swapID );
            break;

            case 'color':
                targetStyle = $results.colors.find( item => item.id == detail.styleID );
                swappedStyle = $results.colors.find( item => item.id == detail.swapID );
            break;

            case 'comp':
                targetStyle = $results.comps.find( item => item.id == detail.styleID );
                swappedStyle = $results.comps.find( item => item.id == detail.swapID );
            break;
        }

        //next, transfer page info and total count from target to swapped style
        const targetPage = targetStyle.pages.find(page => page.id == detail.pageID);
        //if swapped style is scanned ie pages is not null, update its page info on UI side
        if(swappedStyle.pages){
                
            const matchingPage = swappedStyle.pages.find(page => page.id == targetPage.id);
            //if matching page is found, merge node ids of both pages into merged page
            if(matchingPage){
                matchingPage.nodeIDs = matchingPage.nodeIDs.concat(targetPage.nodeIDs);
            }
            //if no matching page found, just push target page into swapped style
            else{
                swappedStyle.pages.push(targetPage);
            }
            swappedStyle.totalCount += targetPage.nodeIDs.length;
        }

        //then, update the target style
        targetStyle.pages = targetStyle.pages.filter(page => page.id != targetPage.id);
        targetStyle.totalCount -= targetPage.nodeIDs.length;
    }

</script>





<div class='table-cont {scrollClass}'>
<table>
    <tbody>
        {#if $displayMode == 'text'}
            {#if $results.text.length > 0}
                {#each $results.text as textEntry}
                    <StyleResult type='text' {...textEntry}/>
                {/each}
            {:else}
                <div class="empty"><p class="small">We didn't find any text styles. Would you like to reload the plugin or search from your imported libraries?</p></div>
            {/if}
        {/if}
        
        {#if $displayMode == 'color'}
            {#if $results.colors.length > 0}
                {#each $results.colors as colorEntry}
                    <StyleResult type='color' {...colorEntry}/>
                {/each}
            {:else}
                <div class="empty"><p class="small">We didn't find any color styles. Would you like to reload the plugin or search from your imported libraries?</p></div>
            {/if}
        {/if}
        
        {#if $displayMode == 'comp'}
            {#if $results.comps.length > 0}
                {#each $results.comps as compEntry}
                    <StyleResult type='comp' {...compEntry}/>
                {/each}
            {:else}
                <div class="empty"><p class="small">We didn't find any components. Would you like to reload the plugin or search from your imported libraries?</p></div>
            {/if}
        {/if}

        {#if $displayMode == 'custom'}
            <StyleResult type={$selectedSearch.type} {...searchResult}/>
        {/if}
    </tbody>
</table>
</div>





<style>
    .table-cont{
        /* we need to offset by the height of the menu bar so that we can scroll results all the way to the bottom*/
        height: calc(100% - 72px);
        overflow: auto;
    }

    .no-scroll {
        overflow: hidden; /* Disable scrolling */
    }

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