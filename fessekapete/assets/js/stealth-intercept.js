/*! stealth-intercept.js — Version Debug-Safe */
(function(){
  'use strict';
  var FIRST_PARTY = location.origin;
  var HOST_RE = /https?:\/\/(www\.|region1\.|ssl\.|stats\.)?(google-?(tag)?manager|google-analytics|doubleclick)\.(com|net)/gi;

  function rewrite(u){
    if (!u || typeof u !== 'string') return u;
    
    // 1. On ignore les requêtes de debug/DUMMY pour éviter la 400 sur sGTM
    if (u.indexOf('id=DUMMY') !== -1 || u.indexOf('tagassist') !== -1) return u;

    if (u.indexOf('google') === -1 && u.indexOf('doubleclick') === -1) return u;

    var path = '/assets/lib/web-vitals';
    
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
        var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        var isProxied = url.indexOf(FIRST_PARTY + '/assets/lib/web-vitals') !== -1;

        if (typeof input === 'string') input = rewrite(input);
        else if (input && input.url) input = new Request(rewrite(input.url), input);
        
        // SÉCURITÉ : On n'injecte le header que si la requête va vers NOTRE proxy
        // Injecter un header custom vers Google direct provoque une erreur CORS/Failed to fetch
        if (isProxied) {
          init = init || {};
          init.headers = init.headers || {};
          if (init.headers instanceof Headers) init.headers.set('x-gtm-server-preview', DEBUG_HEADER);
          else init.headers['x-gtm-server-preview'] = DEBUG_HEADER;
        }
      } catch(e){}
      return _fetch.call(this, input, init);
    };
  }

  // 2. XMLHttpRequest
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, u){
    try { 
      var finalUrl = rewrite(u);
      this._isProxied = finalUrl.indexOf(FIRST_PARTY + '/assets/lib/web-vitals') !== -1;
      arguments[1] = finalUrl; 
    } catch(e){}
    return _open.apply(this, arguments);
  };

  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(b){
    // On n'injecte le header que si c'est notre proxy
    if (this._isProxied) {
      try { this.setRequestHeader('x-gtm-server-preview', DEBUG_HEADER); } catch(e){}
    }
    return _send.apply(this, arguments);
  };

  // 3. sendBeacon, Patch DOM, MutationObserver (Le reste reste identique)
  if (navigator.sendBeacon){
    var _b = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(u, d){ return _b(rewrite(u), d); };
  }

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

  var _setAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(n, v){
    if (n === 'src' || n === 'href' || n === 'data-src') v = rewrite(v);
    return _setAttr.call(this, n, v);
  };

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
})();
