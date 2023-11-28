<script>
    export let label;

    function handleMouseOver(){
        //dispatch message all the way to ancestor UI component
    }

    function handleMouseOut(){
        //dispatch message all the way to ancestor UI component
    }
</script>




<button  on:mouseover={handleMouseOver} on:mouseout={handleMouseOut}
    on:focus={handleMouseOver} on:blur={handleMouseOver} >
    <p class="small">{label}</p>
</button>




<style>
    button{
        border: 0px;
        width: 60px;
        padding: var(--size-xs) var(--size-s);
        border-radius: var(--size-xs);
        background-color: var(--color-link);
    }

    button:hover{
        background-color: var(--color-hover);
    }

    button p{
        color: white;
    }
</style>