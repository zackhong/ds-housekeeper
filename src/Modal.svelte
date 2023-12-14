<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,100,0,0" />
<script>
    //shows a popup window with text, ok and cancel buttons;
    //blocks entire UI while popup is present
    import { onMount, onDestroy } from 'svelte';
    import Button from './Button.svelte';
    import Dropdown from './Dropdown.svelte';

    let isVisible=false, mode='';
    let title='', bodyText='', checkboxText='';
    let okText='Ok', cancelText = 'Cancel';
    let okAction; //this holds the ref to function to be attached to ok button's onClick event
    let hasCheckbox=false, isChecked = false, hasDropdown=false;
    
    onMount(() => {
        document.addEventListener('customEvent', handleCustomEvent);
    });

    onDestroy(() => {
        document.removeEventListener('customEvent', handleCustomEvent);
    });

    function handleCustomEvent(event) {
        switch(event.detail.action){

            case 'popup-delete-style':
            promptDeleteStyle(event.detail);
            break;

            case 'popup-delete-all-layers':
            promptDeleteAllLayers(event.detail);
            break;

            case 'popup-delete-from-page':
            promptDeleteFromPage(event.detail);
            break;
		}
	}




    function promptDeleteStyle(detail){

        let formattedType = (detail.type == 'comp')? 'component' : detail.type;
        title = `delete ${formattedType}`;
        bodyText = `You are about to delete the ${formattedType} <b>${detail.styleName}</b>. Are you sure?`;
        okText = 'Delete';
        okAction = () => deleteStyle(detail);
        hasCheckbox = false;
        isVisible = true;
    }

    function promptDeleteAllLayers(detail){

        let formattedType = (detail.type == 'comp')? 'instances' : 'layers';
        title = `delete all ${formattedType}`;
        bodyText = `You are about to delete all ${formattedType} from <b>${detail.styleName}</b>. Are you sure?`;
        checkboxText = `Delete <b>${detail.styleName}</b> as well`;
        hasCheckbox = true;
        okText = 'Delete All';
        okAction = () => deleteAllLayers(detail);
        isVisible = true;
    }

    function promptDeleteFromPage(detail){

        let formattedType = (detail.type == 'comp')? 'instances' : 'layers';
        title = `delete ${formattedType} from page`;
        let formattedName = truncateString(detail.pageName);
        bodyText = `You are about to delete all <b>${detail.styleName}</b> ${formattedType} in <b>${formattedName}</b>. Are you sure?`;
        hasCheckbox = false;
        okText = 'Delete All';
        okAction = () => deleteLayersFromPage(detail);
        isVisible = true;
    }

    


    //handler attached to ok button, executes different actions based on modal's current mode
    function deleteStyle(detail){

        isVisible = false;

        let customEvent = new CustomEvent('customEvent', {
            detail: { action:`delete-${detail.type}`, id:detail.styleID},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    //tells plugin ui to coordinate the deletion process on ui and plugin sides
    function deleteAllLayers(detail){

        isVisible = false;

        let customEvent = new CustomEvent('customEvent', {
            detail: { action:`delete-all-layers-start`, id:detail.styleID, type:detail.type, name:detail.styleName, pages:detail.pages, deleteStyle:isChecked},
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    function deleteLayersFromPage(detail){

        isVisible = false;

        let customEvent = new CustomEvent('customEvent', {
            detail: { ...detail, action:`delete-layers-page-start` },
            bubbles: true
        });
        document.dispatchEvent(customEvent);
    }

    function close(){
        isVisible = false;
    }

    function toggleCheck(){
        isChecked = !isChecked;
    }

    //shortens string for long names
    function truncateString(str, maxLength=20) {
        if (str.length > maxLength) {
            return str.substring(0, maxLength - 3) + '..';
        } else {
            return str;
        }
    }
</script>




{#if isVisible}
<div class="blocker">
    <div class="main">
        <p class="large bold">{title}</p>
        <div class="text-n-buttons">
            <p>{@html bodyText}</p>
            {#if hasCheckbox}
                <div class="checkbox-cont">
                    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
                    <span class="material-symbols-outlined icon" on:click={toggleCheck}>{ isChecked? 'check_box' : 'check_box_outline_blank'}</span>
                    <p>{@html checkboxText}</p>
                </div>
            {/if}
            {#if hasDropdown}
                <Dropdown/>
            {/if}
            <div class="button-group">
                <Button label={okText} 
                    onClick={okAction}/>
                <Button label={cancelText}
                    type='secondary'
                    onClick={close}/>
            </div>
        </div>
    </div>
</div>
{/if}





<style>
    .blocker{
        background-color: var(--color-white-faint);

        position: fixed;
        z-index: 4;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        width: 100%;
        height: 100%;
    }

    .main{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        row-gap: var(--size-m);

        box-sizing: border-box;
        width: 240px;
        padding: var(--size-m);

        background-color: white;
        border: 1px solid var(--color-blue-4);
    }

    .text-n-buttons{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        row-gap: var(--size-s);
    }

    .button-group{
        display: flex;
        flex-direction: row;
        column-gap: var(--size-xs);
    }

    p{
        width: 100%;
        text-align: left;
        hyphens: auto;
    }

    p.large{
        text-transform: capitalize;
    }

    .checkbox-cont{
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
    }

    .icon{
        font-size: var(--size-ml);
        color: var(--color-blue-4);
        cursor: default;
        user-select: none;
    }
</style>