<script>
    export let content="some helpful text i wrote. let's see how it formats";
    let active = false;
    let x = 0;
    let y = 0;

    export function handleMessage(message){

        switch(message.type){
            case "tooltip-show":
            // reposition tooltip to position of cursor
            x = message.x;
            y = message.y;
            // then reveal tooltip
            active = true;
            break;

            case "tooltip-hide":
            active = false;
            break;
        }
    }
</script>



{#if active}
    <div class="tooltip" style="left:{x}px; top:{y}px;"><p class="small">{content}</p></div>    
{/if}




<style>
    .tooltip{
        /* make sure tooltip renders on top of every other element */
        z-index: 100;
        position: fixed;
        width: 100px;
        padding: var(--size-s);
        background-color: var(--color-text);
    }

    .tooltip p{
        color: white;
    }
</style>