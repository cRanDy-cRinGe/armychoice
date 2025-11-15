document.addEventListener('DOMContentLoaded', () => {
    /* =========================
       Helpers
    ==========================*/
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const navbar = $('.navbar');
    const navHeight = () => (navbar ? navbar.getBoundingClientRect().height : 0);

    /* =========================
       Mobile Menu (animated)
       HTML expects:
       - #mobile-menu-button
       - #mobile-menu
       CSS already provides .hidden (display:none)
    ==========================*/
    const menuBtn = $('#mobile-menu-button');
    const mobileMenu = $('#mobile-menu');
    

    // Small utility to play WAAPI animation with graceful fallback
    const playAnim = (el, keyframes, opts) => {
        if (!el) return { finished: Promise.resolve() };
        if (el.animate) {
            const a = el.animate(keyframes, opts);
            return a;
        }
        // Fallback: no animation API → do nothing
        return { finished: Promise.resolve() };
    };

    const openMenu = () => {
        if (!mobileMenu) return;
        // показуємо
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('open');          // ← додано
        document.body.classList.add('menu-open');
        menuBtn?.classList.add('is-open');
        menuBtn?.setAttribute('aria-expanded', 'true');

        // анімація появи
        mobileMenu.style.willChange = 'transform, opacity';
        playAnim(
            mobileMenu,
            [
                { transform: 'translateY(-16px)', opacity: 0 },
                { transform: 'translateY(0)', opacity: 1 }
            ],
            { duration: 280, easing: 'ease' }
        ).finished.finally(() => {
            mobileMenu.style.willChange = '';
        });
    };

    const closeMenu = () => {
        if (!mobileMenu) return;
        // анімація зникнення
        mobileMenu.style.willChange = 'transform, opacity';
        playAnim(
            mobileMenu,
            [
                { transform: 'translateY(0)', opacity: 1 },
                { transform: 'translateY(-16px)', opacity: 0 }
            ],
            { duration: 220, easing: 'ease' }
        ).finished.finally(() => {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('open');     // ← додано
            document.body.classList.remove('menu-open');
            menuBtn?.classList.remove('is-open');
            menuBtn?.setAttribute('aria-expanded', 'false');
            mobileMenu.style.willChange = '';
        });
    };


    const toggleMenu = () => {
        if (!mobileMenu) return;
        const isOpen = !mobileMenu.classList.contains('hidden');
        isOpen ? closeMenu() : openMenu();
    };

    // Init menu
    if (mobileMenu) {
        mobileMenu.classList.add('hidden'); // гарантовано сховано на старті
    }
    menuBtn?.addEventListener('click', toggleMenu);

    // Close on Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu && !mobileMenu.classList.contains('hidden')) {
            closeMenu();
        }
    });

    // Close when clicking outside panel (only if open)
    document.addEventListener('click', (e) => {
        if (!mobileMenu || mobileMenu.classList.contains('hidden')) return;
        const clickedInside = mobileMenu.contains(e.target) || menuBtn?.contains(e.target);
        if (!clickedInside) closeMenu();
    });

    // Close after clicking anchor inside menu
    if (mobileMenu) {
        $$('a[href^="#"]', mobileMenu).forEach((a) => {
            a.addEventListener('click', () => closeMenu());
        });
    }

    /* =========================
       Smooth anchor scroll (desktop & mobile)
       — компенсуємо висоту sticky-навігації
    ==========================*/
    $$('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.getElementById(href.slice(1));
            if (!target) return;

            e.preventDefault();
            const top = window.scrollY + target.getBoundingClientRect().top - navHeight() - 8;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
    const closeBtn = $('#close-menu-button');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();   // щоб не зловив «клік поза меню»
            closeMenu();
        });
    }

    /* =========================
       Hero background effect (guarded)
       — у твоєму попередньому коді викликалась PixelBlastEffect.
         Тепер не падаємо, якщо бібліотеки немає.
    ==========================*/
    const heroBg = $('#pixel-blast-background');
    try {
        if (heroBg && typeof PixelBlastEffect === 'function') {
            const themeColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--sandstone').trim();
            new PixelBlastEffect(heroBg, {
                variant: "circle",
                pixelSize: 6,
                color: themeColor,
                patternScale: 3,
                patternDensity: 1.2,
                pixelSizeJitter: 0.5,
                enableRipples: true,
                rippleSpeed: 0.4,
                rippleThickness: 0.12,
                rippleIntensityScale: 1.5,
                liquid: true,
                liquidStrength: 0.12,
                liquidRadius: 1.2,
                liquidWobbleSpeed: 5,
                speed: 0.6,
                edgeFade: 0.25,
                transparent: true
            });
        }
    } catch (_) {
        // Тихо ігноруємо, щоб нічого не зламати
    }

    /* =========================
       Optional slider (історії/відгуки)
       — безпечні перевірки: якщо елементів немає, просто пропускаємо
    ==========================*/
    const track = $('.slider-track');
    if (track) {
        const slides = Array.from(track.children);
        const dotsContainer = $('.slider-dots');
        const dots = dotsContainer ? Array.from(dotsContainer.children) : [];
        let current = 0;
        let timer;

        const show = (i) => {
            if (!slides.length) return;
            const idx = (i + slides.length) % slides.length;
            track.style.transform = `translateX(-${idx * 100}%)`;
            dots.forEach((d, j) => d.classList.toggle('active', j === idx));
            current = idx;
        };
        const start = () => { stop(); timer = setInterval(() => show(current + 1), 5000); };
        const stop  = () => { if (timer) clearInterval(timer); };

        dots.forEach((d, i) => d.addEventListener('click', () => { show(i); start(); }));
        if (slides.length) { show(0); start(); }

        track.addEventListener('mouseenter', stop);
        track.addEventListener('mouseleave', start);
    }

    /* =========================
       Gemini helper (robust)
       — працює навіть без елементів loading/result
    ==========================*/
    const analyzeBtn   = document.getElementById('gemini-analyze-button');
    const messageInput = document.getElementById('message');
    const gemLoading   = document.getElementById('gemini-loading');
    const gemResult    = document.getElementById('gemini-result');
    const contactForm  = document.getElementById('contact-form');

    const showEl = (el) => el && el.classList && el.classList.remove('hidden');
    const hideEl = (el) => el && el.classList && el.classList.add('hidden');

    const callGeminiAPI = async (userText, systemPrompt) => {
        // Якщо ключ не заданий — повертаємо коротку «локальну» відповідь,
        // щоб інтерфейс працював і не падав
        const apiKey = ""; // додай свій ключ сюди при потребі
        if (!apiKey) {
            return [
                "Враховуючи ваш опис, ймовірно підійдуть спеціальності: Оператор БПЛА, Зв’язківець, Логіст.",
                "Наступні кроки: 1) заповніть форму заявки; 2) пройдіть співбесіду з рекрутером; 3) підготуйте документи для ВЛК."
            ].join("\n");
        }

        // Якщо ключ є — спробуємо справжній виклик
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: userText }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };

        for (let i = 0, delay = 800; i < 3; i++, delay *= 2) {
            try {
                const r = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (r.ok) {
                    const data = await r.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) return text;
                    throw new Error("Invalid response structure");
                }
                if (r.status === 429 || r.status >= 500) {
                    await new Promise(res => setTimeout(res, delay));
                    continue;
                }
                throw new Error(`API error: ${r.status} ${r.statusText}`);
            } catch (err) {
                if (i === 2) throw err;
                await new Promise(res => setTimeout(res, delay));
            }
        }
        throw new Error("API request failed");
    };

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const text = (messageInput?.value ?? "").trim();
            if (text.length < 10) {
                if (gemResult) {
                    gemResult.innerHTML = '<p class="error-message">Опишіть навички/досвід трохи детальніше (мінімум 10 символів).</p>';
                    showEl(gemResult);
                } else {
                    alert('Опишіть навички/досвід трохи детальніше (мінімум 10 символів).');
                }
                return;
            }

            hideEl(gemResult);
            showEl(gemLoading);

            const systemPrompt =
                "Ти — досвідчений військовий рекрутер для ЗСУ. " +
                "На основі опису кандидата коротко (до 100 слів) запропонуй 2–3 імовірні спеціальності " +
                "та 2–3 наступні кроки (подати заявку, співбесіда, підготувати документи). " +
                "Відповідай українською, чітко та підтримуюче.";

            try {
                const resp = await callGeminiAPI(text, systemPrompt);
                const html = resp.replace(/\n/g, '<br>');
                if (gemResult) {
                    gemResult.innerHTML = `<h4 class="gemini-result-title">✨ Рекомендації:</h4><p>${html}</p>`;
                    showEl(gemResult);
                } else {
                    alert(resp);
                }
            } catch (e) {
                if (gemResult) {
                    gemResult.innerHTML = '<p class="error-message">Сталася помилка під час аналізу. Спробуйте пізніше або просто надішліть форму.</p>';
                    showEl(gemResult);
                } else {
                    alert('Сталася помилка під час аналізу. Спробуйте пізніше або просто надішліть форму.');
                }
            } finally {
                hideEl(gemLoading);
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Заявка прийнята (симуляція). Дякуємо!');
            contactForm.reset();
            hideEl(gemResult);
            if (gemResult) gemResult.innerHTML = '';
        });
    }
});
(() => {
    const slider   = document.querySelector('.testi-slider');
    if (!slider) return;

    const viewport = slider.querySelector('.viewport');
    const track    = slider.querySelector('.track');
    const prevBtn  = slider.querySelector('.nav.prev');
    const nextBtn  = slider.querySelector('.nav.next');
    const dotsWrap = slider.querySelector('.dots');
    viewport.style.touchAction = 'pan-y';

    // Вихідні слайди
    let baseSlides = Array.from(track.querySelectorAll('.slide'));

    // Стан
    let perView = 3;
    let gap = 24;
    let slideW = 0;
    let index = 0;
    let allow = true;

    // ---- доп. функція: взяти ширину картки з CSS-перемінної ----
    function readSlideWidth(){
        const cssVal = getComputedStyle(slider).getPropertyValue('--card-w').trim();
        if (cssVal.endsWith('px')) {
            const num = parseFloat(cssVal);
            if (!Number.isNaN(num)) return num;
        }
        const first = track.querySelector('.slide');
        return first ? first.getBoundingClientRect().width : 320;
    }

    // === Однакова висота карток ==================================
    function normalizeHeights(){
        track.querySelectorAll('.card').forEach(c => c.style.height = 'auto');

        const cards = Array.from(track.children)
            .filter(n => !n.classList.contains('clone'))
            .map(n => n.querySelector('.card'));

        const maxH = Math.max(...cards.map(c => c.offsetHeight));
        slider.style.setProperty('--card-h', maxH + 'px');
        track.querySelectorAll('.card').forEach(c => c.style.height = 'var(--card-h)');
    }

    // Клонування країв
    function buildClones(){
        track.querySelectorAll('.slide.clone').forEach(n => n.remove());

        const head = baseSlides.slice(0, perView);
        const tail = baseSlides.slice(-perView);

        tail.forEach(s => {
            const c = s.cloneNode(true);
            c.classList.add('clone');
            track.insertBefore(c, track.firstChild);
        });
        head.forEach(s => {
            const c = s.cloneNode(true);
            c.classList.add('clone');
            track.appendChild(c);
        });
    }

    // Розрахунок к-сті карток на екрані з фіксованою шириною
    function computePerView(){
        slideW = readSlideWidth();
        const w = viewport.clientWidth;
        const count = Math.floor((w + gap) / (slideW + gap));
        return Math.max(1, count);
    }

    // Встановити ширини (просто фіксована ширина для всіх)
    function setWidths(){
        slideW = readSlideWidth();
        track.querySelectorAll('.slide').forEach(s => {
            s.style.flex = `0 0 ${slideW}px`;
        });
        track.style.gap = gap + 'px';
    }

    // Поточне зсування треку
    function currentOffset(){
        const clonesLeft = perView;
        return -((clonesLeft + index) * (slideW + gap));
    }

    // Миттєвий стрибок без анімації
    function jumpNoAnim(newIndex){
        track.style.transition = 'none';
        index = newIndex;
        track.style.transform = `translate3d(${currentOffset()}px,0,0)`;
        void track.offsetHeight;
        track.style.transition = 'transform .5s ease-in-out';
    }

    // Крок на 1 слайд
    function go(dir){
        if (!allow) return;
        allow = false;
        index += dir;
        track.style.transform = `translate3d(${currentOffset()}px,0,0)`;
    }

    // Dots
    function buildDots(){
        dotsWrap.innerHTML = '';
        baseSlides.forEach((_, i) => {
            const b = document.createElement('button');
            b.setAttribute('aria-label', `Перейти до слайду ${i+1}`);
            b.addEventListener('click', () => { jumpNoAnim(i); setActiveDot(i); });
            dotsWrap.appendChild(b);
        });
    }
    function setActiveDot(i){
        const len = baseSlides.length;
        const idx = ((i % len) + len) % len;
        dotsWrap.querySelectorAll('button').forEach((d, k) => {
            d.classList.toggle('active', k === idx);
        });
    }

    // Повна перебудова
    function rebuild(){
        // перечитати базові слайди
        baseSlides = Array.from(track.querySelectorAll('.slide')).filter(n => !n.classList.contains('clone'));

        perView = computePerView();   // скільки карток влазить по ширині
        buildClones();
        setWidths();
        jumpNoAnim(0);
        buildDots();
        setActiveDot(0);
        normalizeHeights();
    }

    // Події
    track.addEventListener('transitionend', () => {
        const len = baseSlides.length;
        if (index >= len){ jumpNoAnim(index - len); }
        if (index < 0){   jumpNoAnim(index + len); }
        setActiveDot(index);
        allow = true;
    });

    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(+1));

    slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') go(+1);
        if (e.key === 'ArrowLeft')  go(-1);
    });
    slider.setAttribute('tabindex','0');

    // Drag / swipe
    let startX = 0, dragging = false, startTx = 0;
    viewport.addEventListener('pointerdown', (e) => {
        dragging = true; startX = e.clientX; startTx = currentOffset();
        track.style.transition = 'none';
        viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        track.style.transform = `translate3d(${startTx + dx}px,0,0)`;
    });
    const endDrag = (e) => {
        if (!dragging) return; dragging = false;
        const dx = e.clientX - startX;
        track.style.transition = 'transform .5s ease-in-out';
        const threshold = Math.max(40, slideW * 0.18);
        if (dx <= -threshold) go(+1);
        else if (dx >= threshold) go(-1);
        else track.style.transform = `translate3d(${currentOffset()}px,0,0)`;
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('pointerleave', endDrag);

    // Ресайз та картинки
    window.addEventListener('resize', rebuild);
    slider.querySelectorAll('img').forEach(img => {
        if (!img.complete) img.addEventListener('load', normalizeHeights);
    });

    // Старт
    rebuild();
    setTimeout(normalizeHeights, 0);
})();

(() => {
    const sec = document.querySelector('.compare.neo');
    if (!sec) return;

    // простий спостерігач: коли секція у вʼюпорті — додаємо .in-view
    const io = new IntersectionObserver(([e])=>{
        if (e.isIntersecting){ sec.classList.add('in-view'); io.disconnect(); }
    }, { root:null, threshold:.18 });
    io.observe(sec);

    // виставляємо індекси для "стагера"
    sec.querySelectorAll('.compare-col').forEach(col=>{
        col.querySelectorAll('.compare-item').forEach((li,i)=> li.style.setProperty('--i', i));
    });
})();

(() => {
    const section = document.getElementById('path');
    const list    = document.getElementById('pathSteps');
    if (!section || !list) return;

    const steps = Array.from(list.querySelectorAll('.step'));
    if (!steps.length) return;

    // ==== налаштування ====
    const HEADER_OFFSET = 0;    // якщо є фіксований хедер — вкажи його висоту (px)
    const AUTO_MS = 520;        // тривалість автоскролу (мс)
    const EDGE_FREE = 24;       // зона на краях секції, де НЕ перехоплюємо колесо (px)
    const SWIPE_MIN = 30;       // мін. вертикальний рух для свайпа (px)

    // ==== утиліти ====
    const docY = () => window.scrollY || window.pageYOffset || 0;
    const vwH  = () => window.innerHeight || document.documentElement.clientHeight;

    const absTop = (el) => {
        let y = 0, n = el;
        while (n) { y += n.offsetTop; n = n.offsetParent; }
        return y;
    };

    const secTop    = () => absTop(section);
    const secBottom = () => secTop() + section.offsetHeight;

    const inSectionViewport = () => {
        const top = secTop(), bot = secBottom();
        const vTop = docY(), vBot = vTop + vwH();
        return bot > vTop && top < vBot;
    };

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const stepCenterY = (el) => absTop(el) + el.offsetHeight/2;

    const viewportMidY = () => docY() + vwH()/2 - HEADER_OFFSET/2;

    const pickNearest = () => {
        const mid = viewportMidY();
        let best = Infinity, bestEl = steps[0];
        for (const s of steps){
            const d = Math.abs(stepCenterY(s) - mid);
            if (d < best){ best = d; bestEl = s; }
        }
        return bestEl;
    };

    const indexOfStep = (el) => steps.indexOf(el);

    const setActive = (el) => {
        if (!el) return;
        if (el.classList.contains('is-active')) return;
        steps.forEach(s => s.classList.remove('is-active'));
        el.classList.add('is-active');
    };

    const scrollToStep = (el) => {
        if (!el) return;
        const target = stepCenterY(el) - vwH()/2 - HEADER_OFFSET/2;
        const maxY = Math.max(0, document.documentElement.scrollHeight - vwH());
        const top  = clamp(target, 0, maxY);
        isAuto = true;
        window.scrollTo({ top, behavior: 'smooth' });
        clearTimeout(autoTimer);
        autoTimer = setTimeout(() => { isAuto = false; }, AUTO_MS);
    };

    // присвоїмо стабільні id/ data-idx (як просив)
    steps.forEach((s, i) => {
        if (!s.id) s.id = `path-step-${i+1}`;
        s.dataset.idx = String(i);
    });

    // ==== керування ====
    let isAuto = false;
    let autoTimer = null;
    let tick = false;

    // активуємо найближчий під час скролу/ресайзу (без автоскролу)
    const onScrollPassive = () => {
        if (!inSectionViewport()) return;
        if (tick) return;
        tick = true;
        requestAnimationFrame(() => {
            const nearest = pickNearest();
            setActive(nearest);
            tick = false;
        });
    };

    // «крокай» до сусіднього етапу (+1/-1)
    const stepBy = (dir) => {
        const current = pickNearest();
        let idx = indexOfStep(current);
        const nextIdx = clamp(idx + dir, 0, steps.length - 1);
        if (nextIdx === idx) return false;
        scrollToStep(steps[nextIdx]);
        return true;
    };

    // чи ми на краях секції (даємо вийти вгору/вниз)
    const atTopEdge = () => docY() <= secTop() + EDGE_FREE;
    const atBotEdge = () => docY() + vwH() >= secBottom() - EDGE_FREE;

    // перехоплюємо колесо тільки всередині секції
    const onWheel = (e) => {
        if (!inSectionViewport()) return;       // поза секцією — нічого не чіпаємо
        if (isAuto) { e.preventDefault(); return; }

        const dy = e.deltaY;
        if (dy > 0) {
            // вниз
            if (atBotEdge()) return;             // дати піти нижче секції
            e.preventDefault();
            stepBy(+1);
        } else if (dy < 0) {
            // вгору
            if (atTopEdge()) return;             // дати вийти вище секції
            e.preventDefault();
            stepBy(-1);
        }
    };

    // тач-свайпи
    let touchStartY = null;
    const onTouchStart = (e) => { if (!inSectionViewport()) return; touchStartY = e.touches[0].clientY; };
    const onTouchEnd   = (e) => {
        if (!inSectionViewport() || touchStartY == null || isAuto) { touchStartY = null; return; }
        const endY = (e.changedTouches && e.changedTouches[0]?.clientY) ?? null;
        if (endY == null) { touchStartY = null; return; }
        const dy = endY - touchStartY;
        if (Math.abs(dy) < SWIPE_MIN) { touchStartY = null; return; }

        if (dy < 0) { // свайп вгору => рух вниз
            if (!atBotEdge()) stepBy(+1);
        } else {      // свайп вниз => рух вгору
            if (!atTopEdge()) stepBy(-1);
        }
        touchStartY = null;
    };

    // клавіатура
    const onKey = (e) => {
        if (!inSectionViewport()) return;
        if (isAuto) { e.preventDefault(); return; }
        if (['ArrowDown','PageDown',' '].includes(e.key)) {
            if (atBotEdge()) return; e.preventDefault(); stepBy(+1);
        } else if (['ArrowUp','PageUp'].includes(e.key)) {
            if (atTopEdge()) return; e.preventDefault(); stepBy(-1);
        }
    };

    // перший захід у секцію — підхопити найближчий і «пригвинтити» до центру м’яко
    let entered = false;
    const onScrollEnterCheck = () => {
        if (!entered && inSectionViewport()) {
            entered = true;
            const target = pickNearest();
            setActive(target);
            scrollToStep(target);
        }
    };

    // слухачі
    window.addEventListener('scroll', onScrollPassive, { passive: true });
    window.addEventListener('scroll', onScrollEnterCheck, { passive: true });
    window.addEventListener('resize', onScrollPassive, { passive: true });

    // важливо: колесо НЕ пасивне — щоб можна було preventDefault
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);

    // старт
    setActive(pickNearest());
    // невеличка пауза, щоб шрифти/висоти устаканились
    setTimeout(() => { onScrollEnterCheck(); onScrollPassive(); }, 0);
})();