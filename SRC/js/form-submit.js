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
  e.preventDefault();

  // Bloqueia envios duplicados e verifica se o serviço está pronto
  if (this.loading || !this.emailJSReady) {
    console.warn('Envio bloqueado:', {
      loading: this.loading,
      emailJSReady: this.emailJSReady
    });
    this.showToast('Aguarde o envio anterior ou recarregue a página', 'warning');
    return;
  }

  // Validação básica dos campos
  if (!this.validateForm()) {
    this.showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  this.loading = true;
  this.showLoading(true);
  const startTime = Date.now(); // Para medir o tempo de envio

  try {
    // Envio do formulário com timeout
    const response = await Promise.race([
      emailjs.sendForm(
        "service_p79vcli",
        "template_3ngkdas", 
        this.form
      ),
      this.timeout(10000) // Timeout de 10 segundos
    ]);

    console.log('✅ E-mail enviado:', {
      status: response.status,
      time: `${(Date.now() - startTime)/1000}s`
    });

    this.showSuccess();
    this.form.reset();

    // Feedback visual adicional
    this.showToast('Mensagem enviada com sucesso!', 'success');

  } catch (error) {
    console.error('❌ Erro no envio:', {
      error: error,
      status: error?.status,
      message: error?.text || error?.message
    });

    // Tratamento específico para diferentes tipos de erro
    if (error.message === 'Timeout') {
      this.showError(new Error('Tempo limite excedido. Tente novamente'));
    } else if (error.status === 400) {
      this.showError(new Error('Dados do formulário inválidos'));
    } else {
      this.showError(error);
    }

  } finally {
    this.loading = false;
    this.showLoading(false);
  }
}

// Métodos auxiliares adicionais:

validateForm() {
  const requiredFields = this.form.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add('invalid');
    } else {
      field.classList.remove('invalid');
    }
  });

  return isValid;
}

timeout(ms) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
}

showToast(message, type = 'info') {
  // Implementação básica - pode usar bibliotecas como Toastify.js
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 5000);
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