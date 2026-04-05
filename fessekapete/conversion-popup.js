function initConversionPopup() {
    const lang = document.documentElement.lang || 'fr';
    
    // Translation dictionary
    const content = {
        fr: {
            title: "Protégez votre budget publicitaire 🛡️",
            text: "Profitez de notre Audit de Fuite de Données. Une sécurité absolue : si nous ne trouvons aucune déperdition de données qui impacte vos campagnes, nous vous remboursons intégralement !",
            btn: "Profiter de l'audit",
            link: "Voir nos études de cas (ils pensaient aussi être à l'abri...)",
            url: "etude-de-cas.html",
            mention: "*sous conditions",
            trigger: "Offre du moment 🎁"
        },
        en: {
            title: "Protect your ad budget 🛡️",
            text: "Take advantage of our Data Leak Audit. Absolute security: if we find no data loss impacting your campaigns, we will refund you completely!",
            btn: "Claim my audit",
            link: "See our case studies (they thought they were safe too...)",
            url: "case-study.html",
            mention: "*terms and conditions apply",
            trigger: "Special Offer 🎁"
        }
    };
    
    const t = content[lang] || content['fr'];

    // Create the DOM elements
    const overlay = document.createElement('div');
    overlay.className = 'conversion-popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'conversion-popup glass-panel-strong';
    
    popup.innerHTML = `
        <button class="conversion-popup-close" aria-label="Close">✕</button>
        <h3 class="conversion-popup-title">${t.title}</h3>
        <p class="conversion-popup-text">${t.text}</p>
        <button class="conversion-popup-btn btn-premium" onclick="document.getElementById('contact').scrollIntoView({behavior: 'smooth'});">${t.btn}</button>
        <a href="${t.url}" class="conversion-popup-link">${t.link}</a>
        <div class="conversion-popup-mention">${t.mention}</div>
    `;
    
    const triggerBtn = document.createElement('button');
    triggerBtn.className = 'conversion-popup-trigger';
    triggerBtn.innerHTML = t.trigger;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    document.body.appendChild(triggerBtn);

    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        .conversion-popup-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(5, 8, 16, 0.85); backdrop-filter: blur(8px);
            z-index: 100000; display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: opacity 0.4s ease;
        }
        .conversion-popup-overlay.active {
            opacity: 1; pointer-events: auto;
        }
        .conversion-popup {
            position: relative; max-width: 500px; width: 90%; padding: 40px;
            text-align: center; border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.4);
            box-shadow: 0 0 50px rgba(59, 130, 246, 0.15);
            transform: translateY(20px); transition: transform 0.4s ease;
        }
        .conversion-popup-overlay.active .conversion-popup {
            transform: translateY(0);
        }
        .conversion-popup-close {
            position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.05);
            border: none; color: #94A3B8; font-size: 1.2rem; width: 32px; height: 32px;
            border-radius: 50%; cursor: pointer; transition: all 0.2s;
        }
        .conversion-popup-close:hover {
            color: #fff; background: rgba(255,255,255,0.15);
        }
        .conversion-popup-title {
            font-family: var(--font-heading, 'Cinzel', serif); font-size: 1.6rem; color: #fff;
            margin-bottom: 16px; line-height: 1.3;
        }
        .conversion-popup-text {
            color: #E2E8F0; font-size: 0.95rem; font-weight: 300; line-height: 1.7; margin-bottom: 25px;
        }
        .conversion-popup-btn {
            display: inline-block; width: 100%; border: none; font-family: inherit; font-size: 1rem; cursor: pointer;
            padding: 16px 24px; box-shadow: 0 0 25px rgba(59, 130, 246, 0.4); margin-bottom: 20px;
        }
        .conversion-popup-link {
            display: block; color: #60A5FA; font-size: 0.85rem; font-weight: 500; text-decoration: none; transition: color 0.2s; margin-bottom: 25px;
        }
        .conversion-popup-link:hover {
            color: #93C5FD; text-decoration: underline;
        }
        .conversion-popup-mention {
            font-size: 0.65rem; color: #64748B;
        }
        /* Floating trigger button */
        .conversion-popup-trigger {
            position: fixed; bottom: 24px; left: 24px; padding: 12px 20px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(124, 58, 237, 0.85));
            color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 30px;
            font-family: var(--font-body, 'Montserrat', sans-serif); font-size: 0.85rem; font-weight: 600;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3); z-index: 99990; cursor: pointer;
            transition: all 0.3s ease; opacity: 0; pointer-events: none; transform: translateY(20px);
        }
        .conversion-popup-trigger.visible {
            opacity: 1; pointer-events: auto; transform: translateY(0);
        }
        .conversion-popup-trigger:hover {
            box-shadow: 0 6px 25px rgba(59, 130, 246, 0.5); transform: translateY(-3px);
        }
        @media (max-width: 768px) {
            .conversion-popup-trigger { bottom: 85px; left: 16px; padding: 10px 16px; font-size: 0.75rem; }
        }
    `;
    document.head.appendChild(style);

    // Visibility handlers
    const showPopup = () => {
        overlay.classList.add('active');
        triggerBtn.classList.remove('visible');
    };

    const closePopup = () => {
        overlay.classList.remove('active');
        triggerBtn.classList.add('visible');
        localStorage.setItem('stratads_popup_seen', 'true');
    };

    // Event listeners
    triggerBtn.addEventListener('click', showPopup);
    overlay.querySelector('.conversion-popup-close').addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePopup();
    });
    popup.querySelector('.conversion-popup-btn').addEventListener('click', closePopup);

    // Initial logic check
    if (localStorage.getItem('stratads_popup_seen') === 'true') {
        triggerBtn.classList.add('visible');
    } else {
        setTimeout(showPopup, 3000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConversionPopup);
} else {
    initConversionPopup();
}
