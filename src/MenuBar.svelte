<script>
    import Dropdown from "./Dropdown.svelte";
    import Search from "./SearchBar.svelte";

    let dropdown;
    let search;

    let values = ['Text', 'Colors', 'Components'];

    export function handleMessage(message){
        switch(message.type){

            //todo: send message to child components
        }
    }
</script>




<div class="main">
    <Dropdown values = {values} width=108 bind:this={dropdown}/>
    <Search bind:this={search}/>
</div>





<style>
    .main{
		position: sticky;
		top: 0px;
		z-index: 3;

		display: flex;
        flex-direction: row;
        justify-content: space-between;
        row-gap: var(--size-xs);
        padding: var(--size-s);

		background-color: white;
		box-shadow: var(--shadow);
	}
</style>