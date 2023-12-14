<script>
    import { tooltip } from './stores.js';
    import { tick } from 'svelte';
    
    // Reactive subscription to the store
    $: ({ isVisible, text, targetRect } = $tooltip);

    let x=0, y=0, spacing=4;
    let tooltipEl;

    $: if ($tooltip.isVisible) {
    // Ensures DOM is updated before calculations
        tick().then(() => {
            const tooltipRect = tooltipEl.getBoundingClientRect();
            const rightSpace = window.innerWidth - targetRect.left;
            const bottomSpace = window.innerHeight - targetRect.bottom;
            
            // Positioning logic
            if (rightSpace < tooltipRect.width) { x = targetRect.right - tooltipRect.width; } 
            else { x = targetRect.left; }

            if (bottomSpace >= tooltipRect.height + spacing) {
                y = targetRect.bottom + spacing;
            } else {
                y = targetRect.top - tooltipRect.height - spacing;
            }
        });
    }

</script>



{#if isVisible}
    <div class="tooltip" style="left:{x}px; top:{y}px;" bind:this={tooltipEl}>
        <p class="small">{@html text}</p>
    </div>    
{/if}




<style>
    .tooltip{
        /* make sure tooltip renders on top of every other element */
        z-index: 100;
        width: 120px;
        /* tells tooltipEl.getBoundingClientRect() to include padding as well */
        box-sizing: border-box; 
        position: fixed;
        padding: var(--size-s);
        background-color: var(--color-gray-5);
    }

    .tooltip p{
        color: white;
    }
</style>