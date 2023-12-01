<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,200,0,0" />

<script>
    //loading screen for ui; gets called on page load, and whenever you're performing the expensive track usage actions
    let loading;//ref to loading container divs

    let mainText="Loading...";
    let warnSuffix="this could take some time!";
    let warnText="Warning: might be slow for large files!";

    function updateText(newText){
        mainText = newText;
    }

    function updateWarning(newText){
        warnText = newText+"<br>"+warnSuffix;
    }

    export function show(text='Loading...'){
        mainText = text;
        warnText="Warning: might be slow for large files!";
        loading.style.display = "flex";
    }

    function hide(){loading.style.display = "none";}

    export function handleMessage(message){
        switch(message.type){

            case "load-start":
            show(message.text);
            break;
            
            case "load-update":
            updateText(message.text);
            break;

            case "load-warning":
            updateWarning(message.text);
            break;

            case "load-end":
            updateText("Loading done!");
            hide();
            break;
        }
    }
</script>


<div class="cont" bind:this={loading}>
    <div><span class="material-symbols-outlined loading">autorenew</span></div>
    <p>{mainText}</p>
    <p class="warning">{@html warnText}</p>
</div>


<style>

    .cont{
        background-color: var(--color-main-bg);
        position: fixed;
        z-index: 3;
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
        color: var(--color-text);
        animation-name: spin;
        animation: spin 3s linear infinite;
    }

    .warning{
        font-size: var(--font-s);
        color: var(--color-warn);
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