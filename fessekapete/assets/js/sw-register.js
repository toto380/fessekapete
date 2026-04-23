if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw-stealth.js', { scope: '/' }).catch(function(){});
}
