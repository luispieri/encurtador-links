/**
 * ========================================
 * COMPONENTE FORMULÁRIO DE URL (urlForm.js)
 * ========================================
 * 
 * Este componente gerencia o formulário principal de encurtamento de URLs.
 * Responsabilidades:
 * - Captura e validação de dados do formulário
 * - Envio de requisições para API
 * - Validação em tempo real
 * - Gerenciamento de opções avançadas
 * - Cópia de URLs para clipboard
 */

/**
 * Classe URLForm
 * Gerencia toda a lógica do formulário de encurtamento
 */
class URLForm {
    
    /**
     * Construtor do componente
     * @param {string} baseURL - URL base da aplicação
     */
    constructor(baseURL) {
        this.api = new ApiClient(baseURL);  // Cliente para comunicação com API
        this.initializeElements();          // Busca elementos do DOM
        this.bindEvents();                  // Configura event listeners
    }

    /**
     * Inicializa referências aos elementos DOM
     * Centraliza acesso aos elementos do formulário
     */
    initializeElements() {
        // Elementos principais do formulário
        this.form = document.getElementById('shortenForm');
        this.urlInput = document.getElementById('urlInput');
        this.customCode = document.getElementById('customCode');
        this.title = document.getElementById('title');
        this.description = document.getElementById('description');
        this.shortenBtn = document.getElementById('shortenBtn');
        this.newUrlBtn = document.getElementById('newUrlBtn');
        
        // Elementos das opções avançadas
        this.toggleAdvanced = document.getElementById('toggleAdvanced');
        this.advancedPanel = document.getElementById('advancedPanel');
        
        // Botão de copiar URL
        this.copyBtn = document.getElementById('copyBtn');
    }

    /**
     * Configura todos os event listeners do componente
     * Centraliza gerenciamento de eventos
     */
    bindEvents() {
        // Evento principal: submissão do formulário
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Botões de ação
        this.newUrlBtn.addEventListener('click', () => this.reset());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.toggleAdvanced.addEventListener('click', () => this.toggleAdvancedOptions());
        
        // Validação em tempo real (conforme usuário digita)
        this.urlInput.addEventListener('input', () => this.validateUrl());
        this.customCode.addEventListener('input', () => this.validateCustomCode());
    }

    /**
     * Processa o envio do formulário
     * Orquestra validação, envio e tratamento de resposta
     * 
     * @param {Event} e - Evento de submissão do formulário
     */
    async handleSubmit(e) {
        // Impede envio padrão do formulário (reload da página)
        e.preventDefault();
        
        // === FASE 1: VALIDAÇÃO BÁSICA ===
        const url = this.urlInput.value.trim();
        if (!url) {
            this.dispatchEvent('showError', 'Por favor, insira uma URL válida');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.dispatchEvent('showError', 'URL inválida. Use http:// ou https://');
            return;
        }

        // === FASE 2: PREPARAÇÃO DOS DADOS ===
        const urlData = {
            url: url,
            customCode: this.customCode.value.trim() || undefined,      // Opcional
            title: this.title.value.trim() || undefined,               // Opcional
            description: this.description.value.trim() || undefined,   // Opcional
            expiresIn: this.getSelectedExpiration()                     // Tempo de expiração
        };

        // === FASE 3: ENVIO DA REQUISIÇÃO ===
        try {
            // Mostra indicador de carregamento
            this.dispatchEvent('showLoading');
            
            // Envia dados para API
            const result = await this.api.shortenUrl(urlData);
            
            // Processa resposta
            if (result.success) {
                this.dispatchEvent('showResult', result.data);
            } else {
                this.dispatchEvent('showError', result.error);
            }
            
        } catch (error) {
            this.dispatchEvent('showError', error.message);
        }
    }

    /**
     * Obtém o tempo de expiração selecionado
     * @returns {number} Horas até expiração (1, 24, ou 168)
     */
    getSelectedExpiration() {
        const checkedRadio = document.querySelector('input[name="expiresIn"]:checked');
        return checkedRadio ? parseInt(checkedRadio.value) : 24; // Padrão: 24 horas
    }

    /**
     * Alterna visibilidade das opções avançadas
     * Mostra/oculta campos extras do formulário
     */
    toggleAdvancedOptions() {
        const isHidden = this.advancedPanel.classList.contains('hidden');
        this.advancedPanel.classList.toggle('hidden');
        
        // Atualiza texto do botão
        this.toggleAdvanced.textContent = isHidden ? '⚙️ Ocultar Opções' : '⚙️ Opções Avançadas';
    }

    /**
     * Validação visual da URL em tempo real
     * Muda cor da borda conforme validade
     */
    validateUrl() {
        const url = this.urlInput.value.trim();
        if (url && !this.isValidUrl(url)) {
            this.urlInput.style.borderColor = '#dc3545';   // Vermelho para inválido
        } else {
            this.urlInput.style.borderColor = '#588ad6';   // Azul para válido/vazio
        }
    }

    /**
     * Validação visual do código personalizado em tempo real
     * Muda cor da borda conforme validade
     */
    validateCustomCode() {
        const code = this.customCode.value.trim();
        if (code && !this.isValidCustomCode(code)) {
            this.customCode.style.borderColor = '#dc3545';  // Vermelho para inválido
        } else {
            this.customCode.style.borderColor = '#ced4da';  // Cinza para válido/vazio
        }
    }

    /**
     * Valida se uma string é uma URL válida
     * @param {string} string - URL a ser validada
     * @returns {boolean} true se válida, false caso contrário
     */
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    /**
     * Valida formato do código personalizado
     * @param {string} code - Código a ser validado
     * @returns {boolean} true se válido, false caso contrário
     */
    isValidCustomCode(code) {
        // 3-20 caracteres: letras, números, _ ou -
        return /^[a-zA-Z0-9_-]{3,20}$/.test(code);
    }

    /**
     * Copia URL encurtada para área de transferência
     * Tenta API moderna, com fallback para método antigo
     */
    copyToClipboard() {
        const shortUrl = document.getElementById('shortUrl').textContent;
        
        // Tenta API moderna Clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shortUrl).then(() => {
                this.showCopySuccess();
            }).catch(() => {
                // Fallback se API moderna falhar
                this.fallbackCopyText(shortUrl);
            });
        } else {
            // Fallback para navegadores antigos
            this.fallbackCopyText(shortUrl);
        }
    }

    /**
     * Método alternativo para copiar texto (navegadores antigos)
     * @param {string} text - Texto a ser copiado
     */
    fallbackCopyText(text) {
        // Cria elemento temporário para seleção
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess();
            } else {
                alert('Erro ao copiar URL');
            }
        } catch (err) {
            alert('Erro ao copiar URL');
        }
        
        document.body.removeChild(textArea);
    }

    /**
     * Exibe feedback visual de cópia bem-sucedida
     * Altera temporariamente aparência do botão
     */
    showCopySuccess() {
        const originalText = this.copyBtn.textContent;
        const originalBg = this.copyBtn.style.background;
        
        // Altera para estado de sucesso
        this.copyBtn.textContent = '✅ Copiado!';
        this.copyBtn.style.background = '#28a745';
        
        // Restaura estado original após 2 segundos
        setTimeout(() => {
            this.copyBtn.textContent = originalText;
            this.copyBtn.style.background = originalBg || '#667eea';
        }, 2000);
    }

    /**
     * Reseta o formulário para estado inicial
     * Limpa todos os campos e oculta opções avançadas
     */
    reset() {
        // Limpa todos os campos do formulário
        this.form.reset();
        
        // Oculta painel de opções avançadas
        this.advancedPanel.classList.add('hidden');
        this.toggleAdvanced.textContent = '⚙️ Opções Avançadas';
        
        // Restaura cores padrão dos campos
        this.urlInput.style.borderColor = '#588ad6';
        this.customCode.style.borderColor = '#ced4da';
        
        // Notifica aplicação principal
        this.dispatchEvent('resetForm');
    }

    /**
     * Dispara evento customizado para comunicação com aplicação principal
     * @param {string} eventName - Nome do evento
     * @param {*} data - Dados a serem enviados com o evento
     */
    dispatchEvent(eventName, data = null) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }
}