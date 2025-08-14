/**
 * ========================================
 * ARQUIVO PRINCIPAL DO FRONTEND (main.js)
 * ========================================
 * 
 * Este arquivo inicializa a aplicação frontend e gerencia:
 * - Coordenação entre componentes
 * - Estados da aplicação (loading, resultado, erro)
 * - Eventos globais
 * - Funções utilitárias do footer
 * 
 * Arquitetura utilizada:
 * - Classe principal (URLShortenerApp) para coordenação
 * - Componentes separados para responsabilidades específicas
 * - Sistema de eventos customizados para comunicação
 */

// ========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ========================================

/**
 * Aguarda o DOM estar totalmente carregado antes de inicializar
 * Garante que todos os elementos HTML estejam disponíveis
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Encurtador de Links Pro...');
    
    // Cria e inicializa a aplicação principal
    new URLShortenerApp();
    
    console.log('✅ Aplicação inicializada com sucesso!');
});

// ========================================
// CLASSE PRINCIPAL DA APLICAÇÃO
// ========================================

/**
 * Classe URLShortenerApp
 * Coordena todos os componentes da aplicação e gerencia estados globais
 */
class URLShortenerApp {
    
    /**
     * Construtor da aplicação
     * Inicializa componentes e configura eventos
     */
    constructor() {
        // URL base da aplicação (ex: http://localhost:8080)
        this.baseURL = window.location.origin;
        
        // Inicializa componentes e eventos
        this.initializeComponents();
        this.bindGlobalEvents();
        
        console.log('🎯 Aplicação configurada para:', this.baseURL);
    }

    /**
     * Inicializa todos os componentes da aplicação
     * Cada componente tem sua responsabilidade específica
     */
    initializeComponents() {
        // Componente do formulário de encurtamento
        this.urlForm = new URLForm(this.baseURL);
        
        // Componente para gerenciar QR codes
        this.qrCode = new QRCodeHandler();
        
        // Componente para gerenciar URLs do usuário
        this.management = new URLManagement(this.baseURL);
        
        // Inicializa elementos globais da interface
        this.initializeGlobalElements();
    }

    /**
     * Obtém referências para elementos HTML usados globalmente
     * Centraliza o acesso aos elementos da interface
     */
    initializeGlobalElements() {
        // Estados visuais da aplicação
        this.loading = document.getElementById('loading');        // Indicador de carregamento
        this.result = document.getElementById('result');          // Área de resultado
        this.error = document.getElementById('error');            // Área de erro
    }

    /**
     * Configura sistema de eventos customizados
     * Permite comunicação entre componentes sem acoplamento direto
     */
    bindGlobalEvents() {
        // Eventos disparados pelos componentes
        document.addEventListener('showLoading', () => this.showLoading());
        document.addEventListener('hideLoading', () => this.hideLoading());
        document.addEventListener('showResult', (e) => this.showResult(e.detail));
        document.addEventListener('showError', (e) => this.showError(e.detail));
        document.addEventListener('resetForm', () => this.resetForm());
    }

    /**
     * Exibe o estado de carregamento
     * Oculta outros estados e mostra spinner
     */
    showLoading() {
        this.hideAll();
        this.loading.classList.remove('hidden');
        console.log('⏳ Processando requisição...');
    }

    /**
     * Oculta o estado de carregamento
     */
    hideLoading() {
        this.loading.classList.add('hidden');
    }

    /**
     * Exibe o resultado do encurtamento
     * @param {Object} data - Dados da URL encurtada
     */
    showResult(data) {
        console.log('✅ URL encurtada com sucesso:', data.shortCode);
        
        this.hideAll();
        this.result.classList.remove('hidden');
        
        // Preenche os dados básicos do resultado
        document.getElementById('originalUrl').textContent = data.originalUrl;
        document.getElementById('shortUrl').textContent = data.shortUrl;
        
        // Configura o QR Code com todos os dados da URL
        this.qrCode.displayQRCode(data.qrCode, data.shortUrl, data);
        
        // Exibe detalhes adicionais se existirem
        if (data.title || data.description || data.expiresAt) {
            this.showResultDetails(data);
        }
    }

    /**
     * Exibe mensagem de erro
     * @param {string} message - Mensagem de erro a ser exibida
     */
    showError(message) {
        console.error('❌ Erro na aplicação:', message);
        
        this.hideAll();
        this.error.classList.remove('hidden');
        document.getElementById('errorMessage').textContent = message;
    }

    /**
     * Reseta a aplicação para o estado inicial
     * Limpa formulários e oculta resultados
     */
    resetForm() {
        console.log('🔄 Resetando aplicação...');
        
        this.hideAll();
        this.urlForm.reset();
    }

    /**
     * Oculta todos os estados visuais
     * Método utilitário para limpar a interface
     */
    hideAll() {
        this.loading.classList.add('hidden');
        this.result.classList.add('hidden');
        this.error.classList.add('hidden');
    }

    /**
     * Exibe detalhes adicionais da URL (título, descrição, expiração)
     * @param {Object} data - Dados da URL com metadados
     */
    showResultDetails(data) {
        const resultDetails = document.getElementById('resultDetails');
        let detailsHTML = '';

        // Adiciona título se existir
        if (data.title) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">Título:</span>
                    <span>${this.escapeHtml(data.title)}</span>
                </div>`;
        }
        
        // Adiciona descrição se existir
        if (data.description) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">Descrição:</span>
                    <span>${this.escapeHtml(data.description)}</span>
                </div>`;
        }
        
        // Adiciona data de expiração se existir
        if (data.expiresAt) {
            const expirationDate = new Date(data.expiresAt).toLocaleString('pt-BR');
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">Expira em:</span>
                    <span>${expirationDate}</span>
                </div>`;
        }

        resultDetails.innerHTML = detailsHTML;
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} text - Texto a ser escapado
     * @returns {string} Texto seguro para HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ========================================
// FUNÇÕES GLOBAIS DO FOOTER
// ========================================

/**
 * Copia email para a área de transferência
 * @param {Event} event - Evento do clique
 */
function copyEmail(event) {
    event.preventDefault();
    const email = 'luis@pieritech.com.br';
    
    // Tenta usar a API moderna Clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(() => {
            showToast('📧 Email copiado para a área de transferência!');
        }).catch(() => {
            // Fallback para método antigo se a API falhar
            fallbackCopyText(email);
        });
    } else {
        // Fallback para navegadores antigos
        fallbackCopyText(email);
    }
}

/**
 * Abre perfil no LinkedIn em nova aba
 */
function openLinkedIn() {
    window.open('https://linkedin.com/in/luispieri', '_blank');
}

/**
 * Abre conversa no WhatsApp com mensagem pré-definida
 * @param {Event} event - Evento do clique
 */
function openWhatsApp(event) {
    event.preventDefault();
    const phoneNumber = '5512997533555';
    const message = encodeURIComponent('Olá! Vim através do seu encurtador de links.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
}

/**
 * Abre perfil no GitHub em nova aba
 */
function openGitHub() {
    window.open('https://github.com/luispieri', '_blank');
}

/**
 * Método alternativo para copiar texto (para navegadores antigos)
 * @param {string} text - Texto a ser copiado
 */
function fallbackCopyText(text) {
    // Cria elemento temporário para seleção
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';  // Evita scroll
    textArea.style.opacity = '0';       // Invisível
    
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        // Executa comando de cópia (método antigo)
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('📧 Email copiado para a área de transferência!');
        } else {
            showToast('❌ Erro ao copiar email');
        }
    } catch (err) {
        console.error('Erro ao copiar:', err);
        showToast('❌ Erro ao copiar email');
    }
    
    // Remove elemento temporário
    document.body.removeChild(textArea);
}

/**
 * Exibe notificação toast temporária
 * @param {string} message - Mensagem a ser exibida
 */
function showToast(message) {
    // Cria elemento toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Adiciona ao DOM
    document.body.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        // Remove do DOM após animação
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}