<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
<script>
    export let subtype='SOLID';//'SOLID', 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND', 'IMAGE', 'VIDEO'
    export let hex;
    export let opacity;

    let swatchFill;
    let swatchOpacity;
</script>



<div class="cont">
    {#if subtype == 'SOLID'}
        <div class="swatch">
            <span class="material-symbols-outlined icon icon-swatch">gradient</span>
            <div class="swatch-overlay">
                <div class="swatch-fill" style="background-color:{hex};" bind:this={swatchFill}></div>
                <div class="swatch-opacity" style="background-color:{hex}; opacity:{opacity};" bind:this={swatchOpacity}></div>
            </div>
        </div>
        <p class="small">{hex} {opacity}</p>
    {:else if subtype == 'GRADIENT_LINEAR' || subtype == 'GRADIENT_RADIAL' || subtype == 'GRADIENT_ANGULAR' || subtype == 'GRADIENT_DIAMOND'}
        <span class="material-symbols-outlined icon icon-others">colors</span>
        <p class="small">Gradient</p>
    {:else if subtype == 'IMAGE'}
        <span class="material-symbols-outlined icon icon-others">image</span>
        <p class="small">Image</p>
    {:else if subtype == 'VIDEO'}
        <span class="material-symbols-outlined icon icon-others">subscriptions</span>
        <p class="small">Video</p>
    {/if}
</div>





<style>
    .cont{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-s);
        width: 80px;
    }

    .swatch{
        position: relative;
        width: 20px;
        aspect-ratio: 1;
        border-radius: 2px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0px 0px 2px var(--color-gray-3);
    }

    .icon{
        font-size: 32px;
    }

    .icon-swatch{
        position: absolute;
        color: var(--color-gray-1);
        transform: rotate(-90deg);
        z-index: 1;
    }

    .icon-others{
        color: var(--color-gray-3);
        margin: -4px;
    }

    .swatch-overlay{
        position: absolute;
        display: flex;
        flex-direction: row;
        width: 20px;
        aspect-ratio: 1;
    }

    .swatch-fill{
        width: 50%;
        height: 100%;
        border-radius: 2px 0px 0px 2px;
        z-index: 2;
    }

    .swatch-opacity{
        width: 50%;
        height: 100%;
        border-radius: 0px 2px 2px 0px;
        z-index: 2;
    }
</style>