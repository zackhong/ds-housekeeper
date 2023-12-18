<script>
	import { onMount, onDestroy } from 'svelte';
	import Modal from './Modal.svelte';
	import Loading from './Loading.svelte';
	import StyleDisplay from './StyleDisplay.svelte';
    import Tooltip from './Tooltip.svelte';
	import Options from './Options.svelte';
    import MenuBar from './MenuBar.svelte';

	let loading;
	let results;
	let tooltip;
	let options;
	let menu;
	let popup;

	
	

	//dispatches messages from plugin code to child components
	function onLoad(event) {

		let nextAction;
		switch(event.data.pluginMessage.action){

			case 'display-text':
			loading.updateText('Loading local color styles...');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-local-colors'} },'*'); }, 100 );
			break;

			case 'display-colors':
			loading.updateText('Loading local components...');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-local-comps-start'} },'*'); }, 100 );
			break;

			//tells plugin to keep processing local components until it's all complete
			case 'load-local-comps-progress':
			loading.updateProgress(event.data.pluginMessage.text);
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-local-comps-continue'} },'*'); }, 100 );
			break;

			case 'display-comps': case 'update-text': case 'update-color': case 'update-comp':
			loading.hide();
			break;

			case 'scan-text-progress': case 'scan-color-progress': case 'scan-comp-progress':
			loading.updateProgress(event.data.pluginMessage.text);
			nextAction = event.data.pluginMessage.action.replace('progress', 'continue');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: nextAction} },'*'); }, 100 );
			break;

			//tells plugin to keep processing selection until it's complete
			case 'select-progress':
			loading.updateProgress(event.data.pluginMessage.text);
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'select-continue'} },'*'); }, 100 );
			break;

			//tells plugin to keep deleting layers until it's complete
			case 'delete-all-text-progress': case 'delete-all-color-progress': case 'delete-all-comp-progress':
			loading.updateProgress(event.data.pluginMessage.text);
			nextAction = event.data.pluginMessage.action.replace('progress', 'continue');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: nextAction} },'*'); }, 100 );
			break;

			case 'delete-text-from-page-progress': case 'delete-color-from-page-progress': case 'delete-comp-from-page-progress':
			loading.updateProgress(event.data.pluginMessage.text);
			nextAction = event.data.pluginMessage.action.replace('progress', 'continue');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: nextAction} },'*'); }, 100 );
			break;
		}

		loading.handleMessage(event.data.pluginMessage);
		results.handleMessage(event.data.pluginMessage);
	}

	//listens to custom events from child components, then messages plugin code accordingly
    onMount(() => { 
		document.addEventListener('customEvent', handleCustomEvent); 
		//waits a while before telling plugin to initialize
		loading.updateText('Loading local text styles...');
		setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-local-text'} },'*'); }, 100 );
	});

    onDestroy(() => {document.removeEventListener('customEvent', handleCustomEvent);});

	function handleCustomEvent(event) {

		let formattedType, customEvent;
        switch(event.detail.action){

			case 'scan-text-start': case 'scan-color-start': case 'scan-comp-start':
			loading.show(`Scanning ${event.detail.name} for usage...`);
			setTimeout( ()=>{parent.postMessage({ pluginMessage: event.detail },'*');}, 100 );
			break;

			case 'view-local-comp':
			parent.postMessage({ pluginMessage: event.detail },'*');
			break;

			case 'select-start':
			parent.postMessage({ pluginMessage: event.detail },'*');
			break;

			case 'delete-style':
			parent.postMessage({ pluginMessage: { ...event.detail, action:`delete-${event.detail.type}` } },'*');
			break;

			case 'delete-all-layers-start':
			//first put up loading screen
			formattedType = (event.detail.type == 'comp')? 'instances' : 'layers';
			loading.show(`Deleting all ${formattedType} from ${event.detail.name}...`);

			//then tell style display to delete all layers from style
			customEvent = new CustomEvent('customEvent', {
				detail: { ...event.detail, action:'delete-all-layers'},
				bubbles: true
			});
			document.dispatchEvent(customEvent);

			//then tell plugin to delete all layers from style
			setTimeout( ()=>{parent.postMessage({ pluginMessage: { ...event.detail, action:`delete-all-${event.detail.type}` }},'*');}, 100 );
			break;

			case 'delete-layers-page-start':
			//first put up loading screen
			formattedType = (event.detail.type == 'comp')? 'instances' : 'layers';
			loading.show(`Deleting all ${formattedType} from ${event.detail.pageName}...`);

			//then tell style display to delete all layers from style within this page
			customEvent = new CustomEvent('customEvent', {
				detail: { ...event.detail, action:`delete-layers-from-page`},
				bubbles: true
			});
			document.dispatchEvent(customEvent);

			//then tell plugin to delete all layers of this style from this page
			setTimeout( ()=>{parent.postMessage({ pluginMessage: { ...event.detail, action:`delete-${event.detail.type}-from-page` }},'*');}, 100 );
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
<Options bind:this={options}/>



<style>
</style>