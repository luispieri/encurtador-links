// Componente para gerenciamento de QR Codes
class QRCodeHandler {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.qrCode = document.getElementById('qrCode');
        this.qrContainer = document.getElementById('qrCodeContainer');
        this.downloadQR = document.getElementById('downloadQR');
        this.currentQRData = null;
        this.currentUrl = null;
    }

    bindEvents() {
        this.downloadQR.addEventListener('click', () => this.downloadQRCode());
    }

    displayQRCode(qrDataUrl, url, urlData = {}) {
        this.currentQRData = qrDataUrl;
        this.currentUrl = url;
        this.currentUrlData = urlData; // Armazenar dados adicionais (title, shortCode, etc)
        
        this.qrCode.src = qrDataUrl;
        this.qrCode.alt = `QR Code para ${url}`;
        this.qrContainer.classList.remove('hidden');
    }

    downloadQRCode() {
        if (!this.currentQRData) return;

        try {
            // Criar link temporário para download
            const link = document.createElement('a');
            link.href = this.currentQRData;
            link.download = `qrcode-${this.generateFileName()}.png`;
            
            // Adicionar ao DOM temporariamente e clicar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showDownloadSuccess();
        } catch (error) {
            console.error('Erro ao baixar QR Code:', error);
            alert('Erro ao baixar QR Code');
        }
    }

    generateFileName() {
        // Lógica de nomenclatura inteligente:
        // 1. Se tem título: qrcode-titulo
        // 2. Se não tem título mas tem código personalizado: qrcode-codigo_personalizado  
        // 3. Se não tem nem título nem código personalizado: qrcode-codigo_aleatorio
        
        let fileName = 'qrcode';
        
        if (this.currentUrlData && this.currentUrlData.title) {
            // Usar o título se disponível
            const cleanTitle = this.currentUrlData.title
                .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
                .replace(/\s+/g, '_') // Substitui espaços por underline
                .toLowerCase();
            fileName += `-${cleanTitle}`;
        } else if (this.currentUrlData && this.currentUrlData.shortCode) {
            // Usar o código (personalizado ou aleatório)
            fileName += `-${this.currentUrlData.shortCode}`;
        } else if (this.currentUrl) {
            // Fallback: extrair código da URL
            try {
                const url = new URL(this.currentUrl);
                const code = url.pathname.substring(1) || 'link';
                fileName += `-${code}`;
            } catch (e) {
                fileName += `-${Date.now()}`;
            }
        } else {
            // Último recurso: timestamp
            fileName += `-${Date.now()}`;
        }
        
        return fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    showDownloadSuccess() {
        const originalText = this.downloadQR.textContent;
        const originalBg = this.downloadQR.style.background;
        
        this.downloadQR.textContent = '✅ Baixado!';
        this.downloadQR.style.background = '#28a745';
        
        setTimeout(() => {
            this.downloadQR.textContent = originalText;
            this.downloadQR.style.background = originalBg;
        }, 2000);
    }

    hide() {
        this.qrContainer.classList.add('hidden');
        this.currentQRData = null;
        this.currentUrl = null;
        this.currentUrlData = null;
    }

    // Método para gerar QR Code em modal (futuro)
    showModal(qrDataUrl, url) {
        // Implementar modal para QR Code se necessário
        console.log('Mostrar QR Code em modal:', url);
    }
}