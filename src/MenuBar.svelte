<script>
    import Dropdown from "./Dropdown.svelte";
    import Search from "./SearchBar.svelte";
</script>




<div class="main">
    <Dropdown width=108/>
    <Search/>
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