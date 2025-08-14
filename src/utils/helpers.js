/**
 * ========================================
 * FUNÇÕES UTILITÁRIAS (helpers.js)
 * ========================================
 * 
 * Este arquivo contém funções auxiliares utilizadas em toda a aplicação.
 * Funcionalidades incluem:
 * - Obtenção de IP do cliente
 * - Utilitários para manipulação de dados
 * - Funções de formatação
 * - Helpers para validações
 */

/**
 * Obtém o endereço IP real do cliente
 * Considera proxies, load balancers e CDNs
 * 
 * @param {Object} req - Objeto da requisição HTTP do Express
 * @returns {string} Endereço IP do cliente
 * 
 * Como funciona:
 * 1. Verifica header x-forwarded-for (proxy/CDN)
 * 2. Tenta req.connection.remoteAddress
 * 3. Tenta req.socket.remoteAddress  
 * 4. Tenta req.connection.socket.remoteAddress
 * 5. Fallback para localhost se nada funcionar
 * 
 * Exemplo de uso:
 * const userIP = getClientIP(req);
 * console.log('IP do usuário:', userIP);
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for'] ||     // IP via proxy/load balancer
           req.connection.remoteAddress ||       // Conexão direta
           req.socket.remoteAddress ||           // Socket direto
           (req.connection.socket ? req.connection.socket.remoteAddress : null) || // Socket da conexão
           '127.0.0.1';                          // Fallback para localhost
}

// Exporta as funções para uso em outros módulos
module.exports = { 
    getClientIP 
};