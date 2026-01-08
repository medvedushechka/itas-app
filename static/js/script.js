// ===== MOBILE MENU FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');

    // Открытие мобильного меню
    function openMobileMenu() {
        mobileNav.classList.add('active');
        mobileOverlay.classList.add('active');
        mobileMenuBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Закрытие мобильного меню
    function closeMobileMenu() {
        mobileNav.classList.remove('active');
        mobileOverlay.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }

    // События для кнопок меню
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileMenu);
    }

    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', closeMobileMenu);
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    // Закрытие меню при клике на ссылку (ИЗМЕНЕНО: не закрываем меню)
    const mobileLinks = document.querySelectorAll('.mobile-nav a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Не закрываем меню при клике на ссылку
            // closeMobileMenu(); - удалили эту строку
        });
    });

    // ===== SMOOTH SCROLL FOR NAVIGATION =====
    function initNavigation() {
        const navItems = document.querySelectorAll('.nav-item, .mobile-nav a');

        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();

                // Эффект клика для десктопных элементов
                if (this.classList.contains('nav-item')) {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 200);
                }

                // Определяем целевой раздел
                let targetId;
                const text = this.textContent.trim() || this.getAttribute('href');

                if (text.includes('О форуме') || text === '#about') {
                    targetId = 'about';
                } else if (text.includes('Спикеры') || text === '#speakers') {
                    targetId = 'speakers';
                } else if (text.includes('Партнёры') || text === '#partners') {
                    targetId = 'partners';
                } else if (text.includes('Программа') || text === '#program') {
                    targetId = 'program';
                } else if (text.includes('Контакты') || text === '#contacts') {
                    targetId = 'contacts';
                } else if (text.includes('Билеты') || text === '#tariffs') {
                    targetId = 'tariffs';
                } else if (text.includes('Аудитория') || text === '#audience') {
                    targetId = 'audience';
                }

                if (targetId) {
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        // Плавная прокрутка
                        targetSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });

                        // Подсветка секции
                        targetSection.style.boxShadow = '0 0 40px rgba(0, 170, 255, 0.6)';
                        targetSection.style.transition = 'box-shadow 0.5s ease';
                        setTimeout(() => {
                            targetSection.style.boxShadow = '';
                        }, 2000);
                    }
                }

                // Закрываем меню только на мобильных устройствах
                if (window.innerWidth <= 768) {
                    closeMobileMenu();
                }
            });
        });
    }

    // ===== ANIMATIONS ON SCROLL =====
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';

                    // Добавляем класс для анимации
                    if (entry.target.classList.contains('feature-card')) {
                        entry.target.classList.add('animated');
                    }
                    if (entry.target.classList.contains('speaker-card')) {
                        entry.target.classList.add('animated');
                    }
                }
            });
        }, observerOptions);

        // Наблюдаем за анимируемыми элементами
        const animatedElements = document.querySelectorAll(
            '.feature-card, .speaker-card, .tariff-card, .audience-card'
        );

        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // ===== COUNTER ANIMATION FOR STATS =====
    function initCounters() {
        const statNumbers = document.querySelectorAll('.stat-number');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stat = entry.target;
                    const target = parseInt(stat.textContent);
                    let current = 0;
                    const increment = target / 50;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            stat.textContent = target + '+';
                            clearInterval(timer);
                        } else {
                            stat.textContent = Math.floor(current) + '+';
                        }
                    }, 30);
                    observer.unobserve(stat);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => observer.observe(stat));
    }

    // ===== TARIFF & AUDIENCE BUTTONS INTERACTION =====
    function initButtonsInteractions() {
        const buttons = document.querySelectorAll('.tariff-btn, .audience-btn, .buy-ticket, .view-all-speakers, .partner-btn, .sponsor-btn');

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Создаём эффект частиц при клике
                const rect = this.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                createClickEffect(x, y);

                // Эффект нажатия кнопки
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);

                // Сообщение для пользователя
                if (this.classList.contains('tariff-btn') || this.classList.contains('buy-ticket')) {
                    alert('В реальном приложении здесь будет открыта форма покупки билетов.');
                } else if (this.classList.contains('audience-btn') || this.classList.contains('view-all-speakers')) {
                    alert('Форма регистрации будет открыта в реальном приложении.');
                } else if (this.classList.contains('partner-btn') || this.classList.contains('sponsor-btn')) {
                    alert('Форма партнёрства будет открыта в реальном приложении.');
                }
            });
        });
    }

    // ===== INITIALIZE EVERYTHING =====
    initNavigation();
    initScrollAnimations();
    initCounters();
    initButtonsInteractions();

    // Инициализация кастомного курсора (если не на мобильном)
    if (window.innerWidth > 768) {
        initCustomCursor();
    }

    // Инициализация остальных функций
    initBackgroundStars();
    initBackgroundElements(); // Добавили красные и синие элементы
    initHeroSlider();
    initTopicCardCircles(); // Добавили кружки в topic-card

    // Инициализация карты при загрузке
    setTimeout(initMap, 1000);

    console.log('IT ALL STAR 2K26 полностью загружен и готов!');
});

document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код ...

    // Инициализация остальных функций
    initBackgroundStars();
    initBackgroundElements();
    initHeroSlider();

    // Добавляем анимации для кружков
    addCircleAnimations();

    // Инициализация кружков с задержкой, чтобы карточки успели отрисоваться
    setTimeout(() => {
        initTopicCardCircles();
    }, 1000);

    // Инициализация карты при загрузке
    setTimeout(initMap, 1000);

    console.log('ASSOCIATION загружен и готов!');
});
// ===== CUSTOM CURSOR FUNCTION (ракета следует мгновенно) =====
function initCustomCursor() {
    if (window.innerWidth <= 768) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    // Создаём элемент для огня
    const flame = document.createElement('div');
    flame.className = 'cursor-flame';
    cursor.appendChild(flame); // Добавляем огонь внутрь курсора

    let mouseX = 0,
        mouseY = 0;
    let cursorX = 0,
        cursorY = 0;
    let lastMouseX = 0,
        lastMouseY = 0;
    let velocityX = 0,
        velocityY = 0;
    let lastAngle = 0;
    let animationId = null;

    // Следим за движением мыши
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Вычисляем скорость
        const deltaX = mouseX - lastMouseX;
        const deltaY = mouseY - lastMouseY;
        lastMouseX = mouseX;
        lastMouseY = mouseY;

        // Фильтруем небольшие движения
        if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
            velocityX = deltaX;
            velocityY = deltaY;
        }

        // Немедленно обновляем позицию курсора
        cursorX = mouseX;
        cursorY = mouseY;

        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;

        // Вычисляем угол на основе скорости
        if (Math.abs(velocityX) > 0.5 || Math.abs(velocityY) > 0.5) {
            let angle = Math.atan2(velocityY, velocityX) * (180 / Math.PI) + 90;

            // Плавный, но быстрый поворот
            const angleDiff = ((angle - lastAngle + 180) % 360) - 180;
            angle = lastAngle + angleDiff * 0.8;
            lastAngle = angle;

            cursor.style.transform = `rotate(${angle}deg)`;
        }

        // Запускаем анимацию
        if (!animationId) {
            animationId = requestAnimationFrame(animateCursor);
        }
    }, { passive: true });

    // Анимация дополнительных эффектов
    function animateCursor() {
        // Тут можно добавить дополнительные анимации для курсора
        animationId = requestAnimationFrame(animateCursor);
    }

    // Обработка клика
    document.addEventListener('mousedown', (e) => {
        cursor.classList.add('clicking');
        createClickEffect(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', () => {
        cursor.classList.remove('clicking');
    });

    // Скрываем при выходе из окна
    document.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
            cursor.style.opacity = '0';
        }
    });

    document.addEventListener('mouseover', () => {
        cursor.style.opacity = '1';
    });

    // Очистка
    window.addEventListener('beforeunload', () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    });

    console.log('Кастомный курсор инициализирован');
}

// ===== ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ЭФФЕКТА ЧАСТИЦ ПРИ КЛИКЕ =====
function createClickEffect(x, y) {
    const particles = 14;
    const distance = 50;

    for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.className = 'click-particle';
        document.body.appendChild(particle);

        // Распределяем частицы по кругу
        const particleAngle = (360 / particles) * i;
        const rad = particleAngle * (Math.PI / 180);

        // Начальная позиция
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        // Конечная позиция
        const targetX = x + Math.cos(rad) * distance;
        const targetY = y + Math.sin(rad) * distance;

        // Анимация
        const animation = particle.animate([{
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(${targetX - x}px, ${targetY - y}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });

        // Удаляем частицу после анимации
        animation.onfinish = () => {
            if (particle.parentNode) {
                particle.remove();
            }
        };
    }
}

// ===== ФОНОВЫЕ ЗВЁЗДОЧКИ (★) =====
function initBackgroundStars() {
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    document.body.appendChild(starsContainer);

    function createStar() {
        const star = document.createElement('div');
        star.classList.add('bg-star');
        star.innerHTML = '★';

        const size = Math.random() * 10 + 8;
        star.style.fontSize = `${size}px`;
        star.style.left = `${Math.random() * 100}vw`;
        star.style.top = `${Math.random() * 100}vh`;

        // Случайный цвет звёздочки
        const colors = ['#ffffff', '#aaddff', '#88ccff', '#ffffff', '#ffffff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        star.style.color = color;

        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 3;
        star.style.animation = `starFloat ${duration}s ease-in-out ${delay}s infinite`;
        star.style.opacity = Math.random() * 0.8 + 0.2;

        starsContainer.appendChild(star);

        // Удаляем старые звёзды
        setTimeout(() => {
            if (star.parentNode) star.remove();
        }, duration * 1000 + 1000);
    }

    // Создаём звёзды каждые 200мс
    setInterval(createStar, 800);

    // Сразу создаём начальные звёзды
    for (let i = 0; i < 30; i++) {
        setTimeout(() => createStar(), i * 100);
    }
}

// ===== КРАСНЫЕ И СИНИЕ ЭЛЕМЕНТЫ НА ФОНЕ =====
function initBackgroundElements() {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'background-elements';
    document.body.appendChild(bgContainer);

    // Создаём синие элементы
    for (let i = 0; i < 7; i++) {
        const element = document.createElement('div');
        element.className = 'bg-element blue';

        const size = Math.random() * 300 + 100;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.left = `${Math.random() * 100}%`;
        element.style.top = `${Math.random() * 100}%`;
        element.style.opacity = Math.random() * 0.2 + 0.15;
        element.style.animationDelay = `${Math.random() * 5}s`;
        element.style.animationDuration = `${Math.random() * 5 + 5}s`;

        bgContainer.appendChild(element);
    }

    // Создаём красные элементы
    for (let i = 0; i < 7; i++) {
        const element = document.createElement('div');
        element.className = 'bg-element red';

        const size = Math.random() * 280 + 80;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.left = `${Math.random() * 100}%`;
        element.style.top = `${Math.random() * 100}%`;
        element.style.opacity = Math.random() * 0.4 + 0.03;
        element.style.animationDelay = `${Math.random() * 4}s`;
        element.style.animationDuration = `${Math.random() * 5 + 5}s`;

        bgContainer.appendChild(element);
    }
}

// ===== СЛАЙДЕР ДЛЯ HERO-ИЗОБРАЖЕНИЙ =====
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slider .slide');
    const dots = document.querySelectorAll('.slider-dots .dot');
    let currentSlide = 0;
    let slideInterval;

    if (slides.length === 0) return;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        currentSlide = index;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        showSlide((currentSlide + 1) % slides.length);
    }

    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        clearInterval(slideInterval);
    }

    // Автоматическая смена слайдов
    startAutoSlide();

    // Пауза при наведении
    const slider = document.querySelector('.hero-slider');
    if (slider) {
        slider.addEventListener('mouseenter', stopAutoSlide);
        slider.addEventListener('mouseleave', startAutoSlide);
    }

    // Клики по точкам
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            const slideIndex = parseInt(dot.getAttribute('data-slide'));
            showSlide(slideIndex);
            startAutoSlide();
        });
    });

    // Показываем первый слайд
    showSlide(0);
}

// ===== КАРУСЕЛЬ ДЛЯ TOPIC CARDS =====
function initTopicsCarousel() {
    const carousel = document.querySelector('.topics-carousel');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');

    if (!carousel) return;

    // На мобильных устройствах не делаем карусель
    if (window.innerWidth <= 768) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    }

    const cardWidth = document.querySelector('.topic-card').offsetWidth + 30;
    let scrollPosition = 0;
    let autoScrollInterval;
    let isPaused = false;

    function scrollCarousel(direction) {
        const maxScroll = carousel.scrollWidth - carousel.parentElement.offsetWidth;

        if (direction === 'next') {
            scrollPosition = Math.min(scrollPosition + cardWidth, maxScroll);
        } else {
            scrollPosition = Math.max(scrollPosition - cardWidth, 0);
        }

        carousel.style.transform = `translateX(-${scrollPosition}px)`;
    }


    function startAutoScroll() {
        if (isPaused) return;

        autoScrollInterval = setInterval(() => {
            const maxScroll = carousel.scrollWidth - carousel.parentElement.offsetWidth;

            if (scrollPosition >= maxScroll - 10) {
                // Возвращаемся к началу
                scrollPosition = 0;
            } else {
                // Медленно двигаем вправо
                scrollPosition += 0.5;
            }

            carousel.style.transform = `translateX(-${scrollPosition}px)`;
        }, 16); // ~60fps
    }

    function pauseAutoScroll() {
        isPaused = true;
        clearInterval(autoScrollInterval);
    }

    function resumeAutoScroll() {
        isPaused = false;
        startAutoScroll();
    }

    // Плавный скролл мышью
    carousel.addEventListener('wheel', (e) => {
        e.preventDefault();
        pauseAutoScroll();

        scrollPosition += e.deltaY * 0.3;
        const maxScroll = carousel.scrollWidth - carousel.parentElement.offsetWidth;
        scrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));

        carousel.style.transform = `translateX(-${scrollPosition}px)`;

        // Возобновляем через 3 секунды
        setTimeout(resumeAutoScroll, 3000);
    });

    // Кнопки (если они всё же есть)
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            pauseAutoScroll();
            scrollCarousel('prev');
            setTimeout(resumeAutoScroll, 3000);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            pauseAutoScroll();
            scrollCarousel('next');
            setTimeout(resumeAutoScroll, 3000);
        });
    }

    // Пауза при наведении
    carousel.addEventListener('mouseenter', pauseAutoScroll);
    carousel.addEventListener('mouseleave', resumeAutoScroll);

    // Запускаем автоскролл
    startAutoScroll();
}

// ===== АНИМИРОВАННЫЕ КРУЖКИ В TOPIC-CARD =====
// ===== АНИМИРОВАННЫЕ КРУЖКИ В TOPIC-CARD =====
// ===== АНИМИРОВАННЫЕ КРУЖКИ В TOPIC-CARD =====
// ===== УМНЫЕ АНИМИРОВАННЫЕ КРУЖКИ В TOPIC-CARD =====
class CircleManager {
    constructor(container) {
        this.container = container;
        this.circles = [];
        this.occupiedAreas = [];
        this.maxCircles = 6;
        this.circleLifetime = 20000; // 20 секунд
        this.init();
    }

    init() {
        this.setupContainer();
        this.createInitialCircles();
        this.startLifecycle();
    }

    setupContainer() {
        this.container.style.position = 'relative';
        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;

        // Сохраняем размеры контейнера
        this.containerWidth = width;
        this.containerHeight = height;

        // Очищаем контейнер
        this.container.innerHTML = '';
    }

    getRandomPosition(size) {
        const padding = size * 1.5; // Минимальное расстояние между кружками
        let attempts = 0;
        let x, y;

        do {
            x = Math.random() * (this.containerWidth - size);
            y = Math.random() * (this.containerHeight - size);
            attempts++;

            if (attempts > 100) {
                // Если долго не можем найти позицию, возвращаем любую
                break;
            }
        } while (this.isPositionOccupied(x, y, size + padding));

        // Занимаем эту область
        this.occupiedAreas.push({ x, y, radius: size / 2 + padding });
        return { x, y };
    }

    isPositionOccupied(x, y, radius) {
        for (const area of this.occupiedAreas) {
            const distance = Math.sqrt(
                Math.pow(x - area.x, 2) + Math.pow(y - area.y, 2)
            );
            if (distance < radius + area.radius) {
                return true;
            }
        }
        return false;
    }

    createCircle() {
        const circle = document.createElement('div');
        circle.className = 'topic-circle';

        // Случайный размер от 40 до 100px
        const size = Math.random() * 60 + 40;
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;

        // Получаем безопасную позицию
        const position = this.getRandomPosition(size);
        circle.style.left = `${position.x}px`;
        circle.style.top = `${position.y}px`;

        // Уровень заполнения
        const fillTypes = ['filled', 'half-filled', 'empty', 'empty'];
        const fillType = fillTypes[Math.floor(Math.random() * fillTypes.length)];
        circle.classList.add(fillType);

        // Случайные параметры движения (небольшие смещения)
        const maxMove = this.containerWidth * 0.15; // Макс 15% от ширины контейнера

        circle.style.setProperty('--start-x', '0px');
        circle.style.setProperty('--start-y', '0px');
        circle.style.setProperty('--move-x1', `${Math.random() * maxMove - maxMove/2}px`);
        circle.style.setProperty('--move-y1', `${Math.random() * maxMove - maxMove/2}px`);
        circle.style.setProperty('--move-x2', `${Math.random() * maxMove - maxMove/2}px`);
        circle.style.setProperty('--move-y2', `${Math.random() * maxMove - maxMove/2}px`);
        circle.style.setProperty('--move-x3', `${Math.random() * maxMove - maxMove/2}px`);
        circle.style.setProperty('--move-y3', `${Math.random() * maxMove - maxMove/2}px`);

        // Длительность анимации
        const moveDuration = Math.random() * 15000 + 25000; // 25-40 секунд
        const appearDuration = moveDuration * 0.8; // 80% времени видимы

        circle.style.animation = `
            circleMove ${moveDuration}ms infinite linear,
            circleAppear ${appearDuration}ms infinite ease-in-out,
            circlePulse ${Math.random() * 5000 + 8000}ms infinite ease-in-out
        `;

        // Случайная задержка
        circle.style.animationDelay = `${Math.random() * 5000}ms`;

        // Сохраняем данные кружка
        circle.circleData = {
            id: Date.now() + Math.random(),
            x: position.x,
            y: position.y,
            size: size,
            createdAt: Date.now()
        };

        this.container.appendChild(circle);
        this.circles.push(circle);

        // Запускаем таймер замены
        this.scheduleCircleReplacement(circle);

        return circle;
    }

    scheduleCircleReplacement(circle) {
        // Через 80% времени начинаем плавно удалять
        setTimeout(() => {
            this.removeCircle(circle);
        }, this.circleLifetime * 0.8);
    }

    removeCircle(circle) {
        if (!circle.parentNode) return;

        // Находим индекс в массиве occupiedAreas
        const circleIndex = this.circles.indexOf(circle);
        if (circleIndex > -1) {
            this.circles.splice(circleIndex, 1);
        }

        // Освобождаем область
        if (circle.circleData) {
            const areaIndex = this.occupiedAreas.findIndex(area =>
                Math.abs(area.x - circle.circleData.x) < 1 &&
                Math.abs(area.y - circle.circleData.y) < 1
            );
            if (areaIndex > -1) {
                this.occupiedAreas.splice(areaIndex, 1);
            }
        }

        // Плавное исчезновение
        circle.style.opacity = '0';
        circle.style.transition = 'opacity 1.5s ease';

        setTimeout(() => {
            if (circle.parentNode) {
                circle.remove();
                // Создаем новый кружок после исчезновения
                setTimeout(() => this.createCircle(), 500);
            }
        }, 1500);
    }

    createInitialCircles() {
        const initialCount = Math.min(this.maxCircles, 5);
        for (let i = 0; i < initialCount; i++) {
            setTimeout(() => {
                this.createCircle();
            }, i * 1000); // Постепенное появление
        }
    }

    startLifecycle() {
        // Поддерживаем постоянное количество кружков
        setInterval(() => {
            if (this.circles.length < this.maxCircles) {
                this.createCircle();
            }
        }, 3000);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ КРУЖКОВ В TOPIC-CARD =====
function initTopicCardCircles() {
    const topicCards = document.querySelectorAll('.topic-card');
    const circleManagers = [];

    topicCards.forEach((card, index) => {
        const container = card.querySelector('.circles-container');
        if (!container) return;

        // Даем время на отрисовку карточек
        setTimeout(() => {
            const manager = new CircleManager(container);
            circleManagers.push(manager);
        }, index * 300);
    });

    // Обновляем при изменении размера окна
    window.addEventListener('resize', () => {
        circleManagers.forEach(manager => {
            if (manager.container) {
                manager.containerWidth = manager.container.offsetWidth;
                manager.containerHeight = manager.container.offsetHeight;
            }
        });
    });
}

// ===== ДОБАВЛЕНИЕ КЛЮЧЕВЫХ КАДРОВ ДЛЯ РАЗНЫХ ЦВЕТОВ =====
function addCircleAnimations() {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'circle-animations';

    // Удаляем старые анимации, если есть
    const oldStyle = document.getElementById('circle-animations');
    if (oldStyle) oldStyle.remove();

    styleSheet.textContent = `
        /* Для сине-красных кружков */
        .topic-circle.filled {
            background: radial-gradient(
                circle at 30% 30%, 
                rgba(0, 170, 255, 0.9) 0%,
                rgba(0, 170, 255, 0.6) 30%,
                rgba(255, 51, 102, 0.3) 60%,
                transparent 80%
            );
        }
        
        .topic-circle.half-filled {
            background: radial-gradient(
                circle at 30% 30%, 
                rgba(0, 170, 255, 0.7) 0%,
                rgba(0, 170, 255, 0.4) 20%,
                rgba(255, 51, 102, 0.2) 40%,
                transparent 50%
            );
        }
        
        .topic-circle.empty {
            background: radial-gradient(
                circle at 30% 30%, 
                rgba(0, 170, 255, 0.3) 0%,
                rgba(255, 51, 102, 0.1) 10%,
                transparent 20%
            );
        }
        
        /* Дополнительная анимация для плавного появления */
        @keyframes circleGlow {
            0%, 100% {
                box-shadow: 0 0 20px rgba(0, 170, 255, 0.1);
            }
            50% {
                box-shadow: 
                    0 0 40px rgba(0, 170, 255, 0.3),
                    0 0 60px rgba(255, 51, 102, 0.1);
            }
        }
        
        .topic-circle {
            animation: circleGlow 8s infinite ease-in-out;
        }
    `;

    document.head.appendChild(styleSheet);
}

// ===== ДОБАВЛЕНИЕ КЛЮЧЕВЫХ КАДРОВ ДЛЯ РАЗНЫХ ЦВЕТОВ =====
function addCircleFillAnimations() {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'circle-animations';

    // Удаляем старые анимации, если есть
    const oldStyle = document.getElementById('circle-animations');
    if (oldStyle) oldStyle.remove();

    styleSheet.textContent = `
        @keyframes circleFillBlueRed {
            0% {
                background: transparent;
                transform: scale(0.3);
                opacity: 0.3;
            }
            50% {
                background: linear-gradient(45deg, var(--primary-blue), var(--accent-red));
                transform: scale(0.8);
                opacity: 0.6;
            }
            100% {
                background: linear-gradient(45deg, var(--primary-blue), var(--accent-red));
                transform: scale(1);
                opacity: 0.3;
            }
        }
        
        @keyframes circleFillRed {
            0% {
                background: transparent;
                transform: scale(0.3);
                opacity: 0.3;
            }
            50% {
                background: linear-gradient(45deg, var(--accent-red), #ff7700);
                transform: scale(0.8);
                opacity: 0.6;
            }
            100% {
                background: linear-gradient(45deg, var(--accent-red), #ff7700);
                transform: scale(1);
                opacity: 0.3;
            }
        }
        
        @keyframes circleFillBlue {
            0% {
                background: transparent;
                transform: scale(0.3);
                opacity: 0.3;
            }
            50% {
                background: linear-gradient(45deg, var(--primary-blue), var(--secondary-blue));
                transform: scale(0.8);
                opacity: 0.6;
            }
            100% {
                background: linear-gradient(45deg, var(--primary-blue), var(--secondary-blue));
                transform: scale(1);
                opacity: 0.3;
            }
        }
    `;

    document.head.appendChild(styleSheet);
}

// ===== ИНИЦИАЛИЗАЦИЯ КАРТЫ (Leaflet с кастомными стилями) =====
function initMap() {
    const mapContainer = document.querySelector('.location-map');
    if (!mapContainer) return;

    const mapElement = document.createElement('div');
    mapElement.id = 'map';
    mapElement.style.width = '100%';
    mapElement.style.height = '250px';
    mapElement.style.borderRadius = '15px';
    mapElement.style.border = '1px solid rgba(0, 170, 255, 0.2)';

    const oldContent = mapContainer.querySelector('div, p');
    if (oldContent) oldContent.remove();
    mapContainer.prepend(mapElement);

    try {
        const location = [53.927443, 27.682358];

        // Создаем карту с отключенными контролами
        const map = L.map('map', {
            attributionControl: false,
            zoomControl: true // Оставляем зум если нужен
        }).setView(location, 16);

        // Используем нейтральный тайловый сервер
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '', // Пустая атрибуция
            maxZoom: 19,
            noWrap: true
        }).addTo(map);

        // Альтернатива - отключить атрибуцию ПОСЛЕ создания карты
        setTimeout(() => {
            // Удаляем все элементы атрибуции
            const attributionElements = document.querySelectorAll('.leaflet-control-attribution');
            attributionElements.forEach(el => el.remove());

            // Удаляем все изображения флагов
            const flagImages = document.querySelectorAll('.leaflet-container img[alt*="Ukraine"], .leaflet-container img[src*="flag"]');
            flagImages.forEach(img => img.remove());
        }, 1000);

        // Ваш маркер и остальной код
        const rocketIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div class="marker-pin"></div><div class="marker-text">IT ALL STAR</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        const marker = L.marker(location, { icon: rocketIcon }).addTo(map);

        marker.bindPopup(`
            <div style="padding: 10px; font-family: Roboto, sans-serif; max-width: 250px;">
                <strong style="color: #00aaff; font-size: 16px;">IT ALL STAR Forum 2026</strong><br>
                <span style="color: #333;">г. Минск, ул. Академика Купревича 1, корпус 2</span><br>
                <span style="color: #666;">Март 2026</span><br>
                <span style="color: #888; font-size: 12px;">Метро: "Восток", "Борисовский тракт"</span>
            </div>
        `);

        L.circle(location, {
            color: '#00aaff',
            fillColor: '#00aaff',
            fillOpacity: 0.1,
            radius: 80
        }).addTo(map);

        marker.openPopup();

    } catch (error) {
        console.error('Ошибка при загрузке карты:', error);
        mapElement.innerHTML = `
            <div style="background: #111; color: white; padding: 20px; border-radius: 15px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
                <h3 style="color: #00aaff; margin-bottom: 10px;">IT ALL STAR Forum 2026</h3>
                <p style="margin-bottom: 5px;">г. Минск, ул. Академика Купревича 1, корпус 2</p>
                <p style="color: #888; font-size: 14px;">Метро: "Восток", "Борисовский тракт"</p>
            </div>
        `;
    }
}
// ===== ОБРАБОТЧИК КЛИКОВ ДЛЯ ВСЕЙ СТРАНИЦЫ (частицы) =====
document.addEventListener('click', function(e) {
    // Создаём частицы при любом клике
    createClickEffect(e.clientX, e.clientY);
});