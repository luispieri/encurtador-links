/**
 * ========================================
 * SERVICE DE URLs (urlService.js)
 * ========================================
 * 
 * Este arquivo contém a lógica de negócio para operações com URLs.
 * Na arquitetura MVC, o Service é responsável por:
 * - Regras de negócio complexas
 * - Orquestração entre diferentes models
 * - Validações de alto nível
 * - Formatação de dados
 * - Integração com sistemas externos
 */

// Importações necessárias
const moment = require('moment');                                    // Biblioteca para manipulação de datas
const UrlModel = require('../models/urlModel');                     // Model para operações de URL
const ClickModel = require('../models/clickModel');                 // Model para operações de cliques
const { generateShortCode } = require('../utils/urlGenerator');     // Gerador de códigos únicos
const { isValidUrl, isValidCustomCode } = require('../utils/validator'); // Validações
const { getClientIP } = require('../utils/helpers');               // Utilitários

/**
 * Classe UrlService
 * Contém toda a lógica de negócio relacionada ao encurtamento de URLs
 */
class UrlService {
    
    /**
     * Cria uma nova URL encurtada
     * Orquestra todo o processo: validação, geração de código, armazenamento
     * 
     * @param {Object} urlData - Dados da URL a ser encurtada
     * @param {string} urlData.url - URL original a ser encurtada
     * @param {string} urlData.customCode - Código personalizado (opcional)
     * @param {string} urlData.title - Título da URL (opcional)
     * @param {string} urlData.description - Descrição da URL (opcional)
     * @param {number} urlData.expiresIn - Horas até expiração (opcional)
     * @param {Object} req - Objeto da requisição HTTP
     * @returns {Promise<Object>} Dados da URL criada
     */
    static async createShortUrl(urlData, req) {
        const { url, customCode, title, description, expiresIn } = urlData;
        
        // === FASE 1: VALIDAÇÃO DA URL ORIGINAL ===
        if (!isValidUrl(url)) {
            throw new Error('URL inválida');
        }

        // === FASE 2: PROCESSAMENTO DO CÓDIGO ENCURTADO ===
        let shortCode = customCode;
        let isCustom = false;

        if (customCode) {
            // Usuário forneceu código personalizado
            if (!isValidCustomCode(customCode)) {
                throw new Error('Código personalizado inválido. Use 3-20 caracteres: letras, números, _ ou -');
            }
            
            // Verificar se código já existe
            const existingUrl = await UrlModel.findByShortCode(customCode);
            if (existingUrl) {
                throw new Error('Código personalizado já está em uso');
            }
            isCustom = true;
            
        } else {
            // Gerar código aleatório único
            // Loop até encontrar código não utilizado
            do {
                shortCode = generateShortCode();
                const existing = await UrlModel.findByShortCode(shortCode);
                if (!existing) break; // Código único encontrado
            } while (true);
        }

        // === FASE 3: CÁLCULO DA DATA DE EXPIRAÇÃO ===
        let expiresAt = null;
        if (expiresIn && expiresIn > 0) {
            // Adiciona horas especificadas à data atual
            expiresAt = moment().add(expiresIn, 'hours').format('YYYY-MM-DD HH:mm:ss');
        }

        // === FASE 4: OBTENÇÃO DO IP DO USUÁRIO ===
        const userIp = getClientIP(req);

        // === FASE 5: CRIAÇÃO NO BANCO DE DADOS ===
        const newUrl = await UrlModel.create({
            originalUrl: url,
            shortCode,
            customCode: isCustom,
            title: title || null,
            description: description || null,
            expiresAt,
            userIp
        });

        // === FASE 6: RETORNO DOS DADOS FORMATADOS ===
        return {
            id: newUrl.insertId,
            originalUrl: url,
            shortCode,
            title,
            description,
            expiresAt,
            createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
        };
    }

    /**
     * Processa o redirecionamento de uma URL encurtada
     * Verifica validade, registra estatísticas e retorna URL original
     * 
     * @param {string} shortCode - Código da URL encurtada
     * @param {Object} req - Objeto da requisição HTTP
     * @returns {Promise<string>} URL original para redirecionamento
     */
    static async handleRedirect(shortCode, req) {
        // === FASE 1: BUSCAR URL NO BANCO ===
        const url = await UrlModel.findByShortCode(shortCode);
        
        if (!url) {
            throw new Error('URL não encontrada');
        }

        // === FASE 2: VERIFICAR EXPIRAÇÃO ===
        if (url.expires_at && moment().isAfter(moment(url.expires_at))) {
            throw new Error('URL expirada');
        }

        // === FASE 3: REGISTRAR ANALYTICS (EM PARALELO) ===
        // Executa incremento de cliques e registro detalhado simultaneamente
        await Promise.all([
            UrlModel.incrementClicks(url.id),           // Incrementa contador
            ClickModel.create({                         // Registra dados detalhados
                urlId: url.id,
                userIp: getClientIP(req),
                userAgent: req.headers['user-agent'] || '',
                referer: req.headers.referer || ''
            })
        ]);

        // === FASE 4: RETORNAR URL ORIGINAL ===
        return url.original_url;
    }

    /**
     * Busca todas as URLs criadas por um usuário
     * Identifica usuário pelo IP e formata dados para exibição
     * 
     * @param {Object} req - Objeto da requisição HTTP
     * @returns {Promise<Array>} Lista de URLs do usuário formatadas
     */
    static async getUserUrls(req) {
        // Obter IP do usuário
        const userIp = getClientIP(req);
        
        // Buscar URLs no banco
        const urls = await UrlModel.findByUserIp(userIp);
        
        // Formatar dados para frontend
        return urls.map(url => ({
            ...url,                                     // Todos os campos originais
            status: this.getUrlStatus(url),             // Status calculado
            created_at: moment(url.created_at).format('DD/MM/YYYY HH:mm'),     // Data formatada
            expires_at: url.expires_at ? moment(url.expires_at).format('DD/MM/YYYY HH:mm') : null
        }));
    }

    /**
     * Calcula o status atual de uma URL
     * Determina se está ativa, inativa, expirada ou nunca acessada
     * 
     * @param {Object} url - Dados da URL do banco
     * @returns {string} Status da URL
     */
    static getUrlStatus(url) {
        // Prioridade: inativo > expirado > nunca_acessado > ativo
        
        if (!url.is_active) {
            return 'inativo';       // URL foi desativada manualmente
        }
        
        if (url.expires_at && moment().isAfter(moment(url.expires_at))) {
            return 'expirado';      // URL passou da data de expiração
        }
        
        if (url.clicks === 0) {
            return 'nunca_acessado'; // URL ainda não foi clicada
        }
        
        return 'ativo';             // URL funcionando normalmente
    }

    /**
     * Remove uma URL do usuário
     * Verifica propriedade antes de permitir remoção
     * 
     * @param {string} id - ID da URL a ser removida
     * @param {Object} req - Objeto da requisição HTTP
     * @returns {Promise<Object>} Resultado da operação
     */
    static async deleteUrl(id, req) {
        // === FASE 1: VERIFICAR PROPRIEDADE ===
        const userIp = getClientIP(req);
        const urls = await UrlModel.findByUserIp(userIp);
        const url = urls.find(u => u.id === parseInt(id));
        
        if (!url) {
            throw new Error('URL não encontrada ou não pertence ao usuário');
        }

        // === FASE 2: EXECUTAR REMOÇÃO (SOFT DELETE) ===
        return await UrlModel.deleteById(id);
    }
}

// Exporta a classe para uso nos controllers
module.exports = UrlService;