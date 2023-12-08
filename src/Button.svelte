<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,100,0,0" />
<script>
    export let label;
    export let type="primary";//"primary", "secondary", "warning"

    export let hasIcon=false;
    export let iconName;

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
            detail: { type: "tooltip-show", text: tooltipText, rect: rect},
            bubbles: true // This allows the event to bubble up the DOM tree
        });
        // Dispatch the event on a DOM element
        document.dispatchEvent(customEvent);
    }

    //tells tooltip to hide when cursor moves out of button
    function handleMouseLeave(event){
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: "tooltip-hide"},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    //tells plugin to process this action based on type and input
    function handleClick(){
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: action, input: input},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }
</script>




{#if hasTooltip}
    <button class={type} on:click={handleClick} on:mouseenter={handleMouseEnter} on:mouseleave={handleMouseLeave}>
        <p class="small">{label}</p>
        {#if hasIcon}
            <span class="material-symbols-outlined">{iconName}</span>
        {/if}
    </button>
{:else}
    <button class={type} on:click={handleClick}>
        <p class="small">{label}</p>
        {#if hasIcon}
            <span class="material-symbols-outlined">{iconName}</span>
        {/if}
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
        align-items: center;
        justify-content: center;
        column-gap: var(--size-xs);
    }

    button p{ color: white; }
    span{ 
        color: white;
        font-size: 14px;
    }

    .primary{ background-color: var(--color-blue-4); }
    .primary:hover{ background-color: var(--color-blue-5); }

    .secondary{
        outline:1px solid var(--color-blue-4);
        background-color: white;
    }
    .secondary p{ color: var(--color-blue-4); }
    .secondary span{ color: var(--color-blue-4); }
    .secondary:hover{ background-color: var(--color-blue-1); }

    .warning{
        outline:1px solid var(--color-red-4);
        background-color: white;
    }
    .warning p{ color: var(--color-red-4); }
    .warning span{ color: var(--color-red-4); }
    .warning:hover{
        outline:1px solid var(--color-red-5);
        background-color: var(--color-red-1);
    }
    .warning:hover p{ color: var(--color-red-5); }
    .warning:hover span{ color: var(--color-red-5); }

</style>