import './style.css'
import * as hljs from 'highlight.js/lib/highlight.js';
hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'));
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));
hljs.initHighlightingOnLoad();
