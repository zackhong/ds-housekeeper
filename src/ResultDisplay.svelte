<script>
    //displays results from plugin code
    import Result from './Result.svelte';
    import { onMount, onDestroy } from 'svelte';

    let display;
    let text=[];
    let colors=[];
    let comps=[];

    let isLoading = false;

    //toggles the overflow style porperty of the document body to disable scrollbars from appearing when loading screen is running
    function updateBodyScroll() {
        document.body.style.overflow = isLoading ? 'hidden' : '';
    }

    onMount(() => {
        updateBodyScroll();
    });

    onDestroy(() => {
        document.body.style.overflow = ''; // Reset when the component is destroyed
    });

    //finds style according to id and update its usage
    function updateStyle(message){
        let updatedStyle;
        switch(message.type){
            case "update-text":
            //finds the corresponding item inside text list, updates its totalCount and pages props, and remaps an enitrely new array
            updatedStyle = text.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages, pageCount: message.pageCount} : item);
            //use reassignment to trigger refresh on all Result components referencing this array
            text = updatedStyle;
            break;

            case "update-color":
            updatedStyle = colors.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages, pageCount: message.pageCount} : item);
            colors = updatedStyle;
            break;

            case "update-comp":
            updatedStyle = comps.map(item => item.id === message.id ? {...item, totalCount: message.totalCount, pages: message.pages, pageCount: message.pageCount} : item);
            comps = updatedStyle;
            break;
        }
    }

    export function handleMessage(message){
        switch(message.type){

            case "load-start":
            isLoading = true;
            break;

            case "load-end":
                // console.log('ruveal yourself');
            isLoading = false;
            break;

            case "display-text":
            text.push(...message.data);
            text=[...text];
            break;

            case "display-colors":
            colors.push(...message.data);
            colors=[...colors];
            break;

            case "display-comps":
            comps.push(...message.data);
            comps=[...comps];
            break;

            case "update-text": case "update-color": case "update-comp":
            updateStyle(message);
            break;
        }
    }
</script>



<table bind:this={display}>
    <tbody>
        {#each text as textEntry}
            <Result type='text' {...textEntry}/>
        {/each}
        {#each colors as colorEntry}
            <Result type='color' {...colorEntry}/>
        {/each}
        {#each comps as compEntry}
            <Result type='comp' {...compEntry}/>
        {/each}
    </tbody>
</table>





<style>

    table {
        background-color: white;
        width: 100%;
        height: auto;

        border-collapse: collapse;
        border-spacing: 0;
    }

</style>