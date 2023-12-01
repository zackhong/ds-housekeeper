<script>
    export let fontName;
    export let fontWeight;
    export let fontSize;
    export let lineHeight;
</script>



<div>
    <p>{fontName} {fontWeight}</p>
    <p class="bold">{fontSize}/{lineHeight}</p>
</div>





<style>
    div{
        display: flex;
        flex-direction: column;
        align-items: start;
        row-gap: var(--size-s);
        width: 80px;
    }
</style>