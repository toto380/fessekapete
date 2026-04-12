/* ============================================================
   STRATADS — SUB-PAGE THREE.JS SCENE
   Deep space nebula + drifting stars + gentle parallax
   Same cosmic palette, lighter for sub-pages
   ============================================================ */

(function() {
    'use strict';

    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    const CONFIG = {
        STAR_COUNT: 3000,
        NEBULA_COUNT: 500,
        MOUSE_SENSITIVITY: 0.0001,
    };

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020408, 0.00025);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020408, 1);

    let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
    document.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX - window.innerWidth / 2) * CONFIG.MOUSE_SENSITIVITY;
        targetMouseY = (e.clientY - window.innerHeight / 2) * CONFIG.MOUSE_SENSITIVITY;
    });

    let scrollProgress = 0;
    window.addEventListener('scroll', () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    });

    // ── STARFIELD ──
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(CONFIG.STAR_COUNT * 3);
    const starSizes = new Float32Array(CONFIG.STAR_COUNT);
    const starSpeeds = new Float32Array(CONFIG.STAR_COUNT);
    const starColors = new Float32Array(CONFIG.STAR_COUNT * 3);

    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 120;
        starPos[i3]     = Math.cos(angle) * r;
        starPos[i3 + 1] = Math.sin(angle) * r;
        starPos[i3 + 2] = -Math.random() * 1400;
        starSizes[i] = 0.3 + Math.random() * 2.2;
        starSpeeds[i] = 0.15 + Math.random() * 0.6;

        const c = Math.random();
        if (c < 0.55) { starColors[i3] = 0.9; starColors[i3+1] = 0.94; starColors[i3+2] = 1.0; }
        else if (c < 0.78) { starColors[i3] = 0.24; starColors[i3+1] = 0.51; starColors[i3+2] = 0.96; }
        else { starColors[i3] = 0.49; starColors[i3+1] = 0.23; starColors[i3+2] = 0.93; }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.ShaderMaterial({
        uniforms: { uPixelRatio: { value: renderer.getPixelRatio() } },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uPixelRatio;
            void main() {
                vColor = color;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vAlpha = smoothstep(800.0, 40.0, length(mv.xyz));
                gl_PointSize = size * uPixelRatio * (120.0 / -mv.z);
                gl_PointSize = max(gl_PointSize, 0.5);
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float glow = exp(-d * 6.0);
                gl_FragColor = vec4(vColor, glow * vAlpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    scene.add(new THREE.Points(starGeo, starMat));

    // ── NEBULA ──
    const nebGeo = new THREE.BufferGeometry();
    const nebPos = new Float32Array(CONFIG.NEBULA_COUNT * 3);
    const nebSizes = new Float32Array(CONFIG.NEBULA_COUNT);
    const nebColors = new Float32Array(CONFIG.NEBULA_COUNT * 3);

    for (let i = 0; i < CONFIG.NEBULA_COUNT; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const r = 10 + Math.random() * 140;
        nebPos[i3]     = Math.cos(angle) * r + (Math.random() - 0.5) * 50;
        nebPos[i3 + 1] = Math.sin(angle) * r + (Math.random() - 0.5) * 50;
        nebPos[i3 + 2] = -30 - Math.random() * 1200;
        nebSizes[i] = 20 + Math.random() * 55;

        const c = Math.random();
        if (c < 0.35) { nebColors[i3] = 0.1; nebColors[i3+1] = 0.2; nebColors[i3+2] = 0.7; }
        else if (c < 0.6) { nebColors[i3] = 0.25; nebColors[i3+1] = 0.1; nebColors[i3+2] = 0.55; }
        else if (c < 0.8) { nebColors[i3] = 0.02; nebColors[i3+1] = 0.35; nebColors[i3+2] = 0.5; }
        else { nebColors[i3] = 0.12; nebColors[i3+1] = 0.06; nebColors[i3+2] = 0.4; }
    }

    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    nebGeo.setAttribute('size', new THREE.BufferAttribute(nebSizes, 1));
    nebGeo.setAttribute('color', new THREE.BufferAttribute(nebColors, 3));

    const nebMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uTime;
            uniform float uPixelRatio;
            void main() {
                vColor = color;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                float breathe = 1.0 + sin(uTime * 0.15 + position.x * 0.008) * 0.12;
                vAlpha = smoothstep(1000.0, 80.0, length(mv.xyz)) * 0.16 * breathe;
                gl_PointSize = size * uPixelRatio * (200.0 / -mv.z) * breathe;
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float glow = exp(-d * 2.5) * 0.5;
                gl_FragColor = vec4(vColor, glow * vAlpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    scene.add(new THREE.Points(nebGeo, nebMat));

    // ── ANIMATE ──
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        mouseX += (targetMouseX - mouseX) * 0.03;
        mouseY += (targetMouseY - mouseY) * 0.03;

        camera.position.x = mouseX * 12;
        camera.position.y = -mouseY * 12;
        camera.rotation.x = mouseY * 0.2;
        camera.rotation.y = -mouseX * 0.2;
        camera.rotation.z = Math.sin(elapsed * 0.06) * 0.01;

        nebMat.uniforms.uTime.value = elapsed;

        // Gentle star drift
        const positions = starGeo.attributes.position.array;
        const drift = 1 + scrollProgress * 1.5;
        for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
            const i3 = i * 3;
            positions[i3 + 2] += starSpeeds[i] * drift;
            if (positions[i3 + 2] > 10) {
                positions[i3 + 2] = -1400;
                const a = Math.random() * Math.PI * 2;
                const r = 3 + Math.random() * 120;
                positions[i3] = Math.cos(a) * r;
                positions[i3 + 1] = Math.sin(a) * r;
            }
        }
        starGeo.attributes.position.needsUpdate = true;

        // Nebula drift
        const nPos = nebGeo.attributes.position.array;
        for (let i = 0; i < CONFIG.NEBULA_COUNT; i++) {
            const i3 = i * 3;
            nPos[i3 + 2] += 0.08 * drift;
            if (nPos[i3 + 2] > 10) nPos[i3 + 2] = -1200;
        }
        nebGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    // ── RESIZE ──
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        starMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        nebMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    });

    // ── SCROLL REVEAL ──
    const revealEls = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach((el) => revealObs.observe(el));

    // ── HEADER SCROLL ──
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 80);
        });
    }

})();
