// Aplicação Principal do Admin
class AdminApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        
        this.bindNavigation();
        this.showSection('dashboard');
        this.loadInitialData();
        this.initialized = true;
    }

    bindNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.showSection(section);
                
                // Atualizar navegação ativa
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    showSection(sectionName) {
        // Esconder todas as seções
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Mostrar seção selecionada
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Carregar dados específicos da seção
            this.loadSectionData(sectionName);
        }
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                if (window.adminDashboard) {
                    window.adminDashboard.loadDashboard();
                }
                break;
                
            case 'urls':
                if (window.adminUrls) {
                    window.adminUrls.loadUrls();
                }
                break;
                
            case 'create':
                // Seção de criar não precisa carregar dados
                break;
                
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    loadInitialData() {
        // Carregar dashboard por padrão
        if (window.adminDashboard) {
            window.adminDashboard.loadDashboard();
        }
    }

    loadSettings() {
        // Configurar event listeners para configurações
        this.bindSettingsEvents();
    }

    bindSettingsEvents() {
        // Limpeza manual
        const cleanupBtn = document.getElementById('cleanupBtn');
        if (cleanupBtn && !cleanupBtn.hasEventListener) {
            cleanupBtn.addEventListener('click', async () => {
                if (confirm('Executar limpeza de URLs expiradas?')) {
                    try {
                        const response = await window.adminAPI.cleanExpiredUrls();
                        if (response.success) {
                            window.adminAuth.showToast(
                                `Limpeza concluída! ${response.data.deletedCount} URLs removidas.`,
                                'success'
                            );
                        }
                    } catch (error) {
                        window.adminAuth.showToast('Erro na limpeza: ' + error.message, 'error');
                    }
                }
            });
            cleanupBtn.hasEventListener = true;
        }

        // Exportar dados
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn && !exportBtn.hasEventListener) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
            exportBtn.hasEventListener = true;
        }

        // Backup
        const backupBtn = document.getElementById('backupBtn');
        if (backupBtn && !backupBtn.hasEventListener) {
            backupBtn.addEventListener('click', () => {
                window.adminAuth.showToast('Funcionalidade de backup em desenvolvimento', 'warning');
            });
            backupBtn.hasEventListener = true;
        }
    }

    async exportData() {
        try {
            // Buscar todas as URLs
            const response = await window.adminAPI.getAllUrls({ limit: 10000 });
            
            if (response.success) {
                const urls = response.data.urls;
                
                // Converter para CSV
                const csvContent = this.convertToCSV(urls);
                
                // Download do arquivo
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                link.setAttribute('href', url);
                link.setAttribute('download', `urls_export_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                window.adminAuth.showToast('Dados exportados com sucesso!', 'success');
            }
        } catch (error) {
            window.adminAuth.showToast('Erro ao exportar dados: ' + error.message, 'error');
        }
    }

    convertToCSV(urls) {
        if (!urls || urls.length === 0) {
            return 'Nenhum dado para exportar';
        }

        const headers = [
            'ID', 'URL Original', 'Código', 'Título', 'Descrição', 
            'Cliques', 'Status', 'Criado em', 'Expira em', 'IP do Usuário'
        ];

        const csvRows = [headers.join(',')];

        urls.forEach(url => {
            const row = [
                url.id,
                `"${url.original_url}"`,
                url.short_code,
                `"${url.title || ''}"`,
                `"${url.description || ''}"`,
                url.clicks,
                url.status,
                `"${url.created_at}"`,
                `"${url.expires_at || ''}"`,
                url.user_ip || ''
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    // Método para atualizar dados em tempo real (futuro)
    startRealTimeUpdates() {
        // Implementar WebSocket ou polling para atualizações em tempo real
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                window.adminDashboard?.loadDashboard();
            }
        }, 30000); // Atualizar a cada 30 segundos
    }
}

// Event listeners globais
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar aplicação principal
    window.adminApp = new AdminApp();

    // Inicializar se já autenticado
    if (window.adminAuth && window.adminAuth.token) {
        window.adminApp.initialize();
    }
    
    // Adicionar estilos para o resultado da criação
    const resultStyles = `
        .create-result {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border-left: 4px solid #28a745;
        }

        .create-result h3 {
            color: #28a745;
            margin-bottom: 20px;
        }

        .result-item {
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #f1f3f4;
        }

        .result-item:last-child {
            border-bottom: none;
        }

        .result-item strong {
            color: #495057;
            margin-right: 10px;
        }

        .result-item a {
            color: #588ad6;
            text-decoration: none;
        }

        .result-item a:hover {
            text-decoration: underline;
        }

        .qr-result {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #f1f3f4;
        }

        .qr-result img {
            border: 2px solid #588ad6;
            border-radius: 8px;
            padding: 10px;
            background: white;
        }
    `;

    const style = document.createElement('style');
    style.textContent = resultStyles;
    document.head.appendChild(style);
});

// Funções utilitárias globais
window.adminUtils = {
    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatNumber: (num) => {
        return new Intl.NumberFormat('pt-BR').format(num);
    },
    
    truncateText: (text, maxLength = 50) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
};