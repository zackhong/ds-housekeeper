<script>
    import { options } from './stores';
    import { tick, onMount, onDestroy } from 'svelte';

    $: ({ isVisible, canSwap, targetX, targetY, 
            type, styleID, styleName,
            pageID, pageName, nodeIDs } = $options);
    let optionsEl, x=0, y=0;

    // Wrap event listeners in component mount and destruction;
	//this is to prevent memory leaks when this component is removed
    onMount(() => { 
        window.addEventListener('click', handleClickOutside);
    });

    onDestroy(() => {
        window.removeEventListener('click', handleClickOutside);
    });

    //updates options menu position when set to visible
    $: if($options.isVisible){

        //we need to encapsulate this process using tick() to make sure that the binding to options is alr loaded
        tick().then(()=>{
            const bottomSpace = window.innerHeight - targetY;
            const rightSpace = window.innerWidth - targetX;
            const myRect = optionsEl.getBoundingClientRect();

            // by default, options will appear to bottom right of cursor
            // but will appear above or to the right if its too close to the walls of the UI
            if(rightSpace < myRect.width){ x = targetX - myRect.width;}
            else{ x = targetX; }
            
            if(bottomSpace < myRect.height){ y = targetY - myRect.height; }
            else{ y = targetY; }
        });
    }




    // Closes options if we click anywhere outside it
    function handleClickOutside(event) {
        if (isVisible && !optionsEl.contains(event.target)) {
            options.set({isVisible:false});
        }
    }

    function handleView(){
        options.set({isVisible:false});
        //tells plugin to select and zoom in on list of nodes in specified page;
        //needs needs pageID, pageName, styleID, styleName and nodeIDs from pageInfo
        const customEvent = new CustomEvent('customEvent', {
            detail: { action:'select-start', id:pageID, name:pageName, nodeIDs},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    function deleteFromPage(){
        options.set({isVisible:false});

        const customEvent = new CustomEvent('customEvent', {
            detail: { action:'popup-delete-from-page', 
                        type, styleID, styleName,
                        pageID, pageName, nodeIDs},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    function swapAtPage(){
        options.set({isVisible:false});
        
        const customEvent = new CustomEvent('customEvent', {
            detail: { action:'popup-swap-from-page', 
                        type, styleID, styleName,
                        pageID, pageName, nodeIDs},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

</script>




{#if isVisible}
    <div class="options" style="left:{x}px; top:{y}px;" bind:this={optionsEl}>
        <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
        <div on:click={handleView}><p class="small">View</p></div>
        {#if canSwap}
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
            <div on:click={swapAtPage}><p class="small">Swap</p></div>
        {/if}
        <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
        <div class="warning" on:click={deleteFromPage}><p class="small">Delete</p></div>
    </div>    
{/if}




<style>
    .options{
        /* make sure options renders on top of every other element */
        z-index: 100;
        width: var(--size-xl);
        box-sizing: border-box;
        position: fixed;
        background-color: white;
        box-sizing: border-box;
        box-shadow: var(--shadow);
    }

    .options div{
        display: flex;
        flex-direction: row;
        width: 100%;
        box-sizing: border-box;
        padding: var(--size-xs) var(--size-s);
    }

    .options div:hover{
        background-color: var(--color-blue-1);
    }

    .options div p{
        color: var(--color-blue-4);
        cursor: default;
    }

    .options .warning p{
        color: var(--color-red-4);
    }

    .options .warning:hover{
        background-color: var(--color-red-1);
    }
</style>