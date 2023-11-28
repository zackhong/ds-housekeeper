<script>
    //displays results from plugin code
    import Result from './Result.svelte';
    let display;
    let text=[];

    export function handleMessage(message){
        switch(message.type){
            case "display-text":
            text.push(...message.data);
            text=[...text];
            // console.log(text);
            break;
        }
    }
</script>



<table bind:this={display}>
    <tbody>
        {#each text as textEntry, index}
            <Result {...textEntry}/>
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