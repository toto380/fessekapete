/* ============================================================
   STRATADS — COOKIE BANNER (Rocket SA-26)
   Self-contained: injects CSS + HTML + logic.
   Include on indexable pages only.
   ============================================================ */
(function () {
    // Skip if already dismissed this session
    if (sessionStorage.getItem('sa_cookie_dismissed')) return;

    /* ── CSS ── */
    var css = document.createElement('style');
    css.textContent = [
        '.cookie-banner{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:10000;display:flex;align-items:center;gap:14px;padding:10px 22px;background:rgba(8,12,24,0.82);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid rgba(59,130,246,0.12);border-radius:50px;box-shadow:0 8px 40px rgba(0,0,0,0.5);transition:opacity .5s ease,transform .7s cubic-bezier(.4,0,.2,1);animation:cbSlideIn .6s cubic-bezier(.22,1,.36,1)}',
        '.cookie-banner.launched{opacity:0;transform:translateX(-50%) translateY(10px);pointer-events:none}',
        '.cookie-banner p{color:rgba(255,255,255,.75);font-size:.82rem;font-weight:300;margin:0;white-space:nowrap}',
        '.cb-btns{display:flex;gap:8px}',
        '.cb-accept{padding:7px 18px;border:none;border-radius:20px;background:linear-gradient(135deg,rgba(59,130,246,.9),rgba(124,58,237,.7));color:#fff;font-family:var(--font-body,Montserrat,sans-serif);font-size:.72rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .3s}',
        '.cb-accept:hover{box-shadow:0 0 18px rgba(59,130,246,.35)}',
        '.cb-refuse{padding:7px 18px;border:1px solid rgba(255,255,255,.12);border-radius:20px;background:transparent;color:rgba(255,255,255,.5);font-family:var(--font-body,Montserrat,sans-serif);font-size:.72rem;font-weight:500;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .3s}',
        '.cb-refuse:hover{border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.8)}',
        /* Rocket */
        '.rw{position:relative;width:28px;height:52px;flex-shrink:0;animation:rkIdle 2.5s ease-in-out infinite}',
        '.rw.rumble{animation:rkRumble .08s linear infinite}',
        '.rw.liftoff{animation:rkLift 1.2s cubic-bezier(.35,0,.15,1) forwards}',
        '.rk-n{position:absolute;top:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:14px solid #c8d6e5}',
        '.rk-b{position:absolute;top:13px;left:50%;transform:translateX(-50%);width:16px;height:22px;background:linear-gradient(180deg,#dfe6ed 0%,#a4b0be 50%,#8395a7 100%);border-radius:2px}',
        '.rk-lb{position:absolute;top:28px;left:50%;transform:translateX(-50%);font-family:var(--font-body,Montserrat,sans-serif);font-size:3.5px;font-weight:700;color:#222f3e;letter-spacing:.3px;white-space:nowrap;z-index:2;pointer-events:none}',
        '.rk-w{position:absolute;top:17px;left:50%;transform:translateX(-50%);width:7px;height:7px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#48dbfb,#0abde3,#0c2461);border:1px solid rgba(255,255,255,.4);box-shadow:0 0 6px rgba(72,219,251,.6)}',
        '.rk-fl,.rk-fr{position:absolute;bottom:12px;width:0;height:0;border-top:6px solid transparent;border-bottom:8px solid #576574}',
        '.rk-fl{left:0;border-right:7px solid #576574}',
        '.rk-fr{right:0;border-left:7px solid #576574}',
        '.rk-nz{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);width:10px;height:5px;background:#222f3e;border-radius:0 0 3px 3px}',
        /* Flame */
        '.rk-fm{position:absolute;bottom:-2px;left:50%;transform:translateX(-50%) scaleY(0);width:12px;height:0;transform-origin:top center;opacity:0}',
        '.rk-fm.on{animation:fmGrow .35s ease-out forwards}',
        '.rk-fi{position:absolute;top:0;left:50%;transform:translateX(-50%);width:8px;height:100%;background:linear-gradient(180deg,#fbbf24 0%,#f97316 35%,#ef4444 70%,rgba(239,68,68,0) 100%);border-radius:0 0 50% 50%;animation:fmFlick .08s linear infinite alternate}',
        '.rk-fo{position:absolute;top:0;left:50%;transform:translateX(-50%);width:14px;height:100%;background:linear-gradient(180deg,rgba(251,191,36,.4) 0%,rgba(249,115,22,.2) 40%,transparent 100%);border-radius:0 0 50% 50%;filter:blur(2px)}',
        /* Smoke */
        '.rk-sm{position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:30px;height:20px;pointer-events:none;opacity:0}',
        '.rk-sm.on{opacity:1}',
        '.rk-sm span{position:absolute;border-radius:50%;background:rgba(148,163,184,.3);filter:blur(3px)}',
        '.rk-sm span:nth-child(1){width:6px;height:6px;left:3px;bottom:0;animation:smUp .7s ease-out infinite}',
        '.rk-sm span:nth-child(2){width:5px;height:5px;left:14px;bottom:2px;animation:smUp .7s .15s ease-out infinite}',
        '.rk-sm span:nth-child(3){width:7px;height:7px;left:22px;bottom:0;animation:smUp .7s .3s ease-out infinite}',
        /* Keyframes */
        '@keyframes cbSlideIn{from{transform:translate(-50%,60px);opacity:0}to{transform:translate(-50%,0);opacity:1}}',
        '@keyframes rkIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}',
        '@keyframes rkRumble{0%{transform:translate(-1px,0) rotate(-.5deg)}25%{transform:translate(1px,.5px) rotate(.5deg)}50%{transform:translate(-.5px,-.5px) rotate(-.3deg)}75%{transform:translate(1px,0) rotate(.4deg)}100%{transform:translate(-1px,.5px) rotate(-.5deg)}}',
        '@keyframes rkLift{0%{transform:translateY(0)}8%{transform:translateY(3px)}20%{transform:translateY(0)}100%{transform:translateY(-110vh)}}',
        '@keyframes fmGrow{0%{height:0;opacity:0;transform:translateX(-50%) scaleY(0)}40%{height:18px;opacity:1;transform:translateX(-50%) scaleY(1)}100%{height:24px;opacity:1;transform:translateX(-50%) scaleY(1)}}',
        '@keyframes fmFlick{0%{transform:translateX(-50%) scaleX(1)}100%{transform:translateX(-50%) scaleX(.85)}}',
        '@keyframes smUp{0%{transform:translateY(0) scale(1);opacity:.5}100%{transform:translateY(14px) scale(2);opacity:0}}',
        /* Mobile */
        '@media(max-width:640px){.cookie-banner{flex-wrap:wrap;border-radius:18px;bottom:12px;padding:12px 18px;gap:10px;justify-content:center}.cookie-banner p{white-space:normal;text-align:center;font-size:.78rem}}',
        '@supports(padding:max(0px)){.cookie-banner{bottom:max(18px,env(safe-area-inset-bottom))}}'
    ].join('\n');
    document.head.appendChild(css);

    /* ── HTML ── */
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.innerHTML = [
        '<div class="rw" id="rw">',
        '  <div class="rk-n"></div>',
        '  <div class="rk-b"></div>',
        '  <div class="rk-lb">SA-26</div>',
        '  <div class="rk-w"></div>',
        '  <div class="rk-fl"></div>',
        '  <div class="rk-fr"></div>',
        '  <div class="rk-nz"></div>',
        '  <div class="rk-fm" id="rk-fm"><div class="rk-fo"></div><div class="rk-fi"></div></div>',
        '  <div class="rk-sm" id="rk-sm"><span></span><span></span><span></span></div>',
        '</div>',
        '<p>Nous récoltons des cookies pour améliorer l\'expérience utilisateur.</p>',
        '<div class="cb-btns">',
        '  <button class="cb-accept" id="cb-accept">Accepter</button>',
        '  <button class="cb-refuse" id="cb-refuse">Refuser</button>',
        '</div>'
    ].join('');
    document.body.appendChild(banner);

    /* ── Launch Logic ── */
    function launch() {
        var wrap = document.getElementById('rw');
        var flame = document.getElementById('rk-fm');
        var smoke = document.getElementById('rk-sm');
        wrap.classList.add('rumble');
        smoke.classList.add('on');
        setTimeout(function () { flame.classList.add('on'); }, 500);
        setTimeout(function () { wrap.classList.remove('rumble'); wrap.classList.add('liftoff'); }, 1000);
        setTimeout(function () { banner.classList.add('launched'); }, 1400);
        setTimeout(function () { banner.style.display = 'none'; sessionStorage.setItem('sa_cookie_dismissed', '1'); }, 2100);
    }

    // ACTION : CLIC SUR ACCEPTER
    document.getElementById('cb-accept').addEventListener('click', function() {
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        
        // 1. On déverrouille officiellement le Consent Mode V2
        gtag('consent', 'update', {
            'ad_storage': 'granted',
            'analytics_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted'
        });

        // Forcer la mise à jour vers le serveur de metrics
        gtag('config', 'G-S30RM9RR91', {
            'transport_url': 'https://www.stratads.fr/assets',
            'update': true
        });

        // 2. On envoie l'événement à GTM
        window.dataLayer.push({'event': 'cookie_consent_update'});
        
        launch();
    });

    // ACTION : CLIC SUR REFUSER
    document.getElementById('cb-refuse').addEventListener('click', function() {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({'event': 'cookie_consent_rejected'});
        launch();
    });
})();