<script>
	import { onMount } from 'svelte';
	import { onDestroy } from 'svelte';
	import Loading from './Loading.svelte';
	import ResultDisplay from './ResultDisplay.svelte';
    import Tooltip from './Tooltip.svelte';
	let loading;
	let resultDisplay;
	let tooltip;

	//tells plugin code to start processing
	parent.postMessage({ pluginMessage: {type: 'start'} },'*');

	//dispatches messages from plugin code to child components
	function onLoad(event) {
		loading.handleMessage(event.data.pluginMessage);
		resultDisplay.handleMessage(event.data.pluginMessage);
	}

	//listens to custom events from child components, then messages plugin code accordingly
    onMount(() => { document.addEventListener('customEvent', handleCustomEvent);});
    onDestroy(() => {document.removeEventListener('customEvent', handleCustomEvent);});

	function handleCustomEvent(event) {
        switch(event.detail.type){

			case 'scan-text': case 'scan-color': case 'scan-comp':
			parent.postMessage({ pluginMessage: {type: event.detail.type, id: event.detail.input.id, name: event.detail.input.name} },'*');
			break;
		}
	}

</script>




<!-- use svelte:window to listen for messages from plugin code, auto deallocates memory when child components are removed-->
<svelte:window on:message={onLoad} />
<Loading bind:this={loading}/>
<ResultDisplay bind:this={resultDisplay}/>
<Tooltip bind:this={tooltip}/>



<style>
</style>