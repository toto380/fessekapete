/*! stealth-intercept.js — Version Renforcée */
(function(){
  'use strict';
  var FIRST_PARTY = location.origin;
  var HOST_RE = /https?:\/\/(www\.|region1\.|ssl\.|stats\.)?(google-?(tag)?manager|google-analytics|doubleclick)\.(com|net)/gi;

  function rewrite(u){
    if (!u || typeof u !== 'string') return u;
    
    // EXCEPTION : Si l'URL contient "DUMMY" ou vient de Tag Assistant, on ne camoufle PAS.
    // Cela permet aux outils de debug de Google de fonctionner sans polluer ton sGTM.
    if (u.indexOf('id=DUMMY') !== -1 || u.indexOf('tagassist') !== -1) return u;

    if (u.indexOf('google') === -1 && u.indexOf('doubleclick') === -1) return u;

    var path = '/assets/lib/web-vitals';
    
    // Mapping vers tes noms anonymes (container, loader, telemetry)
    if (u.indexOf('gtm.js') !== -1) return u.replace(HOST_RE, FIRST_PARTY + path).replace('gtm.js', 'container.js');
    if (u.indexOf('gtag/js') !== -1) return u.replace(HOST_RE, FIRST_PARTY + path).replace('gtag/js', 'loader.js');
    if (u.indexOf('/g/collect') !== -1) return u.replace(HOST_RE, FIRST_PARTY + path).replace('/g/collect', '/telemetry');

    return u.replace(HOST_RE, FIRST_PARTY + path);
  }

  var DEBUG_HEADER = "ZW52LTV8N0txdUxsMUE2TUFmT3RlRlhpQkJsQXwxOWRiYjllNGM3MjYxNTQ4OTEwODg=";

  // 1. fetch
  var _fetch = window.fetch;
  if (_fetch){
    window.fetch = function(input, init){
      try {
        if (typeof input === 'string') input = rewrite(input);
        else if (input && input.url) input = new Request(rewrite(input.url), input);
        
        // Sécurité : on initialise init si absent pour injecter le header
        init = init || {};
        init.headers = init.headers || {};
        
        if (init.headers instanceof Headers) {
          init.headers.set('x-gtm-server-preview', DEBUG_HEADER);
        } else {
          init.headers['x-gtm-server-preview'] = DEBUG_HEADER;
        }
      } catch(e){}
      return _fetch.call(this, input, init);
    };
  }

  // 2. XMLHttpRequest
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, u){
    try { arguments[1] = rewrite(u); } catch(e){}
    var res = _open.apply(this, arguments);
    try {
      this.setRequestHeader('x-gtm-server-preview', DEBUG_HEADER);
    } catch(e){}
    return res;
  };

  // 3. sendBeacon
  if (navigator.sendBeacon){
    var _b = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(u, d){ return _b(rewrite(u), d); };
  }

  // 4. Patch des propriétés DOM (src, href)
  function patchProp(proto, prop){
    var d = Object.getOwnPropertyDescriptor(proto, prop);
    if (!d || !d.set) return;
    Object.defineProperty(proto, prop, {
      configurable: true, enumerable: true,
      get: d.get,
      set: function(v){ d.set.call(this, rewrite(v)); }
    });
  }
  patchProp(HTMLScriptElement.prototype, 'src');
  patchProp(HTMLImageElement.prototype, 'src');
  patchProp(HTMLLinkElement.prototype, 'href');
  patchProp(HTMLIFrameElement.prototype, 'src');

  // 5. setAttribute
  var _setAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(n, v){
    if (n === 'src' || n === 'href' || n === 'data-src') v = rewrite(v);
    return _setAttr.call(this, n, v);
  };

  // 6. MutationObserver
  var mo = new MutationObserver(function(muts){
    for (var i=0; i<muts.length; i++){
      var m = muts[i];
      for (var j=0; j<m.addedNodes.length; j++){
        var n = m.addedNodes[j];
        if (!n || n.nodeType !== 1) continue;
        if (n.src) n.src = rewrite(n.src);
        if (n.href) n.href = rewrite(n.href);
        var kids = n.querySelectorAll ? n.querySelectorAll('[src],[href]') : [];
        for (var k=0; k<kids.length; k++){
          if (kids[k].src) kids[k].src = rewrite(kids[k].src);
          if (kids[k].href) kids[k].href = rewrite(kids[k].href);
        }
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src','href'] });

  window.__stealth = { rewrite: rewrite };
})();
