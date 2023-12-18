<script>
    import { onMount, onDestroy } from 'svelte';
    import { slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    

    export let width=100;
    let height=24;
    export let options = ['lorem ipsum'];

    let isExpanded = false;
    let selected;
    $: selected = options[0];

    //ref to self; used for checking if we clicked outside it
    let dropdown;

    export let onClick = () => {}; // click handler; takes in function from other components

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

    function updateSelection(option){
        selected = option;
        isExpanded = false;
        onClick(option);
    }

    export function setSelection(value){
        selected = value;
    }

</script>




<div class="main" bind:this={dropdown}>
    <button class="header" style="width:{width}px; height:{height}px;" on:click={toggle}>
        <p class='ellipsis'>{selected}</p>
        <span class="material-symbols-outlined icon">{isExpanded? 'expand_less' : 'expand_more'}</span>
    </button>
    {#if isExpanded}
        <div class="body" style="width:{width}px;" transition:slide={{duration:200, easing:cubicOut}}>
            {#each options as option}
                <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
                <div class="option ellipsis" on:click={ ()=> {updateSelection(option)} }><p>{option}</p></div>
            {/each}
        </div>
    {/if}
</div>





<style>
    .main{
        display: flex;
        flex-direction: column;
        align-items: start;
        position: relative;
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
        top: 24px;
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

    .ellipsis{
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .option:hover{
        background-color: var(--color-blue-1);
    }
</style>