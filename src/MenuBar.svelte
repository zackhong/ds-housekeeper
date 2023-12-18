<script>
    import Dropdown from "./Dropdown.svelte";
    import Search from "./SearchBar.svelte";
    import { displayMode, selectedSearch, search, results } from './stores.js';
    import { onMount, onDestroy } from 'svelte';

    let dropdown;
    let options = ['Text', 'Colors', 'Components'];
    let searchbar;

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





    //updates selection based on which option we clicked; telling style display to update accordingly as well
    function updateSelection(option){
        //if we selected a new option, update dropdown & display
        if($displayMode != option){ displayMode.set(option); }
    }

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

        search.update(current => {
            return {...current, isSearching:true, results:outResults};
        });
    }

    //sets viewing mode and selected search details when clicking on search result
    function selectResult(id, type, name){
        displayMode.set('Custom');
        selectedSearch.set({id, type});
        search.set({isSearching:false, text:name});

        const customEvent = new CustomEvent('customEvent', {
            detail: { action: 'set-dropdown-to-custom', value:'Custom'},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }
</script>




<div class="main">
    <Dropdown width=108 options={options} onClick={updateSelection} bind:this={dropdown}/>
    <Search onInputChange={findMatch} onSelect={selectResult} bind:this={searchbar}/>
</div>





<style>
    .main{
		position: sticky;
		top: 0px;
		z-index: 3;

		display: flex;
        flex-direction: row;
        justify-content: space-between;
        row-gap: var(--size-xs);
        padding: var(--size-s);

		background-color: white;
		box-shadow: var(--shadow);
	}
</style>