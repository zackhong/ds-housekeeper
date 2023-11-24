import App from './PluginUI';
import './global.css';//import global css here so that it's applied to all svelte components that are bundled

const app = new App({
	target: document.body,
});

export default app;