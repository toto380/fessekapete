/* ============================================================
   STRATADS — IMMERSIVE THREE.JS SCENE v2
   Cosmic Warp Tunnel + Nebula Clouds + Soft Light Streaks
   No wireframe objects — pure particle/light atmosphere
   Fixed fullscreen canvas, content scrolls over it
   ============================================================ */

(function() {
    'use strict';

    const CONFIG = {
        STAR_COUNT: 5000,
        NEBULA_COUNT: 800,
        STREAK_COUNT: 40,
        MOUSE_SENSITIVITY: 0.00012,
        COLORS: {
            deepBlue: 0x1E40AF,
            brightBlue: 0x3B82F6,
            purple: 0x7C3AED,
            cyan: 0x06B6D4,
        }
    };

    // ── SCENE ──
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020408, 0.00028);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('three-canvas'),
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020408, 1);

    // ── INPUT ──
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

    // ── STARFIELD (Warp tunnel) ──
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(CONFIG.STAR_COUNT * 3);
    const starSizes = new Float32Array(CONFIG.STAR_COUNT);
    const starSpeeds = new Float32Array(CONFIG.STAR_COUNT);
    const starColors = new Float32Array(CONFIG.STAR_COUNT * 3);

    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.5 + Math.random() * 90;
        starPositions[i3]     = Math.cos(angle) * radius;
        starPositions[i3 + 1] = Math.sin(angle) * radius;
        starPositions[i3 + 2] = -Math.random() * 1600;
        starSizes[i] = 0.4 + Math.random() * 2.8;
        starSpeeds[i] = 0.4 + Math.random() * 2.2;

        const c = Math.random();
        if (c < 0.55) {
            starColors[i3] = 0.92; starColors[i3+1] = 0.95; starColors[i3+2] = 1.0;
        } else if (c < 0.78) {
            starColors[i3] = 0.24; starColors[i3+1] = 0.51; starColors[i3+2] = 0.96;
        } else {
            starColors[i3] = 0.49; starColors[i3+1] = 0.23; starColors[i3+2] = 0.93;
        }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uPixelRatio;

            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float dist = length(mvPosition.xyz);
                vAlpha = smoothstep(900.0, 40.0, dist);
                gl_PointSize = size * uPixelRatio * (150.0 / -mvPosition.z);
                gl_PointSize = max(gl_PointSize, 0.5);
                gl_Position = projectionMatrix * mvPosition;
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

    scene.add(new THREE.Points(starGeometry, starMaterial));

    // ── NEBULA CLOUDS (Volumetric, denser) ──
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaPositions = new Float32Array(CONFIG.NEBULA_COUNT * 3);
    const nebulaSizes = new Float32Array(CONFIG.NEBULA_COUNT);
    const nebulaColors = new Float32Array(CONFIG.NEBULA_COUNT * 3);

    for (let i = 0; i < CONFIG.NEBULA_COUNT; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const radius = 8 + Math.random() * 130;
        nebulaPositions[i3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * 50;
        nebulaPositions[i3 + 1] = Math.sin(angle) * radius + (Math.random() - 0.5) * 50;
        nebulaPositions[i3 + 2] = -40 - Math.random() * 1400;
        nebulaSizes[i] = 20 + Math.random() * 60;

        const c = Math.random();
        if (c < 0.35) {
            nebulaColors[i3] = 0.1; nebulaColors[i3+1] = 0.22; nebulaColors[i3+2] = 0.72;
        } else if (c < 0.6) {
            nebulaColors[i3] = 0.28; nebulaColors[i3+1] = 0.12; nebulaColors[i3+2] = 0.6;
        } else if (c < 0.8) {
            nebulaColors[i3] = 0.02; nebulaColors[i3+1] = 0.4; nebulaColors[i3+2] = 0.55;
        } else {
            nebulaColors[i3] = 0.15; nebulaColors[i3+1] = 0.08; nebulaColors[i3+2] = 0.45;
        }
    }

    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(nebulaSizes, 1));
    nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));

    const nebulaMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uTime;
            uniform float uPixelRatio;

            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float breathe = 1.0 + sin(uTime * 0.2 + position.x * 0.01) * 0.15;
                vAlpha = smoothstep(1100.0, 80.0, length(mvPosition.xyz)) * 0.18 * breathe;
                gl_PointSize = size * uPixelRatio * (220.0 / -mvPosition.z) * breathe;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float glow = exp(-d * 2.5) * 0.55;
                gl_FragColor = vec4(vColor, glow * vAlpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    scene.add(new THREE.Points(nebulaGeometry, nebulaMaterial));

    // ── SOFT LIGHT STREAKS (organic data-flow lines) ──
    const streaks = [];
    for (let i = 0; i < CONFIG.STREAK_COUNT; i++) {
        const points = [];
        const startAngle = Math.random() * Math.PI * 2;
        const radius = 25 + Math.random() * 90;
        const zStart = -Math.random() * 500;
        const segs = 40;
        const curve = 0.3 + Math.random() * 0.8;
        for (let j = 0; j < segs; j++) {
            const t = j / segs;
            points.push(new THREE.Vector3(
                Math.cos(startAngle + t * curve) * radius * (1 - t * 0.4),
                Math.sin(startAngle + t * curve) * radius * (1 - t * 0.4),
                zStart + t * 250
            ));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const c = Math.random();
        const color = c < 0.5 ? CONFIG.COLORS.brightBlue : c < 0.8 ? CONFIG.COLORS.purple : CONFIG.COLORS.cyan;
        const mat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.015 + Math.random() * 0.025,
        });
        const line = new THREE.Line(geo, mat);
        line.userData = {
            speed: 0.0005 + Math.random() * 0.002,
            baseOpacity: mat.opacity,
            phase: Math.random() * Math.PI * 2,
        };
        scene.add(line);
        streaks.push(line);
    }

    // ── ANIMATION ──
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        mouseX += (targetMouseX - mouseX) * 0.035;
        mouseY += (targetMouseY - mouseY) * 0.035;

        // Camera parallax + gentle sway
        camera.position.x = mouseX * 18;
        camera.position.y = -mouseY * 18;
        camera.rotation.x = mouseY * 0.25;
        camera.rotation.y = -mouseX * 0.25;
        camera.rotation.z = Math.sin(elapsed * 0.08) * 0.015;

        starMaterial.uniforms.uTime.value = elapsed;
        nebulaMaterial.uniforms.uTime.value = elapsed;

        // Warp stars
        const positions = starGeometry.attributes.position.array;
        const warp = 1 + scrollProgress * 3.5;
        for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
            const i3 = i * 3;
            positions[i3 + 2] += starSpeeds[i] * warp;
            if (positions[i3 + 2] > 10) {
                positions[i3 + 2] = -1600;
                const angle = Math.random() * Math.PI * 2;
                const r = 1.5 + Math.random() * 90;
                positions[i3] = Math.cos(angle) * r;
                positions[i3 + 1] = Math.sin(angle) * r;
            }
        }
        starGeometry.attributes.position.needsUpdate = true;

        // Move nebula
        const nPos = nebulaGeometry.attributes.position.array;
        for (let i = 0; i < CONFIG.NEBULA_COUNT; i++) {
            const i3 = i * 3;
            nPos[i3 + 2] += 0.12 * warp;
            if (nPos[i3 + 2] > 10) nPos[i3 + 2] = -1400;
        }
        nebulaGeometry.attributes.position.needsUpdate = true;

        // Animate streaks (breathing opacity + slow rotation)
        streaks.forEach((s) => {
            s.rotation.z += s.userData.speed;
            s.material.opacity = s.userData.baseOpacity * (0.7 + 0.3 * Math.sin(elapsed * 0.4 + s.userData.phase));
        });

        renderer.render(scene, camera);
    }

    animate();

    // ── RESIZE ──
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        starMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        nebulaMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    });

    // ── SCROLL REVEAL ──
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealElements.forEach((el) => revealObserver.observe(el));

    // ── HEADER SCROLL ──
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 80);
        });
    }

})();
