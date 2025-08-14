/**
 * ========================================
 * ARQUIVO PRINCIPAL DO SERVIDOR (index.js)
 * ========================================
 * 
 * Este é o ponto de entrada da aplicação.
 * Aqui configuramos o servidor Express, middlewares e rotas.
 * 
 * Estrutura:
 * 1. Configuração de dependências
 * 2. Configuração de middlewares 
 * 3. Definição de rotas
 * 4. Inicialização do servidor
 */

// ========================================
// 1. CONFIGURAÇÃO DE DEPENDÊNCIAS
// ========================================

// Carrega variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importa as dependências necessárias
const express = require('express');           // Framework web para Node.js
const compression = require('compression');   // Middleware para compressão GZIP
const cors = require('cors');                // Middleware para Cross-Origin Resource Sharing
const path = require('path');                // Utilitário para caminhos de arquivos
const { testConnection } = require('./src/config/database'); // Função para testar conexão com BD

// Importa as rotas da aplicação
const apiRoutes = require('./src/routes/api');           // Rotas da API pública
const adminRoutes = require('./src/routes/admin');       // Rotas da API administrativa
const redirectRoutes = require('./src/routes/redirect'); // Rotas de redirecionamento

// ========================================
// 2. CONFIGURAÇÃO DO SERVIDOR EXPRESS
// ========================================

const app = express(); // Cria a instância do Express
const PORT = process.env.PORT || 8080; // Define a porta (padrão: 8080)

// ========================================
// 3. CONFIGURAÇÃO DE MIDDLEWARES
// ========================================

// Compressão GZIP - reduz o tamanho das respostas em até 70%
app.use(compression()); 

// CORS - permite requisições de outros domínios (importante para APIs)
app.use(cors());

// JSON Parser - permite receber dados JSON nas requisições
app.use(express.json());

// Servir arquivos estáticos da pasta 'public' (HTML, CSS, JS, imagens)
app.use(express.static('public'));

// ========================================
// 4. DEFINIÇÃO DE ROTAS
// ========================================

// IMPORTANTE: A ordem das rotas importa!

// Rotas da API pública (/api/*)
// Exemplos: /api/shorten, /api/stats, /api/manage
app.use('/api', apiRoutes);

// Rota para servir o painel administrativo (página HTML)
// DEVE vir ANTES das rotas da API admin para evitar conflitos
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Rotas da API administrativa (/admin/api/*)
// Exemplos: /admin/api/login, /admin/api/stats, /admin/api/urls
app.use('/admin/api', adminRoutes);

// Rota principal - serve a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rotas de redirecionamento (DEVE ser a última!)
// Captura todas as outras rotas e verifica se são códigos de URL
// Exemplo: /abc123 -> redireciona para URL original
app.use('/', redirectRoutes);

// ========================================
// 5. INICIALIZAÇÃO DO SERVIDOR
// ========================================

/**
 * Função para inicializar o servidor de forma assíncrona
 * Testa a conexão com o banco antes de iniciar
 */
async function startServer() {
    try {
        // Testa a conexão com o banco de dados
        console.log('🔍 Testando conexão com banco de dados...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.log('⚠️  Servidor iniciará sem conexão com banco de dados');
            console.log('   Configure as variáveis de ambiente no arquivo .env e reinicie');
        }
        
        // Inicia o servidor na porta especificada
        app.listen(PORT, () => {
            console.log('========================================');
            console.log('🚀 ENCURTADOR DE LINKS PRO - INICIADO!');
            console.log('========================================');
            console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
            console.log(`📊 API disponível em: http://localhost:${PORT}/api`);
            console.log(`⚙️  Painel admin em: http://localhost:${PORT}/admin`);
            console.log('========================================');
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1); // Encerra o processo em caso de erro crítico
    }
}

// Inicia o servidor
startServer();