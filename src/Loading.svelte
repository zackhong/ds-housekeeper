<script>
    //loading screen for ui; gets called on page load, and whenever you're performing the expensive track usage actions
    import { onMount } from 'svelte';

    let loading;//ref to loading container divs
    let isLoading=true;
    let isFontLoaded=false;

    let mainText="Loading...";
    let progressText="";

    onMount(() => {
        //forces loading screen to load icon font first before displaying
        const font = new FontFace('Material Symbols Outlined', 
            'url(https://fonts.gstatic.com/s/materialsymbolsoutlined/v153/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1n-q_4MrImHCIJIZrDAvHOelbd5zrDAt.woff)', 
            {
                style:"normal",
                weight:"200"
            });

        font.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
            isFontLoaded = true; // Trigger the icon to display
        })
        .catch(error => {
            console.error('Failed to load the font', error);
        });
    });

    function updateText(newText){
        mainText = newText;
    }

    //updates progress from plugin, then sends same message back to plugin to see if they stull have it
    function updateProgress(message){

        progressText = message.text;
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: message.type},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    export function show(text='Loading...'){
        mainText = text;
        progressText='';
        isLoading = true;
    }

    export function hide(){
        progressText = '';
        isLoading = false;
    }

    export function handleMessage(message){
        switch(message.type){

            case "load-start":
            show(message.text);
            break;
            
            case "load-update":
            updateText(message.text);
            break;

            case "process-remote-text": case "process-remote-color":
            updateProgress(message);
            break;

            case "load-end":
            updateText("Loading done!");
            hide();
            break;
        }
    }
</script>

{#if isLoading}
<div class="cont" bind:this={loading}>
    {#if isFontLoaded}
        <div><span class="material-symbols-outlined loading">autorenew</span></div>
    {/if}
    <p>{mainText}</p>
    {#if progressText}
        <p class="progress">{progressText}</p>
    {/if}
</div>
{/if}


<style>
    .material-symbols-outlined {
        font-family: 'Material Symbols Outlined';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
    }

    .cont{
        background-color: white;
        position: fixed;
        z-index: 4;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        row-gap: var(--size-m);
    }

        /* loading anims */
    .loading {
        font-size: var(--size-xl);
        color: var(--color-gray-5);
        animation-name: spin;
        animation: spin 3s linear infinite;
    }

    .progress{
        font-size: var(--font-s);
        color: var(--color-blue-4);
        text-align: center;
    }

    @keyframes spin {
        from {
            transform:rotate(0deg);
        }
        to {
            transform:rotate(360deg);
        }
    }
</style>