<script>
    //shows a popup window with text, ok and cancel buttons;
    //blocks entire UIwhile popup is present
    import { onMount, onDestroy } from 'svelte';
    import Button from './Button.svelte';

    let title;
    let text;
    let proceedText;
    let cancelText;

    let proceedAction;
    let proceedInput;
    let isVisible = false;

    onMount(() => {
        document.addEventListener('customEvent', handleCustomEvent);
    });

    onDestroy(() => {
        document.removeEventListener('customEvent', handleCustomEvent);
    });

    function deleteStyle(input){

        let styleTitle;
        let styleType;
        
        switch(input.type){

            case 'text':
            styleTitle = 'Text';
            styleType = 'text';
            break;

            case 'color':
            styleTitle = 'Color';
            styleType = 'color';
            break;

            case 'comp':
            styleTitle = 'Component';
            styleType = 'component';
            break;
        }

        title = `Delete ${styleTitle}`;
        text = `You're about to delete the ${styleType} <b>${input.name}</b>. Are you sure?`;
        proceedText = 'Delete';
        proceedAction = `delete-${input.type}`;
        proceedInput = {id:input.id};
        cancelText = 'Cancel';
        isVisible = true;
    }

    function handleCustomEvent(event) {
        switch(event.detail.type){

			case 'prompt-delete-style':  
            deleteStyle(event.detail.input);
			break;

            case 'cancel': case 'delete-text': case 'delete-color': case 'delete-comp':
            isVisible = false;
            break;

            case 'prompt-delete-layers-all':
            //todo
            break;

            case 'prompt-delete-layers-page':
            //todo
            break;
		}
	}
</script>


{#if isVisible}
<div class="blocker">
    <div class="main">
        <p class="large bold">{title}</p>
        <div class="text-n-buttons">
            <p>{@html text}</p>
            <div class="button-group">
                <Button label={proceedText}
                    action={proceedAction}
                    input={proceedInput}/>
                <Button label={cancelText}
                    type='secondary'
                    action='cancel'/>
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
</style>