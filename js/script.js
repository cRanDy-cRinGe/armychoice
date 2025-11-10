document.addEventListener('DOMContentLoaded', () => {

    // ==== НОВИЙ КОД: Запуск фону Hero (PixelBlast) ====
    const heroBackgroundContainer = document.getElementById('pixel-blast-background');
    if (heroBackgroundContainer) {

        // Отримуємо колір з твоїх CSS-змінних
        const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--sandstone').trim();

        new PixelBlastEffect(heroBackgroundContainer, {
            variant: "circle",
            pixelSize: 6,
            color: themeColor, // Використовуємо колір з твого CSS
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
    // ==== Керування мобільним меню ====
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    menuButton.addEventListener('click', () => {
        // Перемикаємо клас 'hidden', який контролює відображення
        mobileMenu.classList.toggle('hidden');
    });

    // ==== Плавний скрол та закриття мобільного меню ====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }

            // Закриваємо мобільне меню, якщо воно відкрите
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // ==== Слайдер для відгуків (Історії) ====
    const track = document.querySelector('.slider-track');

    // Перевірка, чи слайдер існує на сторінці
    if (track) {
        const slides = Array.from(track.children);
        const dotsContainer = document.querySelector('.slider-dots');
        const dots = Array.from(dotsContainer.children);
        let currentSlide = 0;
        let slideInterval;

        function showSlide(index) {
            if (!track || !slides.length || !dots.length) return;

            // Зсуваємо трек
            track.style.transform = `translateX(-${index * 100}%)`;

            // Оновлюємо активну крапку
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });

            currentSlide = index;
        }

        // Автоматичне перемикання
        function startSlideShow() {
            stopSlideShow(); // Зупиняємо попередній, щоб уникнути дублювання
            slideInterval = setInterval(() => {
                const nextSlide = (currentSlide + 1) % slides.length;
                showSlide(nextSlide);
            }, 5000); // Кожні 5 секунд
        }

        function stopSlideShow() {
            clearInterval(slideInterval);
        }

        // Керування крапками
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                startSlideShow(); // Перезапускаємо таймер при ручному виборі
            });
        });

        // Ініціалізація
        if (slides.length > 0) {
            showSlide(0);
            startSlideShow();

            // Пауза при наведенні
            track.addEventListener('mouseenter', stopSlideShow);
            track.addEventListener('mouseleave', startSlideShow);
        }
    }

    // ==== Функціонал Gemini API (Військовий рекрутер) ====
    const analyzeButton = document.getElementById('gemini-analyze-button');
    const messageInput = document.getElementById('message');
    const geminiLoading = document.getElementById('gemini-loading');
    const geminiResult = document.getElementById('gemini-result');
    const contactForm = document.getElementById('contact-form');

    // Натискання на кнопку "Проаналізувати"
    if (analyzeButton) { // Додамо перевірку, що кнопка існує
        analyzeButton.addEventListener('click', async () => {
            const userMessage = messageInput.value;

            if (userMessage.trim().length < 10) {
                geminiResult.innerHTML = '<p class="error-message">Будь ласка, опишіть ваші навички, досвід або бажану посаду детальніше (хоча б 10 символів).</p>';
                geminiResult.classList.remove('hidden');
                return;
            }

            geminiLoading.classList.remove('hidden');
            geminiResult.classList.add('hidden');
            geminiResult.innerHTML = '';

            try {
                const systemPrompt = "Ти — досвідчений військовий рекрутер для ЗСУ. Твоя мета — допомогти кандидатам. Прочитай опис навичок, досвіду або побажань кандидата. На основі цього, коротко (не більше 100 слів) запропонуй, які військові спеціальності (напр., Оператор БПЛА, Медик, Зв'язовець, Інженер, Логіст, Стрілець) йому, ймовірно, підійдуть, і запропонуй 2-3 ключові етапи для подачі заявки (напр., 'заповніть форму', 'пройдіть співбесіду', 'підготуйте документи'). Відповідай українською мовою. Твоя відповідь має бути чіткою, підбадьорливою та мотивуючою.";

                const responseText = await callGeminiAPI(userMessage, systemPrompt);

                // Форматуємо відповідь для HTML (замінюємо переноси рядків на <br>)
                const formattedResponse = responseText.replace(/\n/g, '<br>');

                geminiResult.innerHTML = `<h4 class="gemini-result-title">✨ Рекомендації по вакансіях:</h4><p>${formattedResponse}</p>`;

            } catch (error) {
                console.error("Gemini API call failed:", error);
                geminiResult.innerHTML = '<p class="error-message">Виникла помилка під час аналізу. Будь ласка, спробуйте ще раз або надішліть форму як є.</p>';

            } finally {
                geminiLoading.classList.add('hidden');
                geminiResult.classList.remove('hidden');
            }
        });
    }

    // Обробка відправки форми (симуляція)
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // У реальному проекті тут була б відправка даних
            alert('Заявка прийнята (симуляція)');
            // Очищення форми
            contactForm.reset();
            geminiResult.classList.add('hidden');
            geminiResult.innerHTML = '';
        });
    }


    // ==== Асинхронна функція для виклику Gemini API ====
    async function callGeminiAPI(userQuery, systemPrompt) {
        const apiKey = ""; // API ключ обробляється оточенням
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        let response;
        let retries = 3;
        let delay = 1000;

        for (let i = 0; i < retries; i++) {
            try {
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    const candidate = result.candidates?.[0];
                    if (candidate && candidate.content?.parts?.[0]?.text) {
                        return candidate.content.parts[0].text; // Успішна відповідь
                    } else {
                        throw new Error("Invalid response structure from API");
                    }
                } else if (response.status === 429 || response.status >= 500) {
                    // Обмеження запитів або помилка сервера, очікування та повторна спроба
                    if (i === retries - 1) throw new Error(`API error: ${response.statusText} after ${retries} attempts`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Експоненційне зростання затримки
                } else {
                    // Інша помилка клієнта
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                // Помилка мережі або інша, повторна спроба
                if (i === retries - 1) throw error; // Кидаємо помилку після останньої спроби
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
        // Цей код не мав би виконуватися, але на випадок
        throw new Error("API request failed after retries");
    }
});
// Зайву дужку } звідси видалено