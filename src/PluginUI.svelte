<script>
	import { onMount, onDestroy } from 'svelte';
	import Modal from './Modal.svelte';
	import Loading from './Loading.svelte';
	import StyleDisplay from './StyleDisplay.svelte';
    import Tooltip from './Tooltip.svelte';
	import Options from './Options.svelte';
    import MenuBar from './MenuBar.svelte';
	import { results, showRemoteBtn } from './stores.js';

	let loading;
	let resultDisplay;
	let tooltip;
	let options;
	let menu;
	let popup;




	
	onMount(() => { 
		document.addEventListener('customEvent', handleCustomEvent); 
		//waits a while before telling plugin to initialize
		loading.show('Loading local text styles...');
		setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-local-text'} },'*'); }, 100 );
	});

    onDestroy(() => {document.removeEventListener('customEvent', handleCustomEvent);});



	
	//coordinates actions btw UI and plugin via messages,
	//dispatches messages from plugin code to child components
	function onLoad(event) {

		let nextAction;
		switch(event.data.pluginMessage.action){

			//---------------LOADING LOCAL STYLES
			case 'load-local-text':
			loading.updateText('Loading local text styles...');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-local-text'} },'*'); }, 100 );
			break;

			case 'display-local-text':
			loading.updateText('Loading local color styles...');
			resultDisplay.handleMessage({action: 'display-text', data: event.data.pluginMessage.data});
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-local-colors'} },'*'); }, 100 );
			break;

			case 'display-local-colors':
			loading.updateText('Loading local components...');
			resultDisplay.handleMessage({action: 'display-colors', data: event.data.pluginMessage.data});
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-local-comps-start'} },'*'); }, 100 );
			break;

			case 'load-local-comps-progress':
			loading.updateProgress(event.data.pluginMessage.text);
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-local-comps-continue'} },'*'); }, 100 );
			break;

			case 'display-local-comps': 
			resultDisplay.handleMessage({action: 'display-comps', data: event.data.pluginMessage.data});
			results.update(currResults => {
                return {...currResults, canScroll:true};
            });
			loading.hide();
			break;







			//--------------UPDATING AFTER GETTING USAGE STATS OF STYLE
			case 'update-text': case 'update-color': case 'update-comp':
			results.update(currResults => {
                return {...currResults, canScroll:true};
            });
			loading.hide();
			break;






			//--------------LOADING REMOTE STYLES
			case 'load-remote-text-progress': case 'load-remote-colors-progress': case 'load-remote-comps-progress':
			loading.updateProgress(event.data.pluginMessage.text);
			nextAction = event.data.pluginMessage.action.replace('progress', 'continue');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: nextAction} },'*'); }, 100 );
			break;

			case 'display-remote-text':
			resultDisplay.handleMessage({action: 'display-text', data: event.data.pluginMessage.data});
			loading.show('Loading remote color styles...');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-remote-colors-start'} },'*'); }, 100 );
			break;

			case 'display-remote-colors':
			resultDisplay.handleMessage({action: 'display-colors', data: event.data.pluginMessage.data});
			loading.show('Loading remote comps...');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'load-remote-comps-start'} },'*'); }, 100 );
			break;

			case 'display-remote-comps':
			resultDisplay.handleMessage({action: 'display-comps', data: event.data.pluginMessage.data});
			showRemoteBtn.set(false);
			loading.hide();
			break;






			//----------SCANNING AND SELECTING LAYERS
			case 'scan-text-start': case 'scan-color-start': case 'scan-comp-start':
			loading.updateText(`Updating ${event.data.pluginMessage.name}...`);
			setTimeout( ()=>{parent.postMessage({ pluginMessage: event.data.pluginMessage },'*');}, 100 );
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





			//-----------DELETING LAYERS
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





			//----------SWAPPING LAYERS
			//tells plugin to keep swapping layers until it's complete
			case 'swap-all-text-progress': case 'swap-all-color-progress': case 'swap-all-comp-progress':
			loading.updateProgress(event.data.pluginMessage.text);
			nextAction = event.data.pluginMessage.action.replace('progress', 'continue');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: nextAction} },'*'); }, 100 );
			break;

			case 'swap-text-from-page-progress': case 'swap-color-from-page-progress': case 'swap-comp-from-page-progress':
			loading.updateProgress(event.data.pluginMessage.text);
			nextAction = event.data.pluginMessage.action.replace('progress', 'continue');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: nextAction} },'*'); }, 100 );
			break;
		}

		loading.handleMessage(event.data.pluginMessage);
		resultDisplay.handleMessage(event.data.pluginMessage);
	}




	//handles custom events from UI components
	function handleCustomEvent(event) {

		let formattedType, customEvent;
        switch(event.detail.action){

			//---------SCANNING AND VIEWING
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

			




			//---------LOAD REMOTE STYLES
			case 'load-remote-text-start':
			loading.show('Loading remote text styles...');
			setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: event.detail.action} },'*'); }, 100 );
			break;




			//--------DELETING STYLES AND LAYERS
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





			//----------SWAPPING LAYERS
			case 'swap-all-layers-start':
			//first put up loading screen
			formattedType = (event.detail.type == 'comp')? 'instances' : 'layers';
			loading.show(`Swapping all <b>${event.detail.name}</b> ${formattedType} to <b>${event.detail.swapName}</b>...`);

			//then tell style display to swap all layers from style
			customEvent = new CustomEvent('customEvent', {
				detail: { ...event.detail, action:'swap-all-layers'},
				bubbles: true
			});
			document.dispatchEvent(customEvent);

			//then tell plugin to swap all layers from style
			setTimeout( ()=>{parent.postMessage({ pluginMessage: { ...event.detail, action:`swap-all-${event.detail.type}` }},'*');}, 100 );
			break;

			case 'swap-layers-page-start':
			//first put up loading screen
			formattedType = (event.detail.type == 'comp')? 'instances' : 'layers';
			loading.show(`Swapping all <b>${event.detail.styleName}</b> ${formattedType} to <b>${event.detail.swapName}</b> in <b>${event.detail.pageName}</b>...`);

			//then tell style display to delete all layers from style within this page
			customEvent = new CustomEvent('customEvent', {
				detail: { ...event.detail, action:`swap-layers-from-page`},
				bubbles: true
			});
			document.dispatchEvent(customEvent);

			//then tell plugin to delete all layers of this style from this page
			setTimeout( ()=>{parent.postMessage({ pluginMessage: { ...event.detail, action:`swap-${event.detail.type}-from-page` }},'*');}, 100 );
			break;
			





			//-----------RESETTIN RESULTS
			case 'reset-ui':
				loading.show('Resetting UI...');
				//first, clear results
				results.update(currResults => {
					return {...currResults, text:[], colors:[], comps:[]};
				});
				setTimeout( ()=>{ parent.postMessage({ pluginMessage: {action: 'reset-ui'} },'*'); }, 100 );
			break;
		}
	}

</script>



<!-- use svelte:window to listen for messages from plugin code, auto deallocates memory when child components are removed-->
<svelte:window on:message={onLoad} />

<Loading bind:this={loading}/>
<Modal bind:this={popup}/>
<MenuBar bind:this={menu}/>
<StyleDisplay bind:this={resultDisplay}/>
<Tooltip bind:this={tooltip}/>
<Options bind:this={options}/>




<style>
</style>