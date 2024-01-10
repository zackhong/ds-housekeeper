<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,100,0,0" />
<script>
    //shows a popup window with text, ok and cancel buttons;
    //blocks entire UI while popup is present
    import { onMount, onDestroy } from 'svelte';
    import Button from './Button.svelte';
    import { results } from './stores';
    import Dropdown from "./Dropdown.svelte";
    import SearchBar from "./SearchBar.svelte";

    let isVisible=false, mode='delete';
    let title='', bodyText='', checkboxText='';

    let fromName='something';
    let swapStyle = {id:'', type:'', name:''};
    let swapOptions = [], width = 140;
    let threshold = 15;
    let searchState = {isSearching:false,
                        text:'',
                        results:[]};

    let okText='Ok', cancelText = 'Cancel';
    let okAction; //this holds the ref to function to be attached to ok button's onClick event
    let searchbar;
    let hasCheckbox = false, isChecked = false, showWarning = false;
    
    onMount(() => {
        document.addEventListener('customEvent', handleCustomEvent);
        document.body.style.overflow = 'hidden';
    });

    onDestroy(() => {
        document.removeEventListener('customEvent', handleCustomEvent);
        document.body.style.overflow = '';
    });

    function handleCustomEvent(event) {
        switch(event.detail.action){

            case 'popup-delete-style':
            promptDeleteStyle(event.detail);
            break;

            case 'popup-delete-all-layers':
            promptDeleteAllLayers(event.detail);
            break;

            case 'popup-delete-from-page':
            promptDeleteFromPage(event.detail);
            break;

            case 'popup-swap-all-layers':
            promptSwapAllLayers(event.detail);
            break;

            case 'popup-swap-from-page':
            promptSwapFromPage(event.detail);
            break;
		}
	}




    function promptDeleteStyle(detail){

        mode='delete';
        let formattedType = (detail.type == 'comp')? 'component' : detail.type;
        title = `delete ${formattedType}`;
        bodyText = `You are about to delete the ${formattedType} <b>${truncateString(detail.styleName)}</b>. Are you sure?`;
        okText = 'Delete';
        okAction = () => deleteStyle(detail);
        hasCheckbox = false;
        isVisible = true;
    }

    function promptDeleteAllLayers(detail){

        mode='delete';
        let formattedType = (detail.type == 'comp')? 'instances' : 'layers';
        title = `delete all ${formattedType}`;
        bodyText = `You are about to delete all ${formattedType} from <b>${truncateString(detail.styleName)}</b>. Are you sure?`;

        hasCheckbox = detail.isLocal;
        if(hasCheckbox){ checkboxText = `Delete <b>${truncateString(detail.styleName)}</b> as well`; }
        
        okText = 'Delete All';
        okAction = () => deleteAllLayers(detail);
        isVisible = true;
    }

    function promptDeleteFromPage(detail){

        mode='delete';
        let formattedType = (detail.type == 'comp')? 'instances' : 'layers';
        title = `delete ${formattedType} from page`;
        let formattedName = truncateString(detail.pageName);
        bodyText = `You are about to delete all <b>${truncateString(detail.styleName)}</b> ${formattedType} in <b>${formattedName}</b>. Are you sure?`;
        hasCheckbox = false;
        okText = 'Delete All';
        okAction = () => deleteLayersFromPage(detail);
        isVisible = true;
    }

    function promptSwapAllLayers(detail){

        mode='swap';
        swapStyle = {id:'', type:detail.type, name:''};
        let formattedType = (detail.type == 'comp')? 'instances' : 'layers';
        title = `swap all ${formattedType}`;
        
        fromName = truncateString(detail.styleName, 12);
        initSwapOptions(detail);

        hasCheckbox = detail.isLocal;
        if(hasCheckbox){ checkboxText = `Delete <b>${truncateString(detail.styleName)}</b> as well`; }
        
        okText = 'Swap All';
        okAction = () => swapAllLayers(detail);
        isVisible = true;
    }

    function promptSwapFromPage(detail){

        mode='swap';
        swapStyle = {id:'', type:detail.type, name:''};
        let formattedType = (detail.type == 'comp')? 'instances' : 'layers';
        title = `Swap ${formattedType} from page`;
        
        fromName = truncateString(detail.styleName, 12);
        initSwapOptions(detail);

        hasCheckbox = false;
        okText = 'Swap';
        okAction = () => swapLayersFromPage(detail);
        isVisible = true;
    }


    


    //handler attached to ok button, executes different actions based on modal's current mode
    function deleteStyle(detail){

        isVisible = false;

        let customEvent = new CustomEvent('customEvent', {
            detail: { action:`delete-style`, id:detail.styleID, type:detail.type},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    //tells plugin ui to coordinate the deletion process on ui and plugin sides
    function deleteAllLayers(detail){

        isVisible = false;

        let customEvent = new CustomEvent('customEvent', {
            detail: { action:`delete-all-layers-start`, id:detail.styleID, type:detail.type, name:detail.styleName, pages:detail.pages, deleteStyle:isChecked},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    function deleteLayersFromPage(detail){

        isVisible = false;

        let customEvent = new CustomEvent('customEvent', {
            detail: { ...detail, action:`delete-layers-page-start` },
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    //tells plugin ui to coordinate the swapping process on ui and plugin sides
    function swapAllLayers(detail){

        //first check if we have selected a style to swap to; show warning message otherwise
        if(swapStyle.id.length == 0){
            showWarning = true;
        }
        else{
            isVisible = false;

            //check if swapped style is scanned; if not, tell plugin to rescan swapped style
            let chosenStyle, rescanSwapped = false;
			switch(detail.type){
				case 'text':
                    chosenStyle = $results.text.find( item => item.id == swapStyle.id );
				break;

				case 'color':
                    chosenStyle = $results.colors.find( item => item.id == swapStyle.id );
				break;

				case 'comp':
                    chosenStyle = $results.comps.find( item => item.id == swapStyle.id );
				break;
			}
			//tell plugin to rescan swapped style if it wasn't scanned before
			if(!chosenStyle.pages){ rescanSwapped = true; }

            let customEvent = new CustomEvent('customEvent', {
                detail: { action:`swap-all-layers-start`, type:detail.type, id:detail.styleID, name:detail.styleName, swapID:swapStyle.id, swapName:swapStyle.name, pages:detail.pages, deleteStyle:isChecked, rescanSwapped },
                bubbles: true
            });
            document.dispatchEvent(customEvent);
        }
    }

    function swapLayersFromPage(detail){

        if(swapStyle.id.length == 0){
            showWarning = true;
        }
        else{
            isVisible = false;

            //check if swapped style is scanned; if not, tell plugin to rescan swapped style
            let chosenStyle, rescanSwapped = false;
			switch(detail.type){
				case 'text':
                    chosenStyle = $results.text.find( item => item.id == swapStyle.id );
				break;

				case 'color':
                    chosenStyle = $results.colors.find( item => item.id == swapStyle.id );
				break;

				case 'comp':
                    chosenStyle = $results.comps.find( item => item.id == swapStyle.id );
				break;
			}
			//tell plugin to rescan swapped style if it wasn't scanned before
			if(!chosenStyle.pages){ rescanSwapped = true; }

            let customEvent = new CustomEvent('customEvent', {
                detail: { ...detail, action:`swap-layers-page-start`, swapID:swapStyle.id, swapName:swapStyle.name, rescanSwapped },
                bubbles: true
            });
            document.dispatchEvent(customEvent);
        }
    }





    //tells display to return all matches based on this input string; used by search bar 
    function findMatch(value) {

        //compare both input string and style name in lowercase so that the search is case insensitive
        value = value.toLowerCase();
        let outResults=[];

        for(const option of swapOptions){
            if(option.value.toLowerCase().includes(value)){
                outResults.push({id:option.id, type:swapStyle.type, name:option.value});
            }
        }

        searchState.isSearching = true;
        searchState.results = outResults;
    }








    function close(){
        if(searchbar && swapOptions.length > threshold){ searchbar.reset(); }
        showWarning  = isChecked = isVisible = false;
    }

    function toggleCheck(){
        isChecked = !isChecked;
    }

    //-----------HELPER FUNCTIONS
    //-----------init list of options that user can swap to
    function initSwapOptions(detail){

        //pick which styles to be allowed to swap based on type
        let chosenStyles;
        swapOptions = [];
        switch(detail.type){
            case 'text':
            chosenStyles = $results.text;
            break;

            case 'color':
            chosenStyles = $results.colors;
            break;

            case 'comp':
            chosenStyles = $results.comps;
            break;
        }

        for(const style of chosenStyles){
            if(style.id != detail.styleID){
                swapOptions.push({id:style.id, value:style.name});
            }
        }

        //init swap style data to be first option of dropdown if we're using dropdown
        if(swapOptions.length <= threshold){
            swapStyle = {...swapStyle, id:swapOptions[0].id, name:swapOptions[0].value};
        }
    }

    //updates swapped style to which search option in dropdown was picked
    function setSwappedStyleDropdown(option){
        if(swapStyle.id != option.id){ 
            swapStyle = {...swapStyle, id:option.id, name:option.value};
        }
    }

    //sets swapped style based on which search result in searchbar was selected
    function setSwappedStyleSearchbar(id, type, name){

        searchState.isSearching = false;
        searchState.text = name;
        swapStyle = {...swapStyle, id, name};
    }

    //shortens string for long names
    function truncateString(str, maxLength=20) {
        if (str.length > maxLength) {
            return '...' + str.substring(str.length - maxLength);
        } else {
            return str;
        }
    }
</script>




{#if isVisible}
<div class="blocker">
    <div class="main">
        <p class="large bold">{title}</p>
        {#if mode=='swap'}
            <div class='horz'>
                <div class="vert">
                    <p>From:</p>
                    <p class="bold">{fromName}</p>
                </div>
                <div class="vert">
                    <p>To:</p>
                    {#if swapOptions.length > threshold}
                        <SearchBar width={width} onInputChange={findMatch} onSelect={setSwappedStyleSearchbar} bind:isSearching={searchState.isSearching} bind:text={searchState.text} bind:results={searchState.results} bind:this={searchbar}/>
                    {:else}
                        <Dropdown width={width} options={swapOptions} onClick={setSwappedStyleDropdown}/>
                    {/if}
                </div>
            </div>
            {#if showWarning}
                <p class='small warn'>Please select a style to proceed!</p>
            {/if}
        {:else if mode=='delete'}
            <p>{@html bodyText}</p>
        {/if}
        {#if hasCheckbox}
            <div class="checkbox-cont">
                <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
                <span class="material-symbols-outlined icon" on:click={toggleCheck}>{ isChecked? 'check_box' : 'check_box_outline_blank'}</span>
                <p>{@html checkboxText}</p>
            </div>
        {/if}
        <div class="button-group">
            <Button label={okText} 
                onClick={okAction}/>
            <Button label={cancelText}
                type='secondary'
                onClick={close}/>
        </div>
    </div>
</div>
{/if}





<style>
    .blocker{
        background-color: var(--color-white-faint);

        position: fixed;
        z-index: 4;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        width: 100%;
        height: 100%;
    }

    .main{
        display: flex;
        flex-direction: column;
        align-items: start;
        justify-content: center;
        row-gap: var(--size-m);

        box-sizing: border-box;
        width: 248px;
        padding: var(--size-m);

        background-color: white;
        border: 1px solid var(--color-blue-4);
    }

    .button-group{
        display: flex;
        flex-direction: row;
        column-gap: var(--size-xs);
        width: 100%;
        justify-content: center;
    }

    p{
        width: 100%;
        text-align: left;
        hyphens: auto;
    }

    p.large{
        text-transform: capitalize;
    }

    .checkbox-cont{
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
    }

    .icon{
        font-size: var(--size-ml);
        color: var(--color-blue-4);
        cursor: default;
        user-select: none;
    }

    .horz{
        display: flex;
        flex-direction: row;
        align-items: start;
        column-gap: var(--size-ml);
    }

    .vert{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-xs);
    }

    .warn{
        color: var(--color-red-4);
    }
</style>