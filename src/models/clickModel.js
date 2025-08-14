/**
 * ========================================
 * MODEL DE CLIQUES (clickModel.js)
 * ========================================
 * 
 * Este arquivo gerencia os dados de cliques nas URLs encurtadas.
 * Responsável por:
 * - Registrar cada acesso a uma URL encurtada
 * - Armazenar dados para analytics (IP, User-Agent, Referer)
 * - Consultar histórico de cliques
 * - Prover dados para estatísticas detalhadas
 */

// Importa a função para executar queries no banco
const { executeQuery } = require('../config/database');

/**
 * Classe ClickModel
 * Gerencia todas as operações relacionadas aos cliques no banco de dados
 */
class ClickModel {
    
    /**
     * Registra um novo clique em uma URL encurtada
     * Chamado sempre que alguém acessa uma URL encurtada
     * 
     * @param {Object} clickData - Dados do clique a ser registrado
     * @param {number} clickData.urlId - ID da URL que foi clicada
     * @param {string} clickData.userIp - IP do usuário que clicou
     * @param {string} clickData.userAgent - User-Agent do navegador
     * @param {string} clickData.referer - URL de onde veio o clique
     * @returns {Promise<Object>} Resultado da inserção no banco
     * 
     * Exemplo de uso:
     * await ClickModel.create({
     *   urlId: 123,
     *   userIp: '192.168.1.1',
     *   userAgent: 'Mozilla/5.0...',
     *   referer: 'https://google.com'
     * });
     */
    static async create(clickData) {
        const { urlId, userIp, userAgent, referer } = clickData;
        
        // Query para inserir novo registro de clique
        // Inclui timestamp automático via DEFAULT CURRENT_TIMESTAMP
        const query = `
            INSERT INTO url_clicks (url_id, user_ip, user_agent, referer)
            VALUES (?, ?, ?, ?)
        `;
        
        // Executa a inserção com prepared statement para segurança
        return await executeQuery(query, [urlId, userIp, userAgent, referer]);
    }

    /**
     * Busca todos os cliques de uma URL específica
     * Útil para análise detalhada de acessos e geração de relatórios
     * 
     * @param {number} urlId - ID da URL para buscar cliques
     * @returns {Promise<Array>} Lista de cliques ordenados do mais recente
     * 
     * Retorna array com objetos contendo:
     * - id: ID do clique
     * - url_id: ID da URL clicada
     * - clicked_at: Data/hora do clique
     * - user_ip: IP do usuário
     * - user_agent: Navegador usado
     * - referer: Origem do clique
     */
    static async getByUrlId(urlId) {
        const query = `
            SELECT * FROM url_clicks 
            WHERE url_id = ? 
            ORDER BY clicked_at DESC
        `;
        
        // Retorna lista ordenada do clique mais recente para o mais antigo
        return await executeQuery(query, [urlId]);
    }
}

// Exporta a classe para uso nos services
module.exports = ClickModel;