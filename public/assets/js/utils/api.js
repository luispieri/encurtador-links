// Utilitários para comunicação com API
class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };

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

    async shortenUrl(urlData) {
        return this.request('/api/shorten', {
            method: 'POST',
            body: JSON.stringify(urlData),
        });
    }

    async getUserUrls() {
        return this.request('/api/manage');
    }

    async deleteUrl(id) {
        return this.request(`/api/delete/${id}`, {
            method: 'DELETE',
        });
    }

    async getStats(code) {
        return this.request(`/api/stats/${code}`);
    }
}