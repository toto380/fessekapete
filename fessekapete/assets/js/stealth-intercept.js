/*! stealth-intercept.js — doit être le TOUT PREMIER script chargé */
(function(){
  'use strict';
  var FIRST_PARTY = location.origin;
  var HOST_RE = /https?:\/\/(www\.|region1\.|ssl\.|stats\.)?(google-?(tag)?manager|google-analytics|doubleclick)\.(com|net)/gi;

  function rewrite(u){
    if (!u) return u;
    if (typeof u !== 'string') { try { u = u.toString(); } catch(e){ return u; } }
    if (u.indexOf('google') === -1 && u.indexOf('doubleclick') === -1) return u;
    return u.replace(HOST_RE, FIRST_PARTY + '/assets/lib/web-vitals');
  }

  // 1. fetch
  var _fetch = window.fetch;
  if (_fetch){
    window.fetch = function(input, init){
      try {
        if (typeof input === 'string') input = rewrite(input);
        else if (input && input.url) input = new Request(rewrite(input.url), input);
      } catch(e){}
      return _fetch.call(this, input, init);
    };
  }

  // 2. XMLHttpRequest
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, u){
    try { arguments[1] = rewrite(u); } catch(e){}
    return _open.apply(this, arguments);
  };

  // 3. sendBeacon
  if (navigator.sendBeacon){
    var _b = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(u, d){ return _b(rewrite(u), d); };
  }

  // 4. HTMLScriptElement.src, HTMLImageElement.src, HTMLLinkElement.href, HTMLIFrameElement.src
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

  // 6. MutationObserver — rattrape toute injection DOM tardive
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
