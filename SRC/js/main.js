/**
 * =============================================
 * FUNÇÕES GERAIS E UTILITÁRIOS
 * =============================================
 */

// Remove o loader da página
function removeLoader() {
  const pageLoader = document.querySelector(".page-loader");
  if (pageLoader) {
    pageLoader.style.opacity = "0";
    setTimeout(() => {
      pageLoader.style.display = "none";
    }, 500);
  }
}

// Atualiza o ano no footer
function updateYear() {
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Função para throttle (limitar chamadas de eventos)
function throttle(func, limit) {
  let lastFunc;
  let lastRan;

  return function () {
    const context = this;
    const args = arguments;

    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * =============================================
 * SCROLL CAROUSEL - Navegação por seções
 * =============================================
 */
class ScrollCarousel {
  constructor() {
    this.sections = document.querySelectorAll(".scroll-snap-section");
    this.dotsContainer = document.querySelector(".scroll-nav-dots");
    this.isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints;
    this.scrollLock = false;
    this.currentIndex = 0;
    this.scrollDelay = 1000;
    this.lastScrollTime = 0;
    this.scrollTimeout = null;

    if (this.validateElements()) {
      this.init();
    }
  }

  init() {
    this.createNavigationDots();
    this.setupScrollBehavior();
    this.setupObservers();
    this.addEventListeners();
  }

  validateElements() {
    return this.sections.length > 0 && this.dotsContainer;
  }

  createNavigationDots() {
    this.sections.forEach((section, index) => {
      const dot = document.createElement("button");
      dot.className = "scroll-nav-dot";
      dot.dataset.index = index;
      dot.setAttribute("aria-label", `Ir para a seção ${index + 1}`);
      dot.setAttribute("role", "button");
      dot.setAttribute("tabindex", "0");

      dot.addEventListener("click", () => this.scrollToSection(index));
      dot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.scrollToSection(index);
        }
      });

      this.dotsContainer.appendChild(dot);
    });
  }

  setupScrollBehavior() {
    const container = document.querySelector(".scroll-snap-container");
    if (container) {
      container.style.scrollSnapType = this.isTouchDevice
        ? "y mandatory"
        : "smooth";
    }
  }

  setupObservers() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          const index = [...this.sections].indexOf(target);

          if (entry.isIntersecting) {
            this.handleSectionAppear(target, index);
          } else {
            this.handleSectionDisappear(target);
          }
        });
      },
      { threshold: [0.1, 0.5, 0.9] }
    );

    this.sections.forEach((section) => observer.observe(section));
  }

  handleSectionAppear(section, index) {
    section.classList.add("fading-in", "aparecer", "active");
    section.classList.remove("fading-out");
    this.currentIndex = index;
    section.setAttribute("aria-hidden", "false");
    this.updateDots();
  }

  handleSectionDisappear(section) {
    section.classList.add("fading-out");
    section.classList.remove("fading-in", "active");
    section.setAttribute("aria-hidden", "true");
  }

  addEventListeners() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    window.addEventListener("wheel", (e) => this.handleWheel(e), {
      passive: false,
    });
    window.addEventListener(
      "scroll",
      throttle(() => this.updateActiveStates(), 100)
    );
  }

  handleKeyDown(e) {
    if (this.scrollLock) return;

    const now = Date.now();
    if (now - this.lastScrollTime < this.scrollDelay) return;

    switch (e.key) {
      case "ArrowDown":
      case "PageDown":
        e.preventDefault();
        this.scrollToNext();
        this.lastScrollTime = now;
        break;
      case "ArrowUp":
      case "PageUp":
        e.preventDefault();
        this.scrollToPrev();
        this.lastScrollTime = now;
        break;
      case "Home":
        e.preventDefault();
        this.scrollToSection(0);
        break;
      case "End":
        e.preventDefault();
        this.scrollToSection(this.sections.length - 1);
        break;
    }
  }

  handleWheel(e) {
    if (this.scrollLock || Math.abs(e.deltaY) < 5) return;
    e.preventDefault();
    e.deltaY > 0 ? this.scrollToNext() : this.scrollToPrev();
  }

  scrollToSection(index) {
    if (this.scrollLock || index < 0 || index >= this.sections.length) return;

    this.scrollLock = true;
    this.currentIndex = index;

    this.sections[index].scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.scrollLock = false;
    }, this.scrollDelay);
  }

  scrollToNext() {
    this.scrollToSection(
      Math.min(this.currentIndex + 1, this.sections.length - 1)
    );
  }

  scrollToPrev() {
    this.scrollToSection(Math.max(this.currentIndex - 1, 0));
  }

  updateActiveStates() {
    if (this.scrollLock) return;

    const scrollPosition = window.scrollY + window.innerHeight / 2;
    let newIndex = 0;
    let minDistance = Infinity;

    this.sections.forEach((section, index) => {
      const sectionCenter = section.offsetTop + section.offsetHeight / 2;
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
      const isActive = index === this.currentIndex;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }
}

/**
 * =============================================
 * SKILL POPUP - Modal de habilidades
 * =============================================
 */
class SkillPopup {
  constructor() {
    this.popup = document.getElementById("skillPopup");
    this.closeBtn = document.getElementById("skillPopupClose");
    this.titleElement = document.getElementById("skillPopupTitle");
    this.descElement = document.getElementById("skillPopupDesc");
    this.progressElement = document.getElementById("skillPopupProgress");
    this.levelElement = document.getElementById("skillPopupLevel");

    this.skillsData = {
      csharp: {
        title: "C#",
        description:
          "Experiência em desenvolvimento de aplicações desktop e APIs com .NET Core",
        level: "Intermediário",
        percentage: 65,
      },
      dotnet: {
        title: ".NET",
        description:
          "Desenvolvimento de soluções empresariais com .NET Framework e .NET Core",
        level: "Intermediário",
        percentage: 60,
      },
      javascript: {
        title: "JavaScript",
        description:
          "Desenvolvimento front-end com ES6+, manipulação de DOM e AJAX",
        level: "Intermediário-Avançado",
        percentage: 75,
      },
      html: {
        title: "HTML5",
        description: "Estruturação semântica de páginas web",
        level: "Avançado",
        percentage: 95,
      },
      css: {
        title: "CSS3",
        description: "Estilização criativa com CSS moderno e animações",
        level: "Avançado",
        percentage: 90,
      },
      "sql-server": {
        title: "SQL Server",
        description:
          "Modelagem de bancos de dados e criação de queries complexas",
        level: "Intermediário",
        percentage: 70,
      },
      git: {
        title: "Git",
        description: "Controle de versão e trabalho em equipe com Git Flow",
        level: "Intermediário",
        percentage: 75,
      },
      github: {
        title: "GitHub",
        description: "Hospedagem de repositórios e colaboração em projetos",
        level: "Intermediário",
        percentage: 70,
      },
      bootstrap: {
        title: "Bootstrap",
        description: "Desenvolvimento responsivo com o framework Bootstrap",
        level: "Intermediário",
        percentage: 65,
      },
    };

    if (this.popup) this.init();
  }

  init() {
    this.setupSkillClickHandlers();
    this.setupPopupCloseHandlers();
  }

  setupSkillClickHandlers() {
    const skillMapping = {
      "c#": "csharp",
      ".net": "dotnet",
      "sql server": "sql-server",
    };

    document.querySelectorAll(".habilidade").forEach((skill) => {
      skill.style.cursor = "pointer";
      skill.setAttribute("role", "button");
      skill.setAttribute("tabindex", "0");

      skill.addEventListener("click", () => {
        const skillName =
          skill.querySelector("img")?.alt.toLowerCase() ||
          skill.querySelector("p")?.textContent.toLowerCase().trim();
        const skillId =
          skillMapping[skillName] ||
          skillName.replace(/[.#]/g, "").replace(/\s+/g, "-");
        this.showPopup(skillId);
      });

      skill.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          skill.click();
        }
      });
    });
  }

  setupPopupCloseHandlers() {
    this.closeBtn.addEventListener("click", () => this.hidePopup());
    this.popup.addEventListener("click", (e) => {
      if (e.target === this.popup) this.hidePopup();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.popup.classList.contains("active")) {
        this.hidePopup();
      }
    });
  }

  showPopup(skillId) {
    const skillData = this.skillsData[skillId];
    if (!skillData) return;

    this.titleElement.textContent = skillData.title;
    this.descElement.textContent = skillData.description;
    this.levelElement.textContent = skillData.level;

    this.progressElement.style.width = "0";
    setTimeout(() => {
      this.progressElement.style.width = `${skillData.percentage}%`;
    }, 50);

    this.popup.classList.add("active");
    document.body.style.overflow = "hidden";
    this.closeBtn.focus();
  }

  hidePopup() {
    this.popup.classList.remove("active");
    document.body.style.overflow = "";
  }
}
/**
 * =============================================
 * INICIALIZAÇÃO DA APLICAÇÃO
 * =============================================
 */
class AppInitializer {
  static async init() {
    try {
      console.log('🚀 Iniciando aplicação...');
      
      // 1. Carrega o EmailJS primeiro
      await this.loadEmailJS();
      
      // 2. Inicializa componentes básicos
      this.initBasicComponents();
      
      // 3. Inicializa o formulário
      await this.initForm();
      
      console.log('🎉 Aplicação pronta');
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
    } finally {
      // Garante que o loader seja removido
      this.removeLoader();
    }
  }

  static async loadEmailJS() {
    if (typeof emailjs !== 'undefined') return;
    
    console.log('📦 Carregando EmailJS...');
    await this.loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js');
  }

  static initBasicComponents() {
    // Atualiza o ano de copyright
    const yearElement = document.querySelector('[data-current-year]');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  static async initForm() {
    const contactForm = document.querySelector('.contato-form');
    if (!contactForm) return;
    
    try {
      // Espera o FormSubmit estar disponível
      await this.waitForFormSubmit();
      
      new FormSubmit(contactForm);
      console.log('✅ Formulário inicializado');
    } catch (error) {
      console.error('Erro no formulário:', error);
    }
  }

  static async waitForFormSubmit() {
    const maxAttempts = 10;
    let attempts = 0;
    
    while (typeof FormSubmit === 'undefined' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (typeof FormSubmit === 'undefined') {
      throw new Error('FormSubmit não carregado');
    }
  }

  static removeLoader() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }
  }

  static loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(script);
    });
  }
}

// Inicialização segura
// Inicializa os componentes quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o App
  AppInitializer.init();
  
  // Inicializa o ScrollCarousel (se os elementos existirem)
  if (document.querySelector('.scroll-snap-section') && document.querySelector('.scroll-nav-dots')) {
    new ScrollCarousel();
  }
  
  // Inicializa o SkillPopup (se o elemento existir)
  if (document.getElementById('skillPopup')) {
    new SkillPopup();
  }
});
document.getElementById("downloadCv")?.addEventListener("click", function (e) {
  e.preventDefault();

  // URL do seu currículo (substitua pelo caminho real)
  const cvUrl = "assets/docs/Matheus_Javier_DEV_Currículo.pdf";

  // Nome do arquivo para download
  const fileName = "Matheus-Javier-Curriculo.pdf";

  // Cria link temporário para download
  const link = document.createElement("a");
  link.href = cvUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
