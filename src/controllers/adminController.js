const AdminService = require('../services/adminService');

class AdminController {
    // Listar todas as URLs com filtros
    static async getAllUrls(req, res) {
        try {
            const { status, search, page = 1, limit = 20, sortBy = 'created_at', order = 'DESC' } = req.query;
            
            const result = await AdminService.getAllUrls({
                status,
                search,
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                order
            });
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Obter estatísticas do sistema
    static async getStats(req, res) {
        try {
            const stats = await AdminService.getSystemStats();
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Criar nova URL (admin)
    static async createUrl(req, res) {
        try {
            const urlData = req.body;
            const result = await AdminService.createUrl(urlData);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Atualizar URL existente
    static async updateUrl(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            const result = await AdminService.updateUrl(id, updateData);
            
            res.json({
                success: true,
                data: result,
                message: 'URL atualizada com sucesso'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Deletar URL (definitivo)
    static async deleteUrl(req, res) {
        try {
            const { id } = req.params;
            
            await AdminService.deleteUrl(id);
            
            res.json({
                success: true,
                message: 'URL deletada com sucesso'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Ativar/Desativar URL
    static async toggleUrlStatus(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            
            const result = await AdminService.toggleUrlStatus(id, is_active);
            
            res.json({
                success: true,
                data: result,
                message: `URL ${is_active ? 'ativada' : 'desativada'} com sucesso`
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Obter detalhes de uma URL específica
    static async getUrlDetails(req, res) {
        try {
            const { id } = req.params;
            
            const result = await AdminService.getUrlDetails(id);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    // Limpar URLs expiradas
    static async cleanExpiredUrls(req, res) {
        try {
            const result = await AdminService.cleanExpiredUrls();
            
            res.json({
                success: true,
                data: result,
                message: `${result.deletedCount} URLs expiradas removidas`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // ==== AUTENTICAÇÃO ====
    
    // Login de usuário admin
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Username e senha são obrigatórios'
                });
            }
            
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            
            const result = await AdminService.authenticate(username, password, ipAddress, userAgent);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Login realizado com sucesso',
                    token: result.token,
                    user: result.user
                });
            } else {
                res.status(401).json({
                    success: false,
                    error: result.error || 'Credenciais inválidas'
                });
            }
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }
    
    // Logout do usuário
    static async logout(req, res) {
        try {
            const token = req.token; // Token definido pelo middleware
            
            const result = await AdminService.logout(token);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Logout realizado com sucesso'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao fazer logout'
            });
        }
    }
    
    // Verificar status do usuário logado
    static async me(req, res) {
        try {
            res.json({
                success: true,
                user: req.user // Usuário definido pelo middleware
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erro ao obter informações do usuário'
            });
        }
    }
    
    // ==== GERENCIAMENTO DE USUÁRIOS ====
    
    // Listar todos os usuários admin
    static async getAllAdminUsers(req, res) {
        try {
            const result = await AdminService.getAllUsers();
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.users
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Criar novo usuário admin
    static async createAdminUser(req, res) {
        try {
            const { username, email, password, fullName } = req.body;
            
            const result = await AdminService.createUser({
                username,
                email,
                password,
                fullName
            });
            
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'Usuário criado com sucesso',
                    data: {
                        id: result.userId,
                        username: result.username,
                        email: result.email,
                        fullName: result.fullName
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Ativar/Desativar usuário admin
    static async toggleAdminUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            
            if (is_active === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro is_active é obrigatório'
                });
            }
            
            const result = await AdminService.toggleUserStatus(id, is_active);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: `Usuário ${is_active ? 'ativado' : 'desativado'} com sucesso`
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Alterar senha do usuário logado
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Senha atual e nova senha são obrigatórias'
                });
            }
            
            const result = await AdminService.changePassword(
                req.user.id, 
                currentPassword, 
                newPassword
            );
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Senha alterada com sucesso. Faça login novamente.'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Limpeza de sessões expiradas
    static async cleanSessions(req, res) {
        try {
            const result = await AdminService.cleanExpiredSessions();
            
            if (result.success) {
                res.json({
                    success: true,
                    message: `${result.deletedCount} sessões expiradas removidas`
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = AdminController;