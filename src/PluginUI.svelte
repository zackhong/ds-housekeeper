<script>
	// import './global.css';
	import Loading from './Loading.svelte';
	import ResultDisplay from './ResultDisplay.svelte';
    import Tooltip from './Tooltip.svelte';
	let loading;
	let resultDisplay;
	let tooltip;

	parent.postMessage({ pluginMessage: {type: 'start'} },'*');

	//dispatches messages to all child components when window receives messages from plugin code
	function onLoad(event) {
		loading.handleMessage(event.data.pluginMessage);
		resultDisplay.handleMessage(event.data.pluginMessage);
		tooltip.handleMessage(event.data.pluginMessage);
	}
</script>




<!-- use svelte:window to listen for messages from plugin code, auto deallocates memory when child components are removed-->
<svelte:window on:message={onLoad} />
<Loading bind:this={loading}/>
<ResultDisplay bind:this={resultDisplay}/>
<Tooltip bind:this={tooltip}/>



<style>
</style>