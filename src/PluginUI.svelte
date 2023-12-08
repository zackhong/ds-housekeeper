<script>
	import { onMount, onDestroy } from 'svelte';
	import Modal from './Modal.svelte';
	import Loading from './Loading.svelte';
	import StyleDisplay from './StyleDisplay.svelte';
    import Tooltip from './Tooltip.svelte';
	import PopupOptions from './PopupOptions.svelte';
    import MenuBar from './MenuBar.svelte';

	let loading;
	let results;
	let tooltip;
	let options;
	let menu;
	let popup;

	//tells plugin code to start processing
	parent.postMessage({ pluginMessage: {type: 'start'} },'*');

	//dispatches messages from plugin code to child components
	function onLoad(event) {

		switch(event.data.pluginMessage.type){

			case 'remote-text-complete':
			parent.postMessage({ pluginMessage: {type: 'find-color'} },'*');
			break;

			case 'remote-color-complete':
			loading.hide();
			break;

			case 'remote-color-complete':
			loading.hide();
			break;
		}

		loading.handleMessage(event.data.pluginMessage);
		menu.handleMessage(event.data.pluginMessage);
		results.handleMessage(event.data.pluginMessage);
	}

	//listens to custom events from child components, then messages plugin code accordingly
    onMount(() => { document.addEventListener('customEvent', handleCustomEvent); });
    onDestroy(() => {document.removeEventListener('customEvent', handleCustomEvent);});

	function handleCustomEvent(event) {
        switch(event.detail.type){

			//tells plugin to keep processing the remote styles
			case 'process-remote-text': case 'process-remote-color': case 'process-remote-comp':
			parent.postMessage({ pluginMessage: {type: event.detail.type} },'*');
			break;

			case 'scan-text': case 'scan-color': case 'scan-comp':
			parent.postMessage({ pluginMessage: {type: event.detail.type, id: event.detail.input.id, name: event.detail.input.name} },'*');
			break;

			case 'view-local-comp':
			parent.postMessage({ pluginMessage: {type: event.detail.type, id: event.detail.input.id} },'*');
			break;

			case 'view-selection':
			parent.postMessage({ pluginMessage: {type: event.detail.type, id: event.detail.input.id, nodeIDs: event.detail.input.nodeIDs} },'*');
			break;

			case 'delete-text': case 'delete-color': case 'delete-comp':
			parent.postMessage({ pluginMessage: {type: event.detail.type, id: event.detail.input.id} },'*');
			break;
		}
	}

</script>




<!-- use svelte:window to listen for messages from plugin code, auto deallocates memory when child components are removed-->
<svelte:window on:message={onLoad} />

<Loading bind:this={loading}/>
<Modal bind:this={popup}/>
<MenuBar bind:this={menu}/>
<StyleDisplay bind:this={results}/>
<Tooltip bind:this={tooltip}/>
<PopupOptions bind:this={options}/>



<style>
</style>