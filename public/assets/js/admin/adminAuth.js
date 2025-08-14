// Autenticação do Admin
class AdminAuth {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        this.initializeAuth();
    }

    initializeAuth() {
        if (this.token) {
            this.showAdminPanel();
        } else {
            this.showLoginScreen();
        }
    }

    async login(username, password) {
        // Mostrar loading
        this.setLoginLoading(true);
        
        try {
            const response = await fetch('/admin/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                localStorage.setItem('adminToken', this.token);
                this.showAdminPanel();
                this.showToast('Login realizado com sucesso!', 'success');
                return true;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showToast('Erro ao fazer login: ' + error.message, 'error');
            return false;
        } finally {
            // Esconder loading
            this.setLoginLoading(false);
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('adminToken');
        this.showLoginScreen();
        this.showToast('Logout realizado com sucesso!', 'success');
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
    }

    async showAdminPanel() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        
        // Carregar informações do usuário
        await this.loadUserInfo();
        
        // Inicializar painel admin
        if (window.adminApp) {
            window.adminApp.initialize();
        }
    }

    async loadUserInfo() {
        try {
            const response = await window.adminAPI.getMe();
            
            if (response.success && response.user) {
                const userName = response.user.full_name || response.user.fullName || response.user.username || 'Usuário';
                
                const userNameElement = document.getElementById('adminUserName');
                if (userNameElement) {
                    userNameElement.textContent = `👤 ${userName}`;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar informações do usuário:', error);
            
            // Manter texto padrão em caso de erro
            const userNameElement = document.getElementById('adminUserName');
            if (userNameElement) {
                userNameElement.textContent = '👤 Usuário';
            }
        }
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // Controle do loading no login
    setLoginLoading(loading) {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        if (loading) {
            // Desabilitar campos e botão
            loginBtn.disabled = true;
            usernameField.disabled = true;
            passwordField.disabled = true;
            
            // Alterar texto do botão e adicionar spinner
            loginBtn.innerHTML = `
                <div class="loading-spinner"></div>
                <span>Entrando...</span>
            `;
            loginBtn.classList.add('loading');
        } else {
            // Reabilitar campos e botão
            loginBtn.disabled = false;
            usernameField.disabled = false;
            passwordField.disabled = false;
            
            // Restaurar texto original
            loginBtn.innerHTML = 'Entrar';
            loginBtn.classList.remove('loading');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        // Mostrar toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Remover toast após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
}

// Inicializar autenticação quando página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.adminAuth = new AdminAuth();

    // Event listeners para login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');

            errorDiv.classList.add('hidden');

            const success = await window.adminAuth.login(username, password);
            
            if (!success) {
                errorDiv.textContent = 'Credenciais inválidas';
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // Event listener para logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Deseja realmente sair?')) {
                window.adminAuth.logout();
            }
        });
    }
});