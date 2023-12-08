<script>
    export let id;
    export let name;
    export let nodeIDs;

    function handleRightClick(event) {
        // Prevent the default context menu
        event.preventDefault();
        
        const customEvent = new CustomEvent('customEvent', {
            detail: { type: "options-show", x:event.clientX, y:event.clientY, input:{id:id, nodeIDs:nodeIDs}},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

</script>




<p class="small" on:contextmenu={handleRightClick}><b>{nodeIDs.length}</b> in {name}</p>




<style>
    p{
        color: var(--color-blue-4);
        cursor: default;
    }

    p:hover{
        background-color: var(--color-blue-1);
    }
</style>