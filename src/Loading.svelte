<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,200,0,0" />

<script>
    //loading screen for ui; gets called on page load, and whenever you're performing the expensive track usage actions
    let loading;//ref to loading container divs
    let warning;

    let mainText="Loading...";
    let warnVisible = false;
    let warnSuffix="this could take some time!";
    let warnText="Warning!";

    function UpdateText(newText){
        mainText = newText;
        //hide warning if it was previously on display
        if(warnVisible){warnVisible = false;}
    }

    function UpdateWarning(newText){
        //make warning visible if it was previously hidden
        if(!warnVisible){warnVisible = true;}
        warnText = newText+"<br>"+warnSuffix;
    }

    function Hide(){loading.style.display = "none";}

    export function handleMessage(message){
        switch(message.type){

            case "load-update":
            UpdateText(message.text);
            break;

            case "load-warning":
            UpdateWarning(message.text);
            break;

            case "load-end":
            UpdateText("Loading done!");
            Hide();
            break;
        }
    }
</script>


<div class="cont" bind:this={loading}>
    <div><span class="material-symbols-outlined loading">autorenew</span></div>
    <p>{mainText}</p>
    <p class="warning" class:visible={warnVisible} bind:this={warning}>{@html warnText}</p>
</div>


<style>

    .cont{
        background-color: var(--color-main-bg);
        /* position: fixed; */
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
        opacity: 0;/* Initial state hidden */
    }
    .warning.visible{
        opacity: 1; /* Visible state */
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