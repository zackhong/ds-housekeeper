<script>
    import { onMount, onDestroy } from 'svelte';
    import { slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

    export let width=100;
    let height=24;
    export let values = ['A', 'B', 'C'];
    let selected = values[0];

    let isExpanded = false;
    let dropdown;

    onMount(() => {
        window.addEventListener('click', handleClickOutside);
        document.addEventListener('customEvent', handleCustomEvent);
    });

    onDestroy(() => {
        window.removeEventListener('click', handleClickOutside);
        document.removeEventListener('customEvent', handleCustomEvent);
    });

    function handleCustomEvent(event) {
        switch(event.detail.type){
            case "search-selection":
            //change selected value to 'custom' when we click on a search result
            selected = 'Custom';
            break;
        }
    }

    // Hides searchbar results & cancels search if we click anywhere outside it
    function handleClickOutside(event) {
        if (isExpanded && !dropdown.contains(event.target)) {
            isExpanded = false;
        }
    }

    //toggles whether we see the dropdown options or not
    function toggle(){
        isExpanded = !isExpanded;
    }

    //updates selection based on which option we clicked
    function updateSelection(value){
        //if we selected a new option, update dropdown & display
        if(value != selected){
            selected = value;
            const customEvent = new CustomEvent('customEvent', {
                detail: { type: 'display-option', input: value},
                bubbles: true
            });
            document.dispatchEvent(customEvent);
        }
        isExpanded = false;
    }
</script>




<div class="main" bind:this={dropdown}>
    <button class="header" style="width:{width}px; height:{height}px;" on:click={toggle}>
        <p>{selected}</p>
        <span class="material-symbols-outlined icon">{isExpanded? 'expand_less' : 'expand_more'}</span>
    </button>
    {#if isExpanded}
        <div class="body" style="width:{width}px;" transition:slide={{duration:200, easing:cubicOut}}>
            {#each values as value}
                <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
                <div class="option" on:click={()=>updateSelection(value)}><p>{value}</p></div>
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

        padding: 0px var(--size-xs);
        background-color: white;
        border: 1px solid var(--color-blue-4);
    }

    .header p{
        color: var(--color-blue-4);
    }

    .icon{
        font-size: var(--size-ml);
        color: var(--color-blue-4);
        cursor: default;
    }

    .header:hover{
        background-color: var(--color-blue-1);
    }

    .body{
        position: absolute;
        top: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: var(--shadow);
    }

    .option{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: start;

        padding: var(--size-xs) 0px;
        width: 100%;
        background-color: white;
    }

    .option p{
        margin-left: var(--size-s);
        color: var(--color-blue-4);
    }

    .option:hover{
        background-color: var(--color-blue-1);
    }
</style>