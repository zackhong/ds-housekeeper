<script>
    export let label;
    export let size="medium";//"small", "medium"
    export let type="primary";//"primary", "secondary", "warning"
    export let hasTooltip = false;
    export let tooltipText="";
    export let input={};
    export let action="";

    //position tooltip to appear close to the button when hovering over it
    function handleMouseEnter(event){
        
        const rect = event.target.getBoundingClientRect();
        //dispatch message all the way to ancestor UI component using native event dispatcher
        //since Svelte's event dispatcher only goes up to immediate parent
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: "tooltip-show", text: tooltipText, rect: rect, target: event.target},
            bubbles: true // This allows the event to bubble up the DOM tree
        });
        // Dispatch the event on a DOM element
        document.dispatchEvent(customEvent);
    }

    //tells tooltip to hide when cursor moves out of button
    function handleMouseLeave(event){
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: "tooltip-hide", target: event.target},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    //tells plugi to process this action based on type and input
    function handleClick(){
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: action, input: input},
            bubbles: true
        });
        // console.log(action, input);
        document.dispatchEvent(customEvent);
    }
</script>




{#if hasTooltip}
    <button class={`${type} ${size}`} on:click={handleClick} on:mouseenter={handleMouseEnter} on:mouseleave={handleMouseLeave}>
        <p class="small">{label}</p>
    </button>
{:else}
    <button class={`${type} ${size}`} on:click={handleClick}>
        <p class="small">{label}</p>
    </button>
{/if}




<style>
    button{
        border: 0px;
        padding: var(--size-xs) var(--size-s);
        border-radius: var(--size-xs);
        outline-offset: -1px;
        display: flex;
        flex-direction: row;
        justify-content: center;
    }

    button p{
        color: white;
    }

    .primary{
        background-color: var(--color-link);
    }

    .primary:hover{
        background-color: var(--color-hover);
    }

    .warning{
        outline:1px solid var(--color-warn);
        background-color: white;
    }

    .warning:hover{
        outline:1px solid var(--color-warn-hover);
        background-color: rgb(254, 230, 230);
    }

    .warning p{
        color: var(--color-warn);
    }

    .warning p:hover{
        color: var(--color-warn-hover);
    }

    .small{
        width: 40px;
    }

    .medium{
        width: 60px;
    }
</style>