<script>
    import { onMount, onDestroy } from 'svelte';
    import { slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { resultMode } from './stores.js';

    export let width=100;
    let height=24;
    let options = ['Text', 'Colors', 'Components'];

    let isExpanded = false;
    let dropdown;

    onMount(() => {
        window.addEventListener('click', handleClickOutside);
    });

    onDestroy(() => {
        window.removeEventListener('click', handleClickOutside);
    });

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

    //updates selection based on which option we clicked; telling style display to update accordingly as well
    function updateSelection(option){
        //if we selected a new option, update dropdown & display
        if($resultMode != option){ resultMode.set(option); }
        isExpanded = false;
    }
</script>




<div class="main" bind:this={dropdown}>
    <button class="header" style="width:{width}px; height:{height}px;" on:click={toggle}>
        <p>{$resultMode}</p>
        <span class="material-symbols-outlined icon">{isExpanded? 'expand_less' : 'expand_more'}</span>
    </button>
    {#if isExpanded}
        <div class="body" style="width:{width}px;" transition:slide={{duration:200, easing:cubicOut}}>
            {#each options as option}
                <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
                <div class="option" on:click={()=>updateSelection(option)}><p>{option}</p></div>
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
        cursor: default;
    }

    .option:hover{
        background-color: var(--color-blue-1);
    }
</style>