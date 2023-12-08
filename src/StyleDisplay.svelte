<script>
    //displays results from plugin code
    import StyleResult from './StyleResult.svelte';
    import { onMount, onDestroy } from 'svelte';

    let display;
    let text=[];
    let colors=[];
    let comps=[];
    let viewing = 'Text'; //'Text', 'Colors', 'Components', 'Search'

    let searchResult;//to be set when user selects an autocomplete result from the searchbar
    let searchType;

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





    //checks all its list of styles that match input text from searchbar,
    //then sends their names, if any, back to searchbar
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
            detail: { type: 'found', input: names},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }



    //finds selected search result from searchbar and displays it
    function showSelectedSearch(input){

        searchType = input.type;
        switch(input.type){

            case 'text':
            searchResult = text.find( item => item.id == input.id );
            break;

            case 'color':
            searchResult = colors.find( item => item.id == input.id );
            break;

            case 'comp':
            searchResult = comps.find( item => item.id == input.id );
            break;
        }
        viewing = 'Search';
    }

    //deletes selected style; resets viewing mode based on which type of style was deleted
    function deleteText(input){
        text = text.filter( item => item.id != input.id );
        if(viewing == 'Search'){ viewing = 'Text'; }
    }

    function deleteColor(input){
        colors = colors.filter( item => item.id != input.id );
        if(viewing == 'Search'){ viewing = 'Colors'; }
    }

    function deleteComp(input){
        comps = comps.filter( item => item.id != input.id );
        if(viewing == 'Search'){ viewing = 'Components'; }
    }



    //finds style according to id and update its usage
    function updateStyle(message){
        let updatedStyle;
        switch(message.type){
            case "update-text":
            //finds the corresponding item inside text list, updates its totalCount and pages props, and remaps an enitrely new array
            updatedStyle = text.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages, pageCount: message.pageCount} : item);
            //use reassignment to trigger refresh on all Result components referencing this array
            text = updatedStyle;
            break;

            case "update-color":
            updatedStyle = colors.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages, pageCount: message.pageCount} : item);
            colors = updatedStyle;
            break;

            case "update-comp":
            updatedStyle = comps.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages, pageCount: message.pageCount} : item);
            comps = updatedStyle;
            break;
        }
        //update usage if it's currently showing selected search result
        if(viewing == 'Search' && searchResult.id == message.id){
            searchResult = {...searchResult, totalCount: message.totalCount, pages: message.pages, pageCount: message.pageCount};
        }
    }

    //handles custom events from other UI components
    function handleCustomEvent(event) {
        switch(event.detail.type){

			case 'display-option':
			viewing = event.detail.input;
			break;

            case 'search':
			findMatch(event.detail.input);
			break;

            case 'search-selection':
			showSelectedSearch(event.detail.input);
			break;

            case 'delete-text':
			deleteText(event.detail.input);
			break;

            case 'delete-color':
			deleteColor(event.detail.input);
			break;

            case 'delete-comp':
			deleteComp(event.detail.input);
			break;
		}
	}

    //handles messages from plugin sent via pluginUI
    export function handleMessage(message){
        switch(message.type){

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
</script>



<table bind:this={display}>
    <tbody>
        {#if viewing == 'Text'}
            {#if text.length > 0}
                {#each text as textEntry}
                    <StyleResult type='text' {...textEntry}/>
                {/each}
            {:else}
                <div class="empty"><p class="small">We didn't find any text styles. Would you like to reload the plugin or search from your imported libraries?</p></div>
            {/if}
        {/if}
        
        {#if viewing == 'Colors'}
            {#if colors.length > 0}
                {#each colors as colorEntry}
                    <StyleResult type='color' {...colorEntry}/>
                {/each}
            {:else}
                <div class="empty"><p class="small">We didn't find any color styles. Would you like to reload the plugin or search from your imported libraries?</p></div>
            {/if}
        {/if}
        
        {#if viewing == 'Components'}
            {#if comps.length > 0}
                {#each comps as compEntry}
                    <StyleResult type='comp' {...compEntry}/>
                {/each}
            {:else}
                <div class="empty"><p class="small">We didn't find any components. Would you like to reload the plugin or search from your imported libraries?</p></div>
            {/if}
        {/if}

        {#if viewing == 'Search'}
            <StyleResult type={searchType} {...searchResult}/>
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