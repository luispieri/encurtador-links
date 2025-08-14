/**
 * ========================================
 * CONTROLLER DE URLs (urlController.js)
 * ========================================
 * 
 * Controller responsável por gerenciar as operações relacionadas às URLs:
 * - Encurtamento de URLs
 * - Redirecionamento 
 * - Listagem de URLs do usuário
 * - Exclusão de URLs
 * 
 * Este é a camada de controle na arquitetura MVC:
 * - Recebe requisições HTTP
 * - Chama os services para lógica de negócio
 * - Retorna respostas formatadas
 */

// Importa os services necessários
const UrlService = require('../services/urlService');  // Lógica de negócio para URLs
const QrService = require('../services/qrService');    // Serviço para gerar QR codes

/**
 * Classe UrlController
 * Contém métodos estáticos para cada endpoint da API
 */
class UrlController {
    
    /**
     * Endpoint: POST /api/shorten
     * Cria uma URL encurtada a partir de uma URL original
     * 
     * @param {Object} req - Objeto da requisição HTTP
     * @param {Object} res - Objeto da resposta HTTP
     */
    static async shortenUrl(req, res) {
        try {
            // Chama o service para criar a URL encurtada
            // req.body contém: url, customCode, title, description, expiresIn
            const result = await UrlService.createShortUrl(req.body, req);
            
            // Constrói a URL completa (domínio + código)
            const baseUrl = `${req.protocol}://${req.get('host')}`;  // http://localhost:8080
            const shortUrl = `${baseUrl}/${result.shortCode}`;       // http://localhost:8080/abc123
            
            // Gera o QR Code para a URL encurtada
            const qrCode = await QrService.generateQRCode(shortUrl);
            
            // Resposta de sucesso com todos os dados
            res.json({
                success: true,
                data: {
                    ...result,    // id, originalUrl, shortCode, title, description, etc.
                    shortUrl,     // URL completa encurtada
                    qrCode        // Data URL do QR Code
                }
            });
            
        } catch (error) {
            // Em caso de erro (validação, código duplicado, etc.)
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Endpoint: GET /:code
     * Redireciona um código encurtado para a URL original
     * Este método é chamado quando alguém acessa uma URL encurtada
     * 
     * @param {Object} req - Objeto da requisição HTTP
     * @param {Object} res - Objeto da resposta HTTP
     */
    static async redirectUrl(req, res) {
        try {
            // Extrai o código da URL (ex: /abc123 -> code = "abc123")
            const { code } = req.params;
            
            // Busca a URL original e registra o clique
            const originalUrl = await UrlService.handleRedirect(code, req);
            
            // Redireciona o usuário para a URL original
            res.redirect(originalUrl);
            
        } catch (error) {
            // Se URL não existe ou está expirada, mostra página de erro
            res.status(404).send(`
                <html>
                    <head>
                        <title>Link não encontrado</title>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #333; }
                            p { color: #666; }
                            a { color: #588ad6; text-decoration: none; }
                        </style>
                    </head>
                    <body>
                        <h1>😔 Link não encontrado</h1>
                        <p>${error.message}</p>
                        <a href="/">← Voltar ao início</a>
                    </body>
                </html>
            `);
        }
    }

    /**
     * Endpoint: GET /api/manage
     * Lista todas as URLs criadas pelo usuário atual (identificado por IP)
     * 
     * @param {Object} req - Objeto da requisição HTTP
     * @param {Object} res - Objeto da resposta HTTP
     */
    static async getUserUrls(req, res) {
        try {
            // Busca URLs do usuário (identificado pelo IP)
            const urls = await UrlService.getUserUrls(req);
            
            // Retorna lista de URLs com informações formatadas
            res.json({
                success: true,
                data: urls  // Array com URLs, status, datas formatadas, etc.
            });
            
        } catch (error) {
            // Erro interno do servidor
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Endpoint: DELETE /api/delete/:id
     * Remove uma URL específica (apenas se pertencer ao usuário)
     * 
     * @param {Object} req - Objeto da requisição HTTP
     * @param {Object} res - Objeto da resposta HTTP
     */
    static async deleteUrl(req, res) {
        try {
            // Extrai o ID da URL a ser removida
            const { id } = req.params;
            
            // Remove a URL (verifica se pertence ao usuário)
            await UrlService.deleteUrl(id, req);
            
            // Confirma a remoção
            res.json({
                success: true,
                message: 'URL removida com sucesso'
            });
            
        } catch (error) {
            // Erro de validação (URL não pertence ao usuário, não existe, etc.)
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

// Exporta a classe para uso nas rotas
module.exports = UrlController;