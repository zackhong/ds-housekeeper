<script>
    import Dropdown from "./Dropdown.svelte";
    import Search from "./SearchBar.svelte";
    import Button from "./Button.svelte";
    import { displayMode, selectedSearch, results } from './stores.js';
    import { onMount, onDestroy } from 'svelte';

    let dropdown;
    let options = [{id:'text', value:'Text'}, 
                    {id:'color',value:'Colors'}, 
                    {id:'comp', value:'Components'}];
    let searchbar;
    let searchState = {isSearching:false,
                        text:'',
                        results:[]};

    onMount(() => {
        document.addEventListener('customEvent', handleCustomEvent);
    });

    onDestroy(() => {
        document.removeEventListener('customEvent', handleCustomEvent);
    });

    //handles custom events from other UI components
    function handleCustomEvent(event) {
        switch(event.detail.action){

			case 'set-dropdown-to-custom':
			dropdown.setSelection(event.detail.value);
			break;
		}
	}





    //-----------STYLE DROPDOWN
    //updates selection based on which option we clicked; telling style display to update accordingly as well
    function updateSelection(option){
        //if we selected a new option, update dropdown & display
        if($displayMode != option.id){ displayMode.set(option.id); }
    }





    //-----------STYLE SEARCHBAR
    //tells display to return all matches based on this input string
    function findMatch(value) {

        //compare both input string and style name in lowercase so that the search is case insensitive
        value = value.toLowerCase();
        let outResults=[];

        for(const textEntry of $results.text){
            if(textEntry.name.toLowerCase().includes(value)){
                outResults.push({id:textEntry.id, type:'text', name:textEntry.name});
            }
        }

        for(const colorEntry of $results.colors){
            if(colorEntry.name.toLowerCase().includes(value)){
                outResults.push({id:colorEntry.id, type:'color', name:colorEntry.name});
            }
        }

        for(const compEntry of $results.comps){
            if(compEntry.name.toLowerCase().includes(value)){
                outResults.push({id:compEntry.id, type:'comp', name:compEntry.name});
            }
        }

        searchState.isSearching = true;
        searchState.results = outResults;
    }

    //sets viewing mode and selected search details when clicking on search result
    function selectResult(id, type, name){

        displayMode.set('custom');
        selectedSearch.set({id, type});
        searchState.isSearching = false;
        searchState.text = name;

        const customEvent = new CustomEvent('customEvent', {
            detail: { action: 'set-dropdown-to-custom', value:'Custom'},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }






    //-----------------SEARCH REMOTE STYLES
    function loadRemoteStyles(){

        const customEvent = new CustomEvent('customEvent', {
            detail: { action: 'load-remote-text-start'},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }







    //-----------------RESET UI
</script>




<div class="main">
    <div class='row'>
        <Dropdown width=108 options={options} onClick={updateSelection} bind:this={dropdown}/>
        <Search onInputChange={findMatch} onSelect={selectResult} bind:this={searchbar} bind:isSearching={searchState.isSearching} bind:text={searchState.text} bind:results={searchState.results}/>
    </div>
    <div class='row'>
        <Button 
            label='Search Remote'
            size='large'
            hasTooltip=true
            tooltipText='Search file for imported styles.<br><br>Warning: slow for large files!'
            onClick={loadRemoteStyles}
        />
        <Button 
            label='Reset UI'
            hasIcon=true
            iconName='restart_alt'
            type='secondary'
            size='large'
            hasTooltip=true
            tooltipText="Resets UI to only display local styles.<br><br>Use this if you\'ve modified your file outside this plugin."
        />
    </div>
    
</div>





<style>
    .main{
		position: sticky;
		top: 0px;
		z-index: 3;

		display: flex;
        flex-direction: column;
        row-gap: var(--size-xs);
        padding: var(--size-s);

		background-color: white;
		box-shadow: var(--shadow);
	}

    .row{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
</style>