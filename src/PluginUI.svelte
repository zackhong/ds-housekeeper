<script>
	// import './global.css';
	import Loading from './Loading.svelte';
	let loading;

	parent.postMessage({ pluginMessage: {type: 'start'} },'*');

	function onLoad(event) {

		console.log(event.data.pluginMessage.type);
		if(event.data.pluginMessage.type === "result-display"){console.log(event.data.pluginMessage.data);}

		loading.handleMessage(event.data.pluginMessage);
	}

</script>

<!-- listens for all messages from plugin code, then dispatches message to all child components-->
<svelte:window on:message={onLoad} />
<Loading bind:this={loading}/>



<style>
</style>