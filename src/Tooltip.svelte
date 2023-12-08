<script>
    import { tick } from 'svelte';
    import { onMount, onDestroy } from 'svelte';
    export let helpText="this is some helpful text";
    let isVisible = false;
    let x = 0;
    let y = 0;
    let spacing = 4;
    let tooltip;

    // Wrap event listeners in component mount and destruction;
	//this is to prevent memory leaks when this component is removed
    onMount(() => { document.addEventListener('customEvent', handleCustomEvent);});
    onDestroy(() => {document.removeEventListener('customEvent', handleCustomEvent);});

	function handleCustomEvent(event) {
        switch(event.detail.type){
            case "tooltip-show":
            //only show tooltip if it's currently hidden
            if(!isVisible){
                tick().then(() => {
                    const targetRect = event.detail.rect;
                    const tooltipRect = tooltip.getBoundingClientRect();
                    const bottomSpace = window.innerHeight - targetRect.bottom;
                    const rightSpace = window.innerWidth - targetRect.right;

                    // left-align tooltip with button if there's enough space at right of ui
                    // otherwise, right-align tooltip with button
                    if(rightSpace >= tooltipRect.width + spacing){
                        x = targetRect.left;
                    }
                    else{
                        x = targetRect.right - tooltipRect.width;
                    }
                    
                    // render tooltip below button if there's enough space at bottom of ui
                    // otherwise, render tooltip above button
                    if(bottomSpace >= tooltipRect.height + spacing){
                        y = targetRect.bottom + spacing;
                    }
                    else{
                        y = targetRect.top - tooltipRect.height - spacing;
                    }
                    
                    helpText = event.detail.text;
                });
                // then reveal tooltip
                isVisible = true;
            }
            break;

            case "tooltip-hide":
            //only hide tooltip if it's currently visible
            if(isVisible){
                isVisible = false;
            }
            break;
        }
        // console.log('Event received:', event.detail);
    }

</script>



{#if isVisible}
    <div class="tooltip" style="left:{x}px; top:{y}px;" bind:this={tooltip}><p class="small">{@html helpText}</p></div>    
{/if}




<style>
    .tooltip{
        /* make sure tooltip renders on top of every other element */
        z-index: 100;
        width: 100px;
        position: fixed;
        padding: var(--size-s);
        background-color: var(--color-gray-5);
    }

    .tooltip p{
        color: white;
    }
</style>