<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,100..700,0..1,-50..200" />

<script>
    import { onMount, onDestroy } from 'svelte';
    import { slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import SearchResult from './SearchResult.svelte';

    let placeholder='Search...';
    let text;//ref to typed text inside searchbar; doesn't affect placeholder

    export let width=180;
    let height=24;
    let maxChars=20;

    let typingTimer;
    let typingChars=2;//min # of chars that user needs to type to trigger search
    let typingDelay=300;//delay in ms; used for calling autocomplete when user has stopped typing

    let isSearching = false;
    let search;
    let results;

    onMount(() => {
        document.addEventListener('customEvent', handleCustomEvent);
        window.addEventListener('click', handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener('customEvent', handleCustomEvent);
        window.removeEventListener('click', handleClickOutside);
    });

    // Hides searchbar results & cancels search if we click anywhere outside it
    function handleClickOutside(event) {
        if (isSearching && !search.contains(event.target)) {
            text='';
            isSearching = false;
        }
    }

    function handleInput(event) {
        clearTimeout(typingTimer); // Clear the previous timer
        if (event.target.value && event.target.value.length >= typingChars) {
            typingTimer = setTimeout(()=>{findMatch(event.target.value)}, typingDelay);
        }
    }

    function findMatch(value) {
        //send string to ResultDisplay asking it to return 1st 5 matches from its list of styles found
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: 'search', input: value},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
        isSearching = true;
    }

    //handles custom events from other UI components
    function handleCustomEvent(event) {
        switch(event.detail.type){

			case 'found':
			results = event.detail.input;
			break;

            //hide search results when one of them is clicked
            case 'search-selection':
			isSearching = false;
            //clears typed text
            text = '';
			break;
		}
	}

</script>




<div class="main" bind:this={search}>
    <div class="header" style="width:{width}px; height:{height}px;" >
        <input type="text" placeholder={placeholder} bind:value={text} maxlength={maxChars} on:input={handleInput}/>
        <!-- <p contenteditable="true" on:input={handleInput}>{text}</p> -->
        <span class="material-symbols-outlined icon">search</span>
    </div>
    {#if isSearching}
        <div class="body" style="width:{width}px;" transition:slide={{duration:200, easing:cubicOut}}>
            {#each results as result}
                <SearchResult {...result}/>
            {/each}
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

</style>