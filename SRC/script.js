// Seleciona todas as seções
const sections = document.querySelectorAll('section');

// Opções para o Intersection Observer
const options = {
    root: null, // Usa o viewport como elemento raiz
    rootMargin: '0px', // Sem margem extra
    threshold: 0.2, // A seção precisa estar 20% visível para ativar
};

// Função para lidar com a interseção
const aparecerSeccao = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aparecer');
            observer.unobserve(entry.target); // Para de observar após a animação
        }
    });
};

// Cria o Intersection Observer
const observer = new IntersectionObserver(aparecerSeccao, options);

// Observa cada seção
sections.forEach(section => {
    observer.observe(section);
});