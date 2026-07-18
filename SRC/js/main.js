"use strict";

/* =========================================================
   ELEMENTOS DA PÁGINA
========================================================= */

const body = document.body;
const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
const navigationLinks = document.querySelectorAll(".main-nav a");
const sections = document.querySelectorAll("main section[id]");
const revealElements = document.querySelectorAll(".reveal");
const spotlightCards = document.querySelectorAll(".spotlight-card");
const yearElement = document.getElementById("current-year");

const mobileBreakpoint = 900;

/* =========================================================
   ANO AUTOMÁTICO NO RODAPÉ
========================================================= */

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/* =========================================================
   MENU MOBILE
========================================================= */

function updateMenuButton(isOpen) {
  if (!menuButton) return;

  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Fechar menu" : "Abrir menu"
  );

  menuButton.innerHTML = isOpen
    ? '<i class="fa-solid fa-xmark"></i>'
    : '<i class="fa-solid fa-bars"></i>';
}

function openMenu() {
  if (!navigation) return;

  navigation.classList.add("open");
  body.classList.add("menu-open");
  updateMenuButton(true);
}

function closeMenu() {
  if (!navigation) return;

  navigation.classList.remove("open");
  body.classList.remove("menu-open");
  updateMenuButton(false);
}

function toggleMenu() {
  if (!navigation) return;

  const isOpen = navigation.classList.contains("open");

  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

menuButton?.addEventListener("click", toggleMenu);

navigationLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

/*
  Fecha o menu quando o usuário clica fora dele.
*/
document.addEventListener("click", (event) => {
  if (!navigation || !menuButton) return;
  if (!navigation.classList.contains("open")) return;

  const clickedNavigation = navigation.contains(event.target);
  const clickedButton = menuButton.contains(event.target);

  if (!clickedNavigation && !clickedButton) {
    closeMenu();
  }
});

/*
  Fecha o menu ao pressionar Escape.
*/
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

/*
  Evita que o menu continue aberto quando a tela aumenta.
*/
window.addEventListener("resize", () => {
  if (window.innerWidth > mobileBreakpoint) {
    closeMenu();
  }
});

/* =========================================================
   ANIMAÇÃO DE ENTRADA
========================================================= */

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function showAllElements() {
  revealElements.forEach((element) => {
    element.classList.add("visible");
  });
}

if (
  prefersReducedMotion ||
  !("IntersectionObserver" in window)
) {
  showAllElements();
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  revealElements.forEach((element, index) => {
    /*
      Pequeno atraso progressivo para evitar que todos os
      elementos apareçam exatamente ao mesmo tempo.
    */
    element.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;

    revealObserver.observe(element);
  });
}

/* =========================================================
   SEÇÃO ATIVA NO MENU
========================================================= */

function setActiveNavigation(sectionId) {
  navigationLinks.forEach((link) => {
    const target = link.getAttribute("href");
    const isActive = target === `#${sectionId}`;

    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (first, second) =>
            second.intersectionRatio - first.intersectionRatio
        );

      if (visibleSections.length === 0) return;

      setActiveNavigation(visibleSections[0].target.id);
    },
    {
      threshold: [0.2, 0.35, 0.5, 0.65],
      rootMargin: "-20% 0px -50% 0px",
    }
  );

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });
}

/* =========================================================
   EFEITO DE ILUMINAÇÃO NOS CARDS
========================================================= */

const supportsFinePointer = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;

function updateSpotlightPosition(event) {
  const card = event.currentTarget;
  const cardBounds = card.getBoundingClientRect();

  const mouseX = event.clientX - cardBounds.left;
  const mouseY = event.clientY - cardBounds.top;

  card.style.setProperty("--mouse-x", `${mouseX}px`);
  card.style.setProperty("--mouse-y", `${mouseY}px`);
}

function resetSpotlightPosition(event) {
  const card = event.currentTarget;

  card.style.setProperty("--mouse-x", "50%");
  card.style.setProperty("--mouse-y", "50%");
}

if (supportsFinePointer && !prefersReducedMotion) {
  spotlightCards.forEach((card) => {
    card.addEventListener("pointermove", updateSpotlightPosition);
    card.addEventListener("pointerleave", resetSpotlightPosition);
  });
}

/* =========================================================
   EFEITO VISUAL NO HEADER AO ROLAR
========================================================= */

function updateHeaderOnScroll() {
  if (!header) return;

  const hasScrolled = window.scrollY > 20;

  header.classList.toggle("scrolled", hasScrolled);
}

window.addEventListener("scroll", updateHeaderOnScroll, {
  passive: true,
});

updateHeaderOnScroll();

/* =========================================================
   ROLAGEM SUAVE COM COMPATIBILIDADE
========================================================= */

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") return;

    const targetElement = document.querySelector(targetId);

    if (!targetElement) return;

    event.preventDefault();

    targetElement.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    /*
      Atualiza a URL sem recarregar a página.
    */
    if (history.pushState) {
      history.pushState(null, "", targetId);
    }
  });
});