/**
 * ========================================
 * VALIDAÇÕES (validator.js)
 * ========================================
 * 
 * Este arquivo contém funções de validação utilizadas na aplicação.
 * Funcionalidades incluem:
 * - Validação de URLs
 * - Validação de códigos personalizados
 * - Verificações de segurança
 * - Sanitização de dados de entrada
 */

/**
 * Valida se uma string é uma URL válida e segura
 * Aplica várias verificações de segurança e formato
 * 
 * @param {string} string - URL a ser validada
 * @returns {boolean} true se a URL é válida, false caso contrário
 * 
 * Verificações realizadas:
 * 1. Formato válido de URL
 * 2. Protocolo HTTP ou HTTPS apenas
 * 3. Comprimento máximo (2048 caracteres)
 * 4. Detecção de IPs privados (opcional)
 * 
 * Exemplo de uso:
 * if (isValidUrl('https://example.com')) {
 *   // URL é válida
 * }
 */
function isValidUrl(string) {
    try {
        // Tenta criar objeto URL - já valida formato básico
        const url = new URL(string);
        
        // Verificar protocolo - apenas HTTP e HTTPS são permitidos
        // Bloqueia javascript:, data:, file:, etc. por segurança
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return false;
        }
        
        // Verificar se não é um IP privado ou localhost
        const hostname = url.hostname.toLowerCase();
        const isPrivateIP = 
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||    // Rede privada classe C
            hostname.startsWith('10.') ||         // Rede privada classe A
            (hostname.startsWith('172.') && /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)); // Rede privada classe B
        
        // NOTA: Em produção, descomente a linha abaixo para bloquear IPs privados
        // Útil para evitar SSRF (Server-Side Request Forgery)
        // if (isPrivateIP) return false;
        
        // Verificar comprimento máximo da URL
        // URLs muito longas podem causar problemas de performance
        if (string.length > 2048) {
            return false;
        }
        
        return true;
        
    } catch (error) {
        // Se URL() lançar exceção, a URL é inválida
        return false;
    }
}

/**
 * Valida se um código personalizado está no formato correto
 * Usado para validar códigos customizados de URLs encurtadas
 * 
 * @param {string} code - Código a ser validado
 * @returns {boolean} true se o código é válido, false caso contrário
 * 
 * Regras para código válido:
 * - Entre 3 e 20 caracteres
 * - Apenas letras (a-z, A-Z)
 * - Números (0-9)
 * - Hífen (-) e underscore (_)
 * - Sem caracteres especiais ou espaços
 * 
 * Exemplos válidos: "meulink", "site-pessoal", "codigo_123"
 * Exemplos inválidos: "ab", "muito-longo-demais-codigo", "com espaço", "com@especial"
 */
function isValidCustomCode(code) {
    // Regex que valida o formato do código personalizado
    return /^[a-zA-Z0-9_-]{3,20}$/.test(code);
}

// Exporta as funções de validação para uso em outros módulos
module.exports = { 
    isValidUrl, 
    isValidCustomCode 
};