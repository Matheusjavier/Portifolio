class ScrollCarousel {
    constructor() {
        this.sections = document.querySelectorAll('.scroll-snap-section');
        this.dotsContainer = document.querySelector('.scroll-nav-dots');
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
        this.lastScrollTime = 0;
        this.scrollDelay = 800;
        this.yearElement = document.getElementById('year');
        this.pageLoader = document.querySelector('.page-loader');

        // Garante que os elementos necessários existem antes de prosseguir
        if (this.sections && this.dotsContainer && this.yearElement && this.pageLoader) {
            this.init();
        } else {
            console.error('Elementos HTML necessários não encontrados. O carrossel não será inicializado.');
            this.removeLoader(); // Remove o loader mesmo se o carrossel não inicializar
        }
    }

    init() {
        this.updateYear();
        this.removeLoader();
        this.createNavigationDots();
        this.setupScrollSnap();
        this.setupObservers();
        this.addEventListeners();
        this.updateActiveDot();
    }

    updateYear() {
        if (this.yearElement) {
            this.yearElement.textContent = new Date().getFullYear();
        }
    }

    removeLoader() {
        window.addEventListener('load', () => {
            if (this.pageLoader) { // Verifica novamente se o elemento existe
                this.pageLoader.style.opacity = '0';
                setTimeout(() => {
                    this.pageLoader.style.display = 'none';
                }, 500);
            }
        });
    }

    createNavigationDots() {
        this.sections.forEach((section, index) => {
            const dot = document.createElement('div');
            dot.className = 'scroll-nav-dot';
            dot.dataset.index = index;
            dot.setAttribute('aria-label', `Ir para a seção ${index + 1}`);

            dot.addEventListener('click', () => {
                this.scrollToSection(index);
            });

            this.dotsContainer.appendChild(dot);
        });
    }

    setupScrollSnap() {
        const container = document.querySelector('.scroll-snap-container');
        if (container) {
            if (!this.isTouchDevice) {
                container.style.scrollSnapType = 'y mandatory';
            } else {
                container.style.scrollBehavior = 'smooth';
            }
        } else {
            console.warn('Elemento .scroll-snap-container não encontrado. Scroll-snap não aplicado.');
        }
    }

    setupObservers() {
        const observerOptions = {
            threshold: [0, 0.25, 0.75, 1] // Observa em diferentes pontos da entrada/saída
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const target = entry.target;

                if (entry.isIntersecting) {
                    target.classList.add('fading-in', 'aparecer', 'active'); // Adiciona 'aparecer' ao entrar
                    target.classList.remove('fading-out');
                } else {
                    target.classList.add('fading-out'); // Adiciona classe ao sair
                    target.classList.remove('fading-in', 'active');
                    // Não removemos 'aparecer' aqui para que a animação de entrada seja mantida se a seção voltar à tela parcialmente
                }
            });
        }, observerOptions);

        // Observer para atualização dos dots (mantém como está)
        const dotObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const index = [...this.sections].indexOf(entry.target);
                const dot = this.dotsContainer.children[index];

                if (dot) {
                    if (entry.isIntersecting) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                }
            });
        }, { threshold: 0.5 });

        this.sections.forEach(section => {
            sectionObserver.observe(section);
            dotObserver.observe(section);
        });
    }

    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            const now = Date.now();
            if (now - this.lastScrollTime < this.scrollDelay) return;

            if (e.key === 'ArrowDown') {
                this.scrollToNext();
                this.lastScrollTime = now;
            } else if (e.key === 'ArrowUp') {
                this.scrollToPrev();
                this.lastScrollTime = now;
            }
        });

        window.addEventListener('wheel', (e) => {
            if (e.deltaY < -50 || e.deltaY > 50) {
                this.lastScrollTime = Date.now();
            }
        }, { passive: true });

        window.addEventListener('scroll', this.throttle(this.updateActiveDot.bind(this), 100));
    }

    scrollToSection(index) {
        if (index >= 0 && index < this.sections.length) {
            this.sections[index].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    scrollToNext() {
        const currentIndex = this.getCurrentSectionIndex();
        if (currentIndex < this.sections.length - 1) {
            this.scrollToSection(currentIndex + 1);
        }
    }

    scrollToPrev() {
        const currentIndex = this.getCurrentSectionIndex();
        if (currentIndex > 0) {
            this.scrollToSection(currentIndex - 1);
        }
    }

    getCurrentSectionIndex() {
        const scrollPosition = window.scrollY + (window.innerHeight / 3);
        for (let i = 0; i < this.sections.length; i++) {
            const section = this.sections[i];
            if (scrollPosition >= section.offsetTop &&
                scrollPosition < section.offsetTop + section.offsetHeight) {
                return i;
            }
        }
        return 0;
    }

    updateActiveDot() {
        const currentIndex = this.getCurrentSectionIndex();
        if (this.dotsContainer && this.dotsContainer.children) { // Verifica se dotsContainer e children existem
            [...this.dotsContainer.children].forEach((dot, index) => {
                if (index === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }

    throttle(fn, wait) {
        let time = Date.now();
        return function () {
            if ((time + wait - Date.now()) < 0) {
                fn();
                time = Date.now();
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se há seções para ativar o carrossel
    if (document.querySelectorAll('.scroll-snap-section').length > 0) {
        try {
            new ScrollCarousel();
        } catch (error) {
            console.error('Erro ao inicializar ScrollCarousel:', error);
        }
    } else {
        const yearElement = document.getElementById('year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
        const pageLoader = document.querySelector('.page-loader');
        if (pageLoader) {
            window.addEventListener('load', () => {
                pageLoader.style.opacity = '0';
                setTimeout(() => {
                    pageLoader.style.display = 'none';
                }, 500);
            });
        }
    }
});

// Polyfill opcional para navegadores antigos
if (typeof CSS.supports === 'function' && !CSS.supports('scroll-snap-align', 'start')) {
    import('scrollsnap-polyfill').then(module => {
        const container = document.querySelector('.scroll-snap-container');
        if (container) {
            new module.default(container, {
                snapDestinationY: '100vh'
            }).init();
        }
    }).catch(error => {
        console.error('Falha ao carregar polyfill:', error);
    });
}