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
