class ScrollCarousel {
    constructor() {
        this.sections = document.querySelectorAll('.scroll-snap-section');
        this.dotsContainer = document.querySelector('.scroll-nav-dots');
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
        this.lastScrollTime = 0;
        this.scrollDelay = 1000; // Aumentei o delay para melhor experiência
        this.yearElement = document.getElementById('year');
        this.pageLoader = document.querySelector('.page-loader');
        this.scrollLock = false;
        this.currentIndex = 0;
        this.scrollTimeout = null;

        this.init();
    }

    init() {
        if (!this.validateElements()) {
            console.error('Elementos necessários não encontrados. Desativando funcionalidades avançadas.');
            this.setupFallback();
            return;
        }

        this.updateYear();
        this.setupLoader();
        this.createNavigationDots();
        this.setupScrollBehavior();
        this.setupObservers();
        this.addEventListeners();
        this.updateActiveStates();
    }

    validateElements() {
        return this.sections.length > 0 && 
               this.dotsContainer && 
               this.yearElement && 
               this.pageLoader;
    }

    setupFallback() {
        this.updateYear();
        this.removeLoader();
    }

    updateYear() {
        if (this.yearElement) {
            this.yearElement.textContent = new Date().getFullYear();
        }
    }

    setupLoader() {
        // Garante que o loader seja removido mesmo se houver erros
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.removeLoader();
            }, 1000); // Tempo mínimo de exibição do loader
        });

        // Fallback caso o evento load não dispare
        setTimeout(() => {
            this.removeLoader();
        }, 3000);
    }

    removeLoader() {
        if (this.pageLoader) {
            this.pageLoader.style.opacity = '0';
            setTimeout(() => {
                this.pageLoader.style.display = 'none';
            }, 500);
        }
    }

    createNavigationDots() {
        this.sections.forEach((section, index) => {
            const dot = document.createElement('button');
            dot.className = 'scroll-nav-dot';
            dot.dataset.index = index;
            dot.setAttribute('aria-label', `Ir para a seção ${index + 1}`);
            dot.setAttribute('role', 'button');
            dot.setAttribute('tabindex', '0');

            dot.addEventListener('click', () => {
                this.scrollToSection(index);
            });

            dot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.scrollToSection(index);
                }
            });

            this.dotsContainer.appendChild(dot);
        });
    }

    setupScrollBehavior() {
        const container = document.querySelector('.scroll-snap-container');
        if (container) {
            if (!this.isTouchDevice) {
                container.style.scrollSnapType = 'y mandatory';
            } else {
                container.style.scrollBehavior = 'smooth';
            }
        }
    }

    setupObservers() {
        const observerOptions = {
            threshold: [0.1, 0.5, 0.9]
        };

        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const target = entry.target;
                const index = [...this.sections].indexOf(target);

                if (entry.isIntersecting) {
                    this.handleSectionAppear(target, index);
                } else {
                    this.handleSectionDisappear(target);
                }
            });
        }, observerOptions);

        this.sections.forEach(section => {
            this.sectionObserver.observe(section);
        });
    }

    handleSectionAppear(section, index) {
        section.classList.add('fading-in', 'aparecer', 'active');
        section.classList.remove('fading-out');
        this.currentIndex = index;
        
        // Atualiza acessibilidade
        section.setAttribute('aria-hidden', 'false');
    }

    handleSectionDisappear(section) {
        section.classList.add('fading-out');
        section.classList.remove('fading-in', 'active');
        section.setAttribute('aria-hidden', 'true');
    }

    addEventListeners() {
        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (this.scrollLock) return;
            
            const now = Date.now();
            if (now - this.lastScrollTime < this.scrollDelay) return;

            switch (e.key) {
                case 'ArrowDown':
                case 'PageDown':
                    e.preventDefault();
                    this.scrollToNext();
                    this.lastScrollTime = now;
                    break;
                case 'ArrowUp':
                case 'PageUp':
                    e.preventDefault();
                    this.scrollToPrev();
                    this.lastScrollTime = now;
                    break;
                case 'Home':
                    e.preventDefault();
                    this.scrollToSection(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.scrollToSection(this.sections.length - 1);
                    break;
            }
        });

        // Navegação por wheel/touch com throttle
        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });

        // Atualiza estados ativos
        window.addEventListener('scroll', this.throttle(this.updateActiveStates.bind(this), 100));
    }

    handleWheel(e) {
        if (this.scrollLock || Math.abs(e.deltaY) < 5) return;
        
        e.preventDefault();
        
        if (e.deltaY > 0) {
            this.scrollToNext();
        } else {
            this.scrollToPrev();
        }
    }

    handleTouchMove(e) {
        if (this.scrollLock || !this.isTouchDevice) return;
        
        // Implementação básica para dispositivos touch
        // Poderia ser aprimorado com detecção de gestos
    }

    scrollToSection(index) {
        if (this.scrollLock || index < 0 || index >= this.sections.length) return;
        
        this.scrollLock = true;
        this.currentIndex = index;

        this.sections[index].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // Libera o scroll após a animação
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.scrollLock = false;
        }, this.scrollDelay);
    }

    scrollToNext() {
        const nextIndex = Math.min(this.currentIndex + 1, this.sections.length - 1);
        this.scrollToSection(nextIndex);
    }

    scrollToPrev() {
        const prevIndex = Math.max(this.currentIndex - 1, 0);
        this.scrollToSection(prevIndex);
    }

    updateActiveStates() {
        if (this.scrollLock) return;
        
        const scrollPosition = window.scrollY + (window.innerHeight / 2);
        let newIndex = 0;
        let minDistance = Infinity;

        // Encontra a seção mais próxima do centro da tela
        this.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionCenter = sectionTop + (sectionHeight / 2);
            const distance = Math.abs(scrollPosition - sectionCenter);

            if (distance < minDistance) {
                minDistance = distance;
                newIndex = index;
            }
        });

        if (newIndex !== this.currentIndex) {
            this.currentIndex = newIndex;
            this.updateDots();
        }
    }

    updateDots() {
        if (!this.dotsContainer) return;
        
        Array.from(this.dotsContainer.children).forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.classList.remove('active');
                dot.removeAttribute('aria-current');
            }
        });
    }

    throttle(func, limit) {
        let lastFunc;
        let lastRan;
        
        return function() {
            const context = this;
            const args = arguments;
            
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }
}

// Inicialização com tratamento de erros
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (document.querySelectorAll('.scroll-snap-section').length > 0) {
            new ScrollCarousel();
        } else {
            // Fallback para páginas sem seções de scroll-snap
            const yearElement = document.getElementById('year');
            if (yearElement) {
                yearElement.textContent = new Date().getFullYear();
            }
            
            const pageLoader = document.querySelector('.page-loader');
            if (pageLoader) {
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        pageLoader.style.opacity = '0';
                        setTimeout(() => {
                            pageLoader.style.display = 'none';
                        }, 500);
                    }, 1000);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao inicializar ScrollCarousel:', error);
        
        // Garante que o loader seja removido mesmo com erro
        const pageLoader = document.querySelector('.page-loader');
        if (pageLoader) {
            pageLoader.style.display = 'none';
        }
    }
});

// Polyfill para scroll-snap (carregamento condicional)
if (typeof CSS !== 'undefined' && 
    typeof CSS.supports === 'function' && 
    !CSS.supports('scroll-snap-align', 'start')) {
    
    const loadPolyfill = () => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/scrollsnap-polyfill@latest/dist/scrollsnap-polyfill.min.js';
        script.onload = () => {
            const container = document.querySelector('.scroll-snap-container');
            if (container) {
                scrollsnapPolyfill();
            }
        };
        script.onerror = () => {
            console.warn('Falha ao carregar o polyfill de scroll-snap');
        };
        document.head.appendChild(script);
    };

    // Carrega apenas se necessário
    if (document.querySelector('.scroll-snap-container')) {
        loadPolyfill();
    }
}
class SkillPopup {
    constructor() {
        this.popup = document.getElementById('skillPopup');
        this.closeBtn = document.getElementById('skillPopupClose');
        this.titleElement = document.getElementById('skillPopupTitle');
        this.descElement = document.getElementById('skillPopupDesc');
        this.progressElement = document.getElementById('skillPopupProgress');
        this.levelElement = document.getElementById('skillPopupLevel');
        
        // Dados das habilidades - agora com IDs consistentes
        this.skillsData = {
            'csharp': {
                title: 'C#',
                description: 'Experiência em desenvolvimento de aplicações desktop e APIs com .NET Core',
                level: 'Avançado',
                percentage: 85
            },
            'dotnet': {
                title: '.NET',
                description: 'Desenvolvimento de soluções empresariais com .NET Framework e .NET Core',
                level: 'Avançado',
                percentage: 80
            },
            'javascript': {
                title: 'JavaScript',
                description: 'Desenvolvimento front-end com ES6+, manipulação de DOM e AJAX',
                level: 'Intermediário-Avançado',
                percentage: 75
            },
            'html': {
                title: 'HTML5',
                description: 'Estruturação semântica de páginas web',
                level: 'Avançado',
                percentage: 90
            },
            'css': {
                title: 'CSS3',
                description: 'Estilização criativa com CSS moderno e animações',
                level: 'Avançado',
                percentage: 85
            },
            'sql-server': {
                title: 'SQL Server',
                description: 'Modelagem de bancos de dados e criação de queries complexas',
                level: 'Intermediário',
                percentage: 70
            },
            'git': {
                title: 'Git',
                description: 'Controle de versão e trabalho em equipe com Git Flow',
                level: 'Intermediário',
                percentage: 75
            },
            'github': {
                title: 'GitHub',
                description: 'Hospedagem de repositórios e colaboração em projetos',
                level: 'Intermediário',
                percentage: 70
            },
            'bootstrap': {
                title: 'Bootstrap',
                description: 'Desenvolvimento responsivo com o framework Bootstrap',
                level: 'Intermediário',
                percentage: 65
            }
        };

        this.init();
    }

    init() {
        // Mapeamento especial para tecnologias com caracteres especiais
        const skillMapping = {
            'c#': 'csharp',
            '.net': 'dotnet',
            'sql server': 'sql-server'
        };

        // Adiciona eventos aos elementos de habilidade
        document.querySelectorAll('.habilidade').forEach(skill => {
            skill.style.cursor = 'pointer';
            skill.setAttribute('role', 'button');
            skill.setAttribute('tabindex', '0');
            
            skill.addEventListener('click', () => {
                let skillName;
                
                // Verifica se tem imagem ou ícone
                if (skill.querySelector('img')) {
                    skillName = skill.querySelector('img').alt.toLowerCase();
                } else if (skill.querySelector('i')) {
                    skillName = skill.querySelector('p').textContent.toLowerCase().trim();
                } else {
                    skillName = skill.querySelector('p').textContent.toLowerCase().trim();
                }
                
                // Aplica mapeamento especial se necessário
                const skillId = skillMapping[skillName] || 
                               skillName.replace(/[.#]/g, '').replace(/\s+/g, '-');
                
                this.showPopup(skillId);
            });
            
            // Adiciona interação por teclado
            skill.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    skill.click();
                }
            });
        });

        // Fecha o popup ao clicar no botão
        this.closeBtn.addEventListener('click', () => this.hidePopup());

        // Fecha o popup ao clicar fora do conteúdo
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                this.hidePopup();
            }
        });

        // Fecha com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup.classList.contains('active')) {
                this.hidePopup();
            }
        });
    }

    showPopup(skillId) {
        const skillData = this.skillsData[skillId];
        
        if (!skillData) {
            console.warn(`Dados não encontrados para a habilidade: ${skillId}`);
            return;
        }

        this.titleElement.textContent = skillData.title;
        this.descElement.textContent = skillData.description;
        this.levelElement.textContent = skillData.level;
        
        // Reset e anima a barra de progresso
        this.progressElement.style.width = '0';
        setTimeout(() => {
            this.progressElement.style.width = `${skillData.percentage}%`;
        }, 50);
        
        this.popup.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Foca no botão de fechar para acessibilidade
        this.closeBtn.focus();
    }

    hidePopup() {
        this.popup.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Inicialização com verificação de elementos
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('skillPopup')) {
        new SkillPopup();
    } else {
        console.warn('Elemento do popup de habilidades não encontrado');
    }
});