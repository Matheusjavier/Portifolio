class FormSubmit {
  constructor(formElement) {
    try {
      if (!formElement || !(formElement instanceof HTMLFormElement)) {
        throw new Error('Elemento inválido fornecido');
      }

      this.form = formElement;
      this.submitBtn = formElement.querySelector('button[type="submit"]');
      this.emailJSReady = false;
      this.loading = false;

      this.initializeService();
    } catch (error) {
      console.error('Erro no construtor:', error);
      this.disableForm('Formulário indisponível');
    }
  }

  async initializeService() {
    try {
      // 1. Carrega o EmailJS se necessário
      if (typeof emailjs === 'undefined') {
        await this.loadEmailJSLibrary();
      }

      // 2. Inicializa com a chave pública
      await this.initEmailJS();

      // 3. Marca como pronto e configura o formulário
      this.emailJSReady = true;
      this.setupForm();
      console.log('✅ Serviço de email pronto');

    } catch (error) {
      console.error('Falha na inicialização:', error);
      this.disableForm('Serviço de email indisponível');
    }
  }

  async loadEmailJSLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Falha ao carregar EmailJS'));
      document.head.appendChild(script);
    });
  }

  async initEmailJS() {
    try {
      await emailjs.init("XDxzYQgieAmqTtZwR"); // SUA_CHAVE_PÚBLICA
      console.log('🔑 EmailJS inicializado');
    } catch (error) {
      console.error('Erro na inicialização:', error);
      throw new Error('Configuração do EmailJS falhou');
    }
  }

  setupForm() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(e);
    });
  }

  async handleSubmit(e) {
    if (this.loading || !this.emailJSReady) {
      console.warn('Tentativa de envio bloqueada:', {
        loading: this.loading,
        ready: this.emailJSReady
      });
      return;
    }

    this.loading = true;
    this.showLoading(true);

    try {
      const response = await emailjs.sendForm(
        "service_p79vcli", // SEU_SERVICE_ID
        "template_3ngkdas", // SEU_TEMPLATE_ID
        this.form
      );
      
      console.log('✉️ E-mail enviado:', response);
      this.showSuccess();
      this.form.reset();

    } catch (error) {
      console.error('Erro no envio:', {
        status: error.status,
        message: error.text || error.message
      });
      this.showError(error);
      
    } finally {
      this.loading = false;
      this.showLoading(false);
    }
  }

  isEmailJSReady() {
    return typeof emailjs !== 'undefined' && 
           typeof emailjs.sendForm === 'function' &&
           emailjs._publicKey === "XDxzYQgieAmqTtZwR"; // SUA_CHAVE_PÚBLICA
  }

  showLoading(show) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = show;
    this.submitBtn.innerHTML = show
      ? '<span class="loader"></span> Enviando...'
      : 'Enviar Mensagem';
  }

  disableForm(message = 'Formulário indisponível') {
    if (this.submitBtn) {
      this.submitBtn.disabled = true;
      this.submitBtn.textContent = message;
    }
  }

  showSuccess() {
    // Implemente seu feedback UI aqui
    alert('Mensagem enviada com sucesso! Entrarei em contato em breve.');
  }

  showError(error) {
    const defaultMessage = 'Erro ao enviar. Por favor, tente novamente ou entre em contato diretamente por:';
    const contactInfo = '\n\nEmail: matheusjnp14@gmail.com\nWhatsApp: (11) 95418-0749';
    
    alert(`${error.message || defaultMessage}${contactInfo}`);
  }
}

// Exportação segura
if (typeof window !== 'undefined') {
  window.FormSubmit = FormSubmit;
}