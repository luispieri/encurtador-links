const moment = require('moment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cache = require('../utils/cache');
const AdminModel = require('../models/adminModel');
const QrService = require('./qrService');
const { generateShortCode } = require('../utils/urlGenerator');
const { isValidUrl, isValidCustomCode } = require('../utils/validator');

// Configurações de segurança
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 12;

class AdminService {
    // Obter todas as URLs com filtros (com cache)
    static async getAllUrls(filters) {
        // Criar chave do cache baseada nos filtros
        const cacheKey = `urls_${JSON.stringify(filters || {})}`;
        
        // Tentar buscar no cache primeiro
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        
        // Se não estiver no cache, buscar no banco
        const result = await AdminModel.getAllUrls(filters);
        
        // Formatar datas e adicionar informações de status
        result.urls = result.urls.map(url => ({
            ...url,
            created_at: moment(url.created_at).format('DD/MM/YYYY HH:mm'),
            expires_at: url.expires_at ? moment(url.expires_at).format('DD/MM/YYYY HH:mm') : null,
            status: this.getUrlStatus(url),
            is_expired: url.expires_at ? moment().isAfter(moment(url.expires_at)) : false
        }));
        
        // Cache por 2 minutos (URLs podem mudar)
        cache.set(cacheKey, result, 120);
        
        return result;
    }
    
    // Obter estatísticas do sistema (com cache)
    static async getSystemStats() {
        const cacheKey = 'system_stats';
        
        // Tentar buscar no cache primeiro  
        const cachedStats = cache.get(cacheKey);
        if (cachedStats) {
            return cachedStats;
        }
        
        // Se não estiver no cache, buscar no banco
        const stats = await AdminModel.getSystemStats();
        
        // Formatar dados de atividade semanal
        stats.weekly_activity = stats.weekly_activity.map(day => ({
            ...day,
            date: moment(day.date).format('DD/MM')
        }));
        
        // Cache por 5 minutos (estatísticas mudam menos)
        cache.set(cacheKey, stats, 300);
        
        return stats;
    }
    
    // Criar nova URL (admin)
    static async createUrl(urlData) {
        const { url, customCode, title, description, expiresIn } = urlData;
        
        // Validações
        if (!isValidUrl(url)) {
            throw new Error('URL inválida');
        }
        
        let shortCode = customCode;
        let isCustom = false;
        
        if (customCode) {
            if (!isValidCustomCode(customCode)) {
                throw new Error('Código personalizado inválido. Use 3-20 caracteres: letras, números, _ ou -');
            }
            
            const exists = await AdminModel.shortCodeExists(customCode);
            if (exists) {
                throw new Error('Código personalizado já está em uso');
            }
            isCustom = true;
        } else {
            // Gerar código único
            do {
                shortCode = generateShortCode();
                const exists = await AdminModel.shortCodeExists(shortCode);
                if (!exists) break;
            } while (true);
        }
        
        // Calcular expiração
        let expiresAt = null;
        if (expiresIn && expiresIn > 0) {
            expiresAt = moment().add(expiresIn, 'hours').format('YYYY-MM-DD HH:mm:ss');
        }
        
        const result = await AdminModel.createUrl({
            originalUrl: url,
            shortCode,
            customCode: isCustom,
            title: title || null,
            description: description || null,
            expiresAt
        });
        
        // Gerar QR Code
        const baseUrl = 'http://localhost:8080'; // TODO: pegar do config
        const shortUrl = `${baseUrl}/${shortCode}`;
        const qrCode = await QrService.generateQRCode(shortUrl);
        
        // Limpar cache quando nova URL é criada
        cache.delete('system_stats');
        
        return {
            id: result.insertId,
            originalUrl: url,
            shortCode,
            shortUrl,
            title,
            description,
            expiresAt,
            qrCode,
            createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
        };
    }
    
    // Atualizar URL existente
    static async updateUrl(id, updateData) {
        const { url, shortCode, title, description, expiresIn, isActive } = updateData;
        
        // Verificar se URL existe
        const existingUrl = await AdminModel.findById(id);
        if (!existingUrl) {
            throw new Error('URL não encontrada');
        }
        
        // Validações
        if (url && !isValidUrl(url)) {
            throw new Error('URL inválida');
        }
        
        if (shortCode && !isValidCustomCode(shortCode)) {
            throw new Error('Código inválido. Use 3-20 caracteres: letras, números, _ ou -');
        }
        
        // Verificar se shortCode não está em uso por outra URL
        if (shortCode && shortCode !== existingUrl.short_code) {
            const exists = await AdminModel.shortCodeExists(shortCode, id);
            if (exists) {
                throw new Error('Código já está em uso por outra URL');
            }
        }
        
        // Calcular expiração
        let expiresAt = existingUrl.expires_at;
        if (expiresIn !== undefined) {
            expiresAt = expiresIn && expiresIn > 0 
                ? moment().add(expiresIn, 'hours').format('YYYY-MM-DD HH:mm:ss')
                : null;
        }
        
        const dataToUpdate = {
            originalUrl: url || existingUrl.original_url,
            shortCode: shortCode || existingUrl.short_code,
            title: title !== undefined ? title : existingUrl.title,
            description: description !== undefined ? description : existingUrl.description,
            expiresAt,
            isActive: isActive !== undefined ? isActive : existingUrl.is_active
        };
        
        await AdminModel.updateUrl(id, dataToUpdate);
        
        // Retornar dados atualizados
        const updatedUrl = await AdminModel.findById(id);
        return {
            ...updatedUrl,
            status: this.getUrlStatus(updatedUrl)
        };
    }
    
    // Deletar URL
    static async deleteUrl(id) {
        const existingUrl = await AdminModel.findById(id);
        if (!existingUrl) {
            throw new Error('URL não encontrada');
        }
        
        return await AdminModel.deleteUrl(id);
    }
    
    // Alternar status da URL
    static async toggleUrlStatus(id, isActive) {
        const existingUrl = await AdminModel.findById(id);
        if (!existingUrl) {
            throw new Error('URL não encontrada');
        }
        
        await AdminModel.toggleUrlStatus(id, isActive);
        
        const updatedUrl = await AdminModel.findById(id);
        return {
            ...updatedUrl,
            status: this.getUrlStatus(updatedUrl)
        };
    }
    
    // Obter detalhes de uma URL
    static async getUrlDetails(id) {
        const details = await AdminModel.getUrlDetails(id);
        
        // Formatar dados
        details.url.created_at = moment(details.url.created_at).format('DD/MM/YYYY HH:mm');
        details.url.expires_at = details.url.expires_at 
            ? moment(details.url.expires_at).format('DD/MM/YYYY HH:mm') 
            : null;
        details.url.status = this.getUrlStatus(details.url);
        
        // Formatar cliques recentes
        details.recent_clicks = details.recent_clicks.map(click => ({
            ...click,
            clicked_at: moment(click.clicked_at).format('DD/MM/YYYY HH:mm'),
            user_agent_short: this.shortenUserAgent(click.user_agent)
        }));
        
        details.stats.last_click = details.stats.last_click 
            ? moment(details.stats.last_click).format('DD/MM/YYYY HH:mm')
            : null;
        
        return details;
    }
    
    // Limpar URLs expiradas
    static async cleanExpiredUrls() {
        return await AdminModel.cleanExpiredUrls();
    }
    
    // ==== MÉTODOS DE AUTENTICAÇÃO ====
    
    // Autenticação via banco de dados
    static async authenticate(username, password, ipAddress = null, userAgent = null) {
        try {
            // Buscar usuário por username ou email
            const user = await AdminModel.findUserByUsername(username) || 
                        await AdminModel.findUserByEmail(username);
            
            if (!user) {
                return { success: false, error: 'Usuário não encontrado' };
            }
            
            if (!user.is_active) {
                return { success: false, error: 'Usuário desativado' };
            }
            
            // Verificar senha
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            
            if (!isValidPassword) {
                return { success: false, error: 'Senha inválida' };
            }
            
            // Gerar JWT token
            const jwtPayload = {
                userId: user.id,
                username: user.username,
                email: user.email
            };
            
            const token = jwt.sign(jwtPayload, JWT_SECRET, { 
                expiresIn: JWT_EXPIRES_IN 
            });
            
            // Criar hash do token para armazenar na sessão
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            
            // Calcular data de expiração
            const expiresAt = moment().add(24, 'hours').format('YYYY-MM-DD HH:mm:ss');
            
            // Salvar sessão no banco
            await AdminModel.createSession({
                userId: user.id,
                tokenHash,
                expiresAt,
                ipAddress,
                userAgent
            });
            
            // Atualizar último login
            await AdminModel.updateLastLogin(user.id);
            
            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name
                }
            };
            
        } catch (error) {
            console.error('Erro na autenticação:', error);
            return { success: false, error: 'Erro interno do servidor' };
        }
    }
    
    // Verificar token JWT
    static async verifyToken(token) {
        try {
            // Verificar JWT
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Criar hash do token para buscar na sessão
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            
            // Verificar se sessão existe e está válida
            const session = await AdminModel.findSessionByToken(tokenHash);
            
            if (!session) {
                return { valid: false, error: 'Sessão inválida ou expirada' };
            }
            
            return {
                valid: true,
                user: {
                    id: decoded.userId,
                    username: decoded.username,
                    email: decoded.email,
                    fullName: session.full_name
                }
            };
            
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return { valid: false, error: 'Token expirado' };
            }
            if (error.name === 'JsonWebTokenError') {
                return { valid: false, error: 'Token inválido' };
            }
            return { valid: false, error: 'Erro na verificação do token' };
        }
    }
    
    // Fazer logout (remover sessão)
    static async logout(token) {
        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            await AdminModel.removeSession(tokenHash);
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Erro ao fazer logout' };
        }
    }
    
    // Criar novo usuário admin
    static async createUser(userData) {
        try {
            const { username, email, password, fullName } = userData;
            
            // Validações básicas
            if (!username || !email || !password) {
                throw new Error('Username, email e senha são obrigatórios');
            }
            
            if (password.length < 6) {
                throw new Error('Senha deve ter pelo menos 6 caracteres');
            }
            
            // Verificar se username já existe
            const existingUser = await AdminModel.findUserByUsername(username);
            if (existingUser) {
                throw new Error('Username já está em uso');
            }
            
            // Verificar se email já existe
            const existingEmail = await AdminModel.findUserByEmail(email);
            if (existingEmail) {
                throw new Error('Email já está em uso');
            }
            
            // Hash da senha
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            
            // Criar usuário
            const result = await AdminModel.createUser({
                username,
                email,
                passwordHash,
                fullName
            });
            
            return {
                success: true,
                userId: result.insertId,
                username,
                email,
                fullName
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Alterar senha do usuário
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            // Buscar usuário
            const user = await AdminModel.findUserById(userId);
            if (!user) {
                throw new Error('Usuário não encontrado');
            }
            
            // Verificar senha atual
            const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValidPassword) {
                throw new Error('Senha atual inválida');
            }
            
            if (newPassword.length < 6) {
                throw new Error('Nova senha deve ter pelo menos 6 caracteres');
            }
            
            // Hash da nova senha
            const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
            
            // Atualizar senha
            await AdminModel.updateUserPassword(userId, passwordHash);
            
            // Remover todas as sessões do usuário (forçar novo login)
            await AdminModel.removeAllUserSessions(userId);
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Listar usuários admin
    static async getAllUsers() {
        try {
            const users = await AdminModel.getAllUsers();
            
            // Formatar dados
            const formattedUsers = users.map(user => ({
                ...user,
                created_at: moment(user.created_at).format('DD/MM/YYYY HH:mm'),
                last_login: user.last_login ? moment(user.last_login).format('DD/MM/YYYY HH:mm') : null
            }));
            
            return { success: true, users: formattedUsers };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Ativar/Desativar usuário
    static async toggleUserStatus(userId, isActive) {
        try {
            await AdminModel.toggleUserStatus(userId, isActive);
            
            // Se desativar, remover todas as sessões
            if (!isActive) {
                await AdminModel.removeAllUserSessions(userId);
            }
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Limpeza de sessões expiradas (executar periodicamente)
    static async cleanExpiredSessions() {
        try {
            const result = await AdminModel.cleanExpiredSessions();
            return { success: true, deletedCount: result.deletedCount };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ==== HELPERS ====
    
    static getUrlStatus(url) {
        if (!url.is_active) return 'inactive';
        if (url.expires_at && moment().isAfter(moment(url.expires_at))) return 'expired';
        if (url.clicks === 0) return 'unused';
        return 'active';
    }
    
    static shortenUserAgent(userAgent) {
        if (!userAgent) return 'Desconhecido';
        
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        
        return userAgent.substring(0, 20) + '...';
    }
}

module.exports = AdminService;