<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,100..700,0..1,-50..200" />

<script>
    import { onMount, onDestroy } from 'svelte';
    import { slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import SearchResult from './SearchResult.svelte';
    import { search } from './stores';

    let placeholder='Search...';

    export let width=180;
    let height=24;
    let maxChars=20;

    let typingTimer;
    let typingChars=2;//min # of chars that user needs to type to trigger search
    let typingDelay=300;//delay in ms; used for calling autocomplete when user has stopped typing

    let self;
    let results;

    onMount(() => {
        document.addEventListener('customEvent', handleCustomEvent);
        window.addEventListener('click', handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener('customEvent', handleCustomEvent);
        window.removeEventListener('click', handleClickOutside);
    });

    //handles custom events from other UI components
    function handleCustomEvent(event) {
        switch(event.detail.action){

			case 'found':
			results = event.detail.names;
			break;
		}
	}





    // Hides searchbar results & cancels search if we click anywhere outside it
    function handleClickOutside(event) {
        if ($search.isSearching && !self.contains(event.target)) {
            search.set({isSearching:false, text:''});
        }
    }

    // starts timer to trigger findMatch() after a set delay
    function handleInput(event) {
        //clears the previous trigger if user is typing continously
        clearTimeout(typingTimer);
        //only triggers findMatch() if user is typing, and typed letters reach a certain length of chars
        if (event.target.value && event.target.value.length >= typingChars) {
            typingTimer = setTimeout(()=>{findMatch(event.target.value)}, typingDelay);
        }
    }

    //tells display to return all matches based on this input string
    function findMatch(value) {
        
        const customEvent = new CustomEvent('customEvent', {
            detail: { action: 'search', value: value},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
        search.update(current => {
            return {...current, isSearching:true};
        });
    }

</script>




<div class="main" bind:this={self}>
    <div class="header" style="width:{width}px; height:{height}px;" >
        <input type="text" placeholder={placeholder} bind:value={$search.text} maxlength={maxChars} on:input={handleInput}/>
        <span class="material-symbols-outlined icon">search</span>
    </div>
    {#if $search.isSearching}
        <div class="body" style="width:{width}px;" transition:slide={{duration:200, easing:cubicOut}}>
            {#if results.length > 0}
                {#each results as result}
                    <SearchResult {...result}/>
                {/each}
            {:else}
                <div><p class="no-results">No results found.</p></div>
            {/if}
        </div>
    {/if}
</div>





<style>
    .main{
        display: flex;
        flex-direction: column;
        align-items: start;
    }

    .header{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        /* make sure width includes padding as well */
        box-sizing: border-box;
        padding: 0px var(--size-xs);

        background-color: white;
        border: 1px solid var(--color-blue-4);
    }

    input{
        width: 100%;
    }

    input {
        border: none; /* Removes the default border */
        outline: none; /* Removes the focus outline */
    }

    input:hover, input:focus {
        border: none; /* Removes the border on hover and focus */
        outline: none; /* Removes the outline on hover and focus */
    }

    .icon{
        font-size: 20px;
        color: var(--color-blue-4);
        cursor: default;
    }

    .body{
        position: absolute;
        top: 34px;

        display: flex;
        flex-direction: column;
        align-items: start;

        background-color: white;
        max-height: 120px;

        overflow: scroll;

        box-shadow: var(--shadow);
    }

    .no-results{ 
        color: var(--color-gray-3); 
        padding: var(--size-xs);
    }

</style>