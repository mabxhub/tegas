import {build} from 'vite';
process.env.VITE_STATIC_DEMO='true';
await build({base:'./'});
