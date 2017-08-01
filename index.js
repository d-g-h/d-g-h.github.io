import './style.css'
import * as hljs from 'highlight.js/lib/highlight.js';
import * as OfflinePluginRuntime from 'offline-plugin/runtime';

hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'));
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));
hljs.initHighlightingOnLoad();
OfflinePluginRuntime.install();
