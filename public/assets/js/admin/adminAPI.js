// API Client para Admin
class AdminAPI {
    constructor() {
        this.baseURL = window.location.origin;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/admin/api${endpoint}`;
        
        const config = {
            headers: window.adminAuth.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    // Autenticação e usuário
    async getMe() {
        return this.request('/me');
    }

    // Estatísticas
    async getStats() {
        return this.request('/stats');
    }

    // URLs
    async getAllUrls(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/urls?${params}`);
    }

    async getUrlDetails(id) {
        return this.request(`/urls/${id}`);
    }

    async createUrl(urlData) {
        return this.request('/urls', {
            method: 'POST',
            body: JSON.stringify(urlData)
        });
    }

    async updateUrl(id, updateData) {
        return this.request(`/urls/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async deleteUrl(id) {
        return this.request(`/urls/${id}`, {
            method: 'DELETE'
        });
    }

    async toggleUrlStatus(id, isActive) {
        return this.request(`/urls/${id}/toggle`, {
            method: 'PATCH',
            body: JSON.stringify({ is_active: isActive })
        });
    }

    // Utilitários
    async cleanExpiredUrls() {
        return this.request('/cleanup/expired', {
            method: 'DELETE'
        });
    }
}

// Inicializar API
window.adminAPI = new AdminAPI();