<script>
    import { tick, onMount, onDestroy } from 'svelte';

    let isVisible = false;
    let x = 0;
    let y = 0;
    let options;

    let input={};

    // Wrap event listeners in component mount and destruction;
	//this is to prevent memory leaks when this component is removed
    onMount(() => { 
        document.addEventListener('customEvent', handleCustomEvent); 
        window.addEventListener('click', handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener('customEvent', handleCustomEvent);
        window.removeEventListener('click', handleClickOutside);
    });

    // Closes options if we click anywhere outside it
    function handleClickOutside(event) {
        if (isVisible && !options.contains(event.target)) {
            isVisible = false;
        }
    }

    function handleView(){
        isVisible = false;
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: 'view-selection', input: input},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

	function handleCustomEvent(event) {
        switch(event.detail.type){
            case "options-show":

            // then reveal options if it was previously hidden
            if(!isVisible) { isVisible = true; }
            
            //we need to encapsulate this process using tick() to make sure that the binding to options is alr loaded
            tick().then(()=>{
                const targetX = event.detail.x;
                const targetY = event.detail.y;
                const bottomSpace = window.innerHeight - targetY;
                const rightSpace = window.innerWidth - targetX;

                // by default, options will appear to bottom right of cursor
                // but will appear above or to the right if its too close to the walls of the UI
                if(rightSpace >= options.offsetWidth){ x = targetX; }
                else{ x = targetX - options.offsetWidth; }
                
                if(bottomSpace >= options.offsetHeight){ y = targetY; }
                else{ y = targetY - options.offsetHeight; }

                input = event.detail.input;
            });
            break;

            case "options-hide":
            //only hide options if it's currently visible
            if(isVisible){ isVisible = false; }
            break;
        }
    }

</script>



{#if isVisible}
    <div class="options" style="left:{x}px; top:{y}px;" bind:this={options}>
        <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
        <div on:click={handleView}><p class="small">View</p></div>
        <div><p class="small">Swap</p></div>
        <div class="warning"><p class="small">Delete</p></div>
    </div>    
{/if}




<style>
    .options{
        /* make sure options renders on top of every other element */
        z-index: 100;
        width: var(--size-xl);
        position: fixed;
        background-color: white;
        box-sizing: border-box;
        box-shadow: var(--shadow);
        /* 0px 0px 2px var(--color-gray-3); */
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