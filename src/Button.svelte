<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,100,0,0" />
<script>
    import {tooltip} from './stores.js';

    export let label, size='medium', type="primary";//"primary", "secondary", "warning"
    export let hasIcon=false, iconName;
    export let hasTooltip = false, tooltipText="";
    export let onClick = () => {}; // click handler for other components to attach to

    //position tooltip to appear close to the button when hovering over it
    function handleMouseEnter(event){
        
        const rect = event.target.getBoundingClientRect();
        tooltip.set({isVisible:true, text:tooltipText, targetRect:rect});
    }

    //tells tooltip to hide when cursor moves out of button
    function handleMouseLeave(){

        tooltip.set({isVisible:false});
    }
</script>





<button class="{type}"
    on:click={onClick} 
    on:mouseenter={ hasTooltip? handleMouseEnter : null} 
    on:mouseleave={ hasTooltip? handleMouseLeave : null}>
    <p class={(size == 'large')? 'medium': 'small'}>{label}</p>
    {#if hasIcon}
        <span class="material-symbols-outlined {(size == 'large')? 'large' : '' }">{iconName}</span>
    {/if}
</button>




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

    span.large{ 
        font-size: 20px;
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