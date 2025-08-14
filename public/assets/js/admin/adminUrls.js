// Gerenciamento de URLs - Admin Otimizado
class AdminUrls {
    constructor() {
        this.currentPage = 1;
        this.currentFilters = {};
        this.isLoading = false;
        this.cache = new Map();
        this.cacheTimeout = 60 * 1000; // 1 minuto
        this.searchDebounceTimer = null;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.tableBody = document.getElementById('urlsTableBody');
        this.pageInfo = document.getElementById('pageInfo');
        this.prevBtn = document.getElementById('prevPageBtn');
        this.nextBtn = document.getElementById('nextPageBtn');
        
        // Filtros
        this.statusFilter = document.getElementById('statusFilter');
        this.searchFilter = document.getElementById('searchFilter');
        this.sortFilter = document.getElementById('sortFilter');
        
        // Modal
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editUrlForm');
    }

    bindEvents() {
        // Filtros
        this.statusFilter.addEventListener('change', () => this.applyFilters());
        this.searchFilter.addEventListener('input', this.debounce(() => this.applyFilters(), 500));
        this.sortFilter.addEventListener('change', () => this.applyFilters());
        
        // Paginação
        this.prevBtn.addEventListener('click', () => this.changePage(-1));
        this.nextBtn.addEventListener('click', () => this.changePage(1));
        
        // Botões de ação
        document.getElementById('refreshUrlsBtn').addEventListener('click', () => this.loadUrls());
        document.getElementById('cleanExpiredBtn').addEventListener('click', () => this.cleanExpiredUrls());
        
        // Modal
        this.editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        document.querySelector('.modal-close').addEventListener('click', () => this.closeEditModal());
        // Event Delegation para os botões de ação da tabela
        this.tableBody.addEventListener('click', (e) => this.handleTableActions(e));
        
        // Toggle opções avançadas na criação
        const toggleAdvancedBtn = document.getElementById('toggleAdvancedCreate');
        const advancedPanel = document.getElementById('advancedCreatePanel');
        if (toggleAdvancedBtn && advancedPanel) {
            toggleAdvancedBtn.addEventListener('click', () => {
                advancedPanel.classList.toggle('hidden');
                const isHidden = advancedPanel.classList.contains('hidden');
                toggleAdvancedBtn.textContent = isHidden ? '⚙️ Opções Avançadas' : '⚙️ Ocultar Opções';
            });
        }
        
        // Criar URL
        const createForm = document.getElementById('createUrlForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateSubmit(e));
        }
    }

    async loadUrls() {
        try {
            this.showLoading(true);
            
            const filters = {
                ...this.currentFilters,
                page: this.currentPage,
                limit: 20
            };

            const response = await window.adminAPI.getAllUrls(filters);
            
            if (response.success) {
                this.renderUrls(response.data.urls);
                this.updatePagination(response.data.pagination);
            }
        } catch (error) {
            window.adminAuth.showToast('Erro ao carregar URLs: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderUrls(urls) {
        if (!urls || urls.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #6c757d;">
                        Nenhuma URL encontrada
                    </td>
                </tr>
            `;
            return;
        }

        const html = urls.map(url => `
            <tr>
                <td>${url.id}</td>
                <td>
                    <div class="text-truncate" title="${url.original_url}">
                        ${url.original_url}
                    </div>
                </td>
                <td>
                    <code>/${url.short_code}</code>
                </td>
                <td>${url.title || '-'}</td>
                <td>${url.clicks}</td>
                <td>
                    <span class="status-badge status-${url.status}">
                        ${this.getStatusText(url.status)}
                    </span>
                </td>
                <td>${url.created_at}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-edit" data-action="edit" data-id="${url.id}" title="Editar URL">
                            ✏️
                        </button>
                        <button class="btn-sm btn-toggle ${url.is_active ? '' : 'inactive'}"
                                data-action="toggle" data-id="${url.id}" data-status="${!url.is_active}"
                                title="${url.is_active ? 'Desativar URL' : 'Ativar URL'}">
                            ${url.is_active ? '🔴' : '🟢'}
                        </button>
                        <button class="btn-sm btn-delete" data-action="delete" data-id="${url.id}" title="Deletar URL">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.tableBody.innerHTML = html;
    }

    handleTableActions(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (action === 'edit') {
            this.editUrl(id);
        } else if (action === 'toggle') {
            this.toggleUrl(id, button.dataset.status === 'true');
        } else if (action === 'delete') {
            this.deleteUrl(id);
        }
    }

    updatePagination(pagination) {
        this.pageInfo.textContent = `Página ${pagination.page} de ${pagination.totalPages}`;
        this.prevBtn.disabled = pagination.page <= 1;
        this.nextBtn.disabled = pagination.page >= pagination.totalPages;
    }

    applyFilters() {
        this.currentFilters = {
            status: this.statusFilter.value,
            search: this.searchFilter.value,
            sortBy: this.sortFilter.value.split(':')[0],
            order: this.sortFilter.value.split(':')[1]
        };
        
        this.currentPage = 1;
        this.loadUrls();
    }

    changePage(direction) {
        this.currentPage += direction;
        this.loadUrls();
    }

    async editUrl(id) {
        if (this.isLoading) return;
        try {
            const response = await window.adminAPI.getUrlDetails(id);
            
            if (response.success) {
                const url = response.data.url;
                
                // Preencher formulário
                document.getElementById('editId').value = url.id;
                document.getElementById('editUrl').value = url.original_url;
                document.getElementById('editCode').value = url.short_code;
                document.getElementById('editTitle').value = url.title || '';
                document.getElementById('editDescription').value = url.description || '';
                document.getElementById('editActive').value = url.is_active ? '1' : '0';
                
                // Calcular horas até expiração
                if (url.expires_at) {
                    // Idealmente, o backend deveria enviar a data em formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
                    // Isso evita a necessidade de manipulação de string e é universalmente compatível com `new Date()`.
                    const now = new Date();
                    const expires = new Date(url.expires_at); // Se o backend enviar em formato ISO
                    const hoursLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60)));
                    document.getElementById('editExpires').value = hoursLeft;
                } else {
                    document.getElementById('editExpires').value = 0;
                }
                
                this.editModal.classList.remove('hidden');
            }
        } catch (error) {
            window.adminAuth.showToast('Erro ao carregar URL: ' + error.message, 'error');
        }
    }

    async handleEditSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('editId').value;
        const updateData = {
            url: document.getElementById('editUrl').value,
            shortCode: document.getElementById('editCode').value,
            title: document.getElementById('editTitle').value,
            description: document.getElementById('editDescription').value,
            expiresIn: parseInt(document.getElementById('editExpires').value) || 0,
            isActive: document.getElementById('editActive').value === '1'
        };

        try {
            const response = await window.adminAPI.updateUrl(id, updateData);
            
            if (response.success) {
                window.adminAuth.showToast('URL atualizada com sucesso!', 'success');
                this.closeEditModal();
                this.loadUrls();
            }
        } catch (error) {
            window.adminAuth.showToast('Erro ao atualizar URL: ' + error.message, 'error');
        }
    }

    async toggleUrl(id, newStatus) {
        try {
            const response = await window.adminAPI.toggleUrlStatus(id, newStatus);
            
            if (response.success) {
                window.adminAuth.showToast(
                    `URL ${newStatus ? 'ativada' : 'desativada'} com sucesso!`, 
                    'success'
                );
                this.loadUrls();
            }
        } catch (error) {
            window.adminAuth.showToast('Erro ao alterar status: ' + error.message, 'error');
        }
    }

    async deleteUrl(id) {
        if (!confirm('Tem certeza que deseja deletar esta URL? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await window.adminAPI.deleteUrl(id);
            
            if (response.success) {
                window.adminAuth.showToast('URL deletada com sucesso!', 'success');
                this.loadUrls();
                
                // Atualizar dashboard sem cache
                if (window.adminDashboard) {
                    window.adminDashboard.refreshDashboard();
                }
            }
        } catch (error) {
            window.adminAuth.showToast('Erro ao deletar URL: ' + error.message, 'error');
        }
    }

    async cleanExpiredUrls() {
        if (!confirm('Tem certeza que deseja remover todas as URLs expiradas?')) {
            return;
        }

        try {
            const response = await window.adminAPI.cleanExpiredUrls();
            
            if (response.success) {
                window.adminAuth.showToast(
                    `${response.data.deletedCount} URLs expiradas removidas!`, 
                    'success'
                );
                this.loadUrls();
                
                // Atualizar dashboard sem cache
                if (window.adminDashboard) {
                    window.adminDashboard.refreshDashboard();
                }
            }
        } catch (error) {
            window.adminAuth.showToast('Erro ao limpar URLs: ' + error.message, 'error');
        }
    }

    async handleCreateSubmit(e) {
        e.preventDefault();
        
        // Obter valor selecionado do radio button
        const expiresInRadio = document.querySelector('input[name="expiresIn"]:checked');
        const expiresIn = expiresInRadio ? parseInt(expiresInRadio.value) : 24;
        
        const urlData = {
            url: document.getElementById('createUrl').value,
            customCode: document.getElementById('createCode').value,
            title: document.getElementById('createTitle').value,
            description: document.getElementById('createDescription').value,
            expiresIn: expiresIn
        };

        try {
            const response = await window.adminAPI.createUrl(urlData);
            
            if (response.success) {
                window.adminAuth.showToast('URL criada com sucesso!', 'success');
                
                // Mostrar resultado
                this.showCreateResult(response.data);
                
                // Limpar formulário
                e.target.reset();
                
                // Atualizar lista se estiver na aba URLs
                if (document.getElementById('urls').classList.contains('active')) {
                    this.loadUrls();
                }
            }
        } catch (error) {
            window.adminAuth.showToast('Erro ao criar URL: ' + error.message, 'error');
        }
    }

    showCreateResult(data) {
        const resultDiv = document.getElementById('createResult');
        
        const html = `
            <h3>✅ URL criada com sucesso!</h3>
            <div class="result-item">
                <strong>URL Original:</strong> ${data.originalUrl}
            </div>
            <div class="result-item">
                <strong>URL Encurtada:</strong> 
                <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>
                <button onclick="navigator.clipboard.writeText('${data.shortUrl}')" class="btn-sm">📋</button>
            </div>
            ${data.title ? `<div class="result-item"><strong>Título:</strong> ${data.title}</div>` : ''}
            ${data.expiresAt ? `<div class="result-item"><strong>Expira em:</strong> ${data.expiresAt}</div>` : ''}
            <div class="qr-result">
                <img src="${data.qrCode}" alt="QR Code" style="max-width: 150px;">
            </div>
        `;
        
        resultDiv.innerHTML = html;
        resultDiv.classList.remove('hidden');
        
        // Esconder após 10 segundos
        setTimeout(() => {
            resultDiv.classList.add('hidden');
        }, 10000);
    }

    closeEditModal() {
        this.editModal.classList.add('hidden');
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Ativo',
            'inactive': 'Inativo',
            'expired': 'Expirado',
            'unused': 'Não usado'
        };
        return statusMap[status] || status;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Função global para fechar modal (chamada pelo HTML)
function closeEditModal() {
    window.adminUrls.closeEditModal();
}

// Inicializar
window.adminUrls = new AdminUrls();