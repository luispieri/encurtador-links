const { executeQuery } = require('../config/database');

const TABLE_NAME = 'url_links';
const ADMIN_USERS_TABLE = 'admin_users';
const ADMIN_SESSIONS_TABLE = 'admin_sessions';

class AdminModel {
    // Buscar todas as URLs com filtros e paginação
    static async getAllUrls(filters = {}) {
        const { status, search, page = 1, limit = 20, sortBy = 'created_at', order = 'DESC' } = filters;
        
        let whereConditions = [];
        let queryParams = [];
        
        // Filtrar por status
        if (status === 'active') {
            whereConditions.push('is_active = TRUE');
        } else if (status === 'inactive') {
            whereConditions.push('is_active = FALSE');
        } else if (status === 'expired') {
            whereConditions.push('expires_at IS NOT NULL AND expires_at < NOW()');
        }
        
        // Busca por texto
        if (search) {
            whereConditions.push('(original_url LIKE ? OR short_code LIKE ? OR title LIKE ? OR description LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Query principal com paginação
        const offset = (page - 1) * limit;
        const query = `
            SELECT 
                id, original_url, short_code, custom_code, title, description, 
                clicks, created_at, expires_at, is_active, user_ip
            FROM \`${TABLE_NAME}\` 
            ${whereClause}
            ORDER BY ${sortBy} ${order}
            LIMIT ? OFFSET ?
        `;
        
        queryParams.push(limit, offset);
        
        // Query para contar total
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM \`${TABLE_NAME}\` 
            ${whereClause}
        `;
        
        const countParams = queryParams.slice(0, -2); // Remove limit e offset
        
        const [url_links, countResult] = await Promise.all([
            executeQuery(query, queryParams),
            executeQuery(countQuery, countParams)
        ]);
        
        return {
            urls: url_links,
            pagination: {
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    }
    
    // Estatísticas do sistema (otimizado para uma única query principal)
    static async getSystemStats() {
        // Query principal consolidada para estatísticas básicas
        const mainStatsQuery = `
            SELECT 
                COUNT(*) as total_url_links,
                COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_url_links,
                COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_url_links,
                COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 1 END) as expired_url_links,
                COALESCE(SUM(clicks), 0) as total_clicks,
                COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_url_links
            FROM url_links
        `;
        
        // Queries adicionais que precisam ser separadas
        const additionalQueries = [
            // Cliques hoje
            'SELECT COUNT(*) as today_clicks FROM url_clicks WHERE DATE(clicked_at) = CURDATE()',
            
            // URLs mais clicadas (top 5)
            `SELECT original_url, short_code, title, clicks 
             FROM url_links 
             WHERE clicks > 0 
             ORDER BY clicks DESC 
             LIMIT 5`,
            
            // Atividade dos últimos 7 dias
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as urls_created
             FROM url_links 
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        ];
        
        const [mainStats, todayClicks, topUrls, weeklyActivity] = await Promise.all([
            executeQuery(mainStatsQuery),
            ...additionalQueries.map(query => executeQuery(query))
        ]);
        
        const stats = mainStats[0];
        
        return {
            summary: {
                total_urls: stats.total_url_links,
                active_urls: stats.active_url_links,
                inactive_urls: stats.inactive_url_links,
                expired_urls: stats.expired_url_links,
                total_clicks: stats.total_clicks,
                today_urls: stats.today_url_links,
                today_clicks: todayClicks[0].today_clicks
            },
            top_urls: topUrls,
            weekly_activity: weeklyActivity
        };
    }
    
    // Criar nova URL (admin)
    static async createUrl(urlData) {
        const { originalUrl, shortCode, customCode, title, description, expiresAt } = urlData;
        
        const query = 'INSERT INTO `url_links` (original_url, short_code, custom_code, title, description, expires_at, user_ip) VALUES (?, ?, ?, ?, ?, ?, "admin")';
        
        return await executeQuery(query, [originalUrl, shortCode, customCode, title, description, expiresAt]);
    }
    
    // Atualizar URL
    static async updateUrl(id, updateData) {
        const { originalUrl, shortCode, title, description, expiresAt, isActive } = updateData;
        
        const query = `
            UPDATE \`${TABLE_NAME}\` 
            SET original_url = ?, short_code = ?, title = ?, description = ?, 
                expires_at = ?, is_active = ?
            WHERE id = ?
        `;
        
        return await executeQuery(query, [originalUrl, shortCode, title, description, expiresAt, isActive, id]);
    }
    
    // Deletar URL (definitivo)
    static async deleteUrl(id) {
        // Primeiro deletar cliques relacionados
        await executeQuery('DELETE FROM url_clicks WHERE url_id = ?', [id]);
        
        // Depois deletar a URL
        return await executeQuery('DELETE FROM `url_links` WHERE id = ?', [id]);
    }
    
    // Alternar status da URL
    static async toggleUrlStatus(id, isActive) {
        const query = 'UPDATE `url_links` SET is_active = ? WHERE id = ?';
        return await executeQuery(query, [isActive, id]);
    }
    
    // Obter detalhes completos de uma URL
    static async getUrlDetails(id) {
        const urlQuery = 'SELECT * FROM `url_links` WHERE id = ?';
        const clicksQuery = `
            SELECT COUNT(*) as total_clicks,
                   MAX(clicked_at) as last_click,
                   COUNT(DISTINCT user_ip) as unique_visitors
            FROM url_clicks WHERE url_id = ?
        `;
        const recentClicksQuery = `
            SELECT clicked_at, user_ip, user_agent, referer
            FROM url_clicks 
            WHERE url_id = ?
            ORDER BY clicked_at DESC
            LIMIT 10
        `;
        
        const [urlResult, clicksStats, recentClicks] = await Promise.all([
            executeQuery(urlQuery, [id]),
            executeQuery(clicksQuery, [id]),
            executeQuery(recentClicksQuery, [id])
        ]);
        
        if (urlResult.length === 0) {
            throw new Error('URL não encontrada');
        }
        
        return {
            url: urlResult[0],
            stats: clicksStats[0],
            recent_clicks: recentClicks
        };
    }
    
    // Limpar URLs expiradas
    static async cleanExpiredUrls() {
        // Primeiro contar quantas serão deletadas
        const countQuery = `
            SELECT COUNT(*) as count 
            FROM \`${TABLE_NAME}\` 
            WHERE expires_at IS NOT NULL AND expires_at < NOW()
        `;
        
        const countResult = await executeQuery(countQuery);
        const expiredCount = countResult[0].count;
        
        if (expiredCount > 0) {
            // Deletar cliques das URLs expiradas
            await executeQuery(`
                DELETE c FROM url_clicks c
                JOIN \`${TABLE_NAME}\` u ON c.url_id = u.id
                WHERE u.expires_at IS NOT NULL AND u.expires_at < NOW()
            `);
            
            // Deletar URLs expiradas
            await executeQuery(`
                DELETE FROM \`${TABLE_NAME}\` 
                WHERE expires_at IS NOT NULL AND expires_at < NOW()
            `);
        }
        
        return { deletedCount: expiredCount };
    }
    
    // Buscar URL por ID
    static async findById(id) {
        const query = 'SELECT * FROM `url_links` WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result[0];
    }
    
    // Verificar se short_code já existe (para validação)
    static async shortCodeExists(shortCode, excludeId = null) {
        let query = 'SELECT id FROM `url_links` WHERE short_code = ?';
        let params = [shortCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const result = await executeQuery(query, params);
        return result.length > 0;
    }
    
    // ==== MÉTODOS PARA USUÁRIOS ADMIN ====
    
    // Buscar usuário por username
    static async findUserByUsername(username) {
        const query = `SELECT * FROM ${ADMIN_USERS_TABLE} WHERE username = ? AND is_active = TRUE`;
        const result = await executeQuery(query, [username]);
        return result[0];
    }
    
    // Buscar usuário por email
    static async findUserByEmail(email) {
        const query = `SELECT * FROM ${ADMIN_USERS_TABLE} WHERE email = ? AND is_active = TRUE`;
        const result = await executeQuery(query, [email]);
        return result[0];
    }
    
    // Buscar usuário por ID
    static async findUserById(id) {
        const query = `SELECT * FROM ${ADMIN_USERS_TABLE} WHERE id = ?`;
        const result = await executeQuery(query, [id]);
        return result[0];
    }
    
    // Criar novo usuário admin
    static async createUser(userData) {
        const { username, email, passwordHash, fullName } = userData;
        const query = `
            INSERT INTO ${ADMIN_USERS_TABLE} (username, email, password_hash, full_name) 
            VALUES (?, ?, ?, ?)
        `;
        return await executeQuery(query, [username, email, passwordHash, fullName]);
    }
    
    // Atualizar último login do usuário
    static async updateLastLogin(userId) {
        const query = `UPDATE ${ADMIN_USERS_TABLE} SET last_login = NOW() WHERE id = ?`;
        return await executeQuery(query, [userId]);
    }
    
    // Alterar senha do usuário
    static async updateUserPassword(userId, passwordHash) {
        const query = `UPDATE ${ADMIN_USERS_TABLE} SET password_hash = ? WHERE id = ?`;
        return await executeQuery(query, [passwordHash, userId]);
    }
    
    // Listar todos os usuários admin
    static async getAllUsers() {
        const query = `
            SELECT id, username, email, full_name, is_active, last_login, created_at 
            FROM ${ADMIN_USERS_TABLE} 
            ORDER BY created_at DESC
        `;
        return await executeQuery(query);
    }
    
    // Ativar/Desativar usuário
    static async toggleUserStatus(userId, isActive) {
        const query = `UPDATE ${ADMIN_USERS_TABLE} SET is_active = ? WHERE id = ?`;
        return await executeQuery(query, [isActive, userId]);
    }
    
    // ==== MÉTODOS PARA SESSÕES ====
    
    // Criar nova sessão
    static async createSession(sessionData) {
        const { userId, tokenHash, expiresAt, ipAddress, userAgent } = sessionData;
        const query = `
            INSERT INTO ${ADMIN_SESSIONS_TABLE} (user_id, token_hash, expires_at, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?)
        `;
        return await executeQuery(query, [userId, tokenHash, expiresAt, ipAddress, userAgent]);
    }
    
    // Buscar sessão por token hash
    static async findSessionByToken(tokenHash) {
        const query = `
            SELECT s.*, u.username, u.email, u.full_name 
            FROM ${ADMIN_SESSIONS_TABLE} s
            JOIN ${ADMIN_USERS_TABLE} u ON s.user_id = u.id
            WHERE s.token_hash = ? AND s.expires_at > NOW() AND u.is_active = TRUE
        `;
        const result = await executeQuery(query, [tokenHash]);
        return result[0];
    }
    
    // Remover sessão específica
    static async removeSession(tokenHash) {
        const query = `DELETE FROM ${ADMIN_SESSIONS_TABLE} WHERE token_hash = ?`;
        return await executeQuery(query, [tokenHash]);
    }
    
    // Remover todas as sessões de um usuário
    static async removeAllUserSessions(userId) {
        const query = `DELETE FROM ${ADMIN_SESSIONS_TABLE} WHERE user_id = ?`;
        return await executeQuery(query, [userId]);
    }
    
    // Limpar sessões expiradas
    static async cleanExpiredSessions() {
        const query = `DELETE FROM ${ADMIN_SESSIONS_TABLE} WHERE expires_at < NOW()`;
        const result = await executeQuery(query);
        return { deletedCount: result.affectedRows };
    }
}

module.exports = AdminModel;