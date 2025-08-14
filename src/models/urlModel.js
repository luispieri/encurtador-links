/**
 * ========================================
 * MODEL DE URLs (urlModel.js)
 * ========================================
 * 
 * Este arquivo contém o modelo responsável por gerenciar dados de URLs no banco.
 * Na arquitetura MVC, o Model é responsável por:
 * - Operações CRUD (Create, Read, Update, Delete)
 * - Queries específicas do domínio
 * - Validações a nível de banco de dados
 * - Abstração da camada de dados
 */

// Importa a função para executar queries no banco
const { executeQuery } = require('../config/database');

// Nome da tabela principal de URLs
const TABLE_NAME = 'url_links';

/**
 * Classe UrlModel
 * Gerencia todas as operações relacionadas às URLs no banco de dados
 */
class UrlModel {
    
    /**
     * Cria uma nova URL encurtada no banco de dados
     * 
     * @param {Object} urlData - Dados da URL a ser criada
     * @param {string} urlData.originalUrl - URL original completa
     * @param {string} urlData.shortCode - Código único da URL encurtada
     * @param {boolean} urlData.customCode - Se é um código personalizado
     * @param {string|null} urlData.title - Título opcional da URL
     * @param {string|null} urlData.description - Descrição opcional da URL
     * @param {string|null} urlData.expiresAt - Data de expiração (formato MySQL)
     * @param {string} urlData.userIp - IP do usuário que criou
     * @returns {Promise<Object>} Resultado da inserção com ID gerado
     */
    static async create(urlData) {
        const { originalUrl, shortCode, customCode, title, description, expiresAt, userIp } = urlData;
        
        // Query para inserir nova URL
        // Usa prepared statements para segurança (evita SQL injection)
        const query = `
            INSERT INTO \`${TABLE_NAME}\` (
                original_url, short_code, custom_code, 
                title, description, expires_at, user_ip
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Executa a query e retorna o resultado (incluindo ID auto-incrementado)
        return await executeQuery(query, [
            originalUrl, shortCode, customCode, 
            title, description, expiresAt, userIp
        ]);
    }

    /**
     * Busca uma URL pelo código encurtado
     * Utilizada quando alguém acessa uma URL encurtada
     * 
     * @param {string} shortCode - Código da URL encurtada (ex: "abc123")
     * @returns {Promise<Object|undefined>} Dados da URL ou undefined se não encontrada
     */
    static async findByShortCode(shortCode) {
        // Busca apenas URLs ativas para evitar redirecionamentos de URLs desativadas
        const query = 'SELECT * FROM `url_links` WHERE short_code = ? AND is_active = TRUE';
        const results = await executeQuery(query, [shortCode]);
        
        // Retorna o primeiro resultado (ou undefined se não houver)
        return results[0];
    }

    /**
     * Busca todas as URLs criadas por um usuário específico
     * Identifica o usuário pelo IP (sistema simples sem autenticação)
     * 
     * @param {string} userIp - IP do usuário
     * @returns {Promise<Array>} Lista de URLs do usuário
     */
    static async findByUserIp(userIp) {
        const query = `
            SELECT * FROM \`${TABLE_NAME}\` 
            WHERE user_ip = ? 
            ORDER BY created_at DESC
        `;
        
        // Retorna todas as URLs ordenadas da mais recente para a mais antiga
        return await executeQuery(query, [userIp]);
    }

    /**
     * Incrementa o contador de cliques de uma URL
     * Chamado sempre que alguém acessa uma URL encurtada
     * 
     * @param {number} id - ID da URL no banco
     * @returns {Promise<Object>} Resultado da atualização
     */
    static async incrementClicks(id) {
        // Usa operação atômica para incrementar sem riscos de concorrência
        const query = 'UPDATE `url_links` SET clicks = clicks + 1 WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    /**
     * Remove uma URL (marca como inativa ao invés de deletar)
     * Soft delete - preserva dados para auditoria e estatísticas
     * 
     * @param {number} id - ID da URL a ser removida
     * @returns {Promise<Object>} Resultado da atualização
     */
    static async deleteById(id) {
        // Marca como inativa ao invés de deletar fisicamente
        const query = 'UPDATE `url_links` SET is_active = FALSE WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    /**
     * Obtém estatísticas detalhadas de uma URL específica
     * Inclui dados da URL e histórico de cliques por dia
     * 
     * @param {string} shortCode - Código da URL encurtada
     * @returns {Promise<Object>} Objeto com dados da URL e estatísticas de cliques
     */
    static async getStats(shortCode) {
        // Query para buscar dados básicos da URL
        const urlQuery = 'SELECT * FROM `url_links` WHERE short_code = ?';
        
        // Query para buscar estatísticas de cliques agrupadas por dia
        const clicksQuery = `
            SELECT 
                COUNT(*) as total_clicks, 
                DATE(clicked_at) as date, 
                COUNT(*) as daily_clicks
            FROM url_clicks c
            JOIN \`${TABLE_NAME}\` u ON c.url_id = u.id
            WHERE u.short_code = ?
            GROUP BY DATE(clicked_at)
            ORDER BY date DESC
        `;
        
        // Executa ambas as queries em paralelo para melhor performance
        const [urlResults, clicksResults] = await Promise.all([
            executeQuery(urlQuery, [shortCode]),
            executeQuery(clicksQuery, [shortCode])
        ]);
        
        // Retorna dados combinados
        return {
            url: urlResults[0],        // Dados da URL
            clicks: clicksResults      // Estatísticas de cliques por dia
        };
    }
}

// Exporta a classe para uso nos services
module.exports = UrlModel;