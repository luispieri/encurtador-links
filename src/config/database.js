/**
 * ========================================
 * CONFIGURAÇÃO DO BANCO DE DADOS
 * ========================================
 * 
 * Este arquivo configura a conexão com o MySQL usando pool de conexões
 * para melhor performance e gerenciamento de recursos.
 * 
 * Funcionalidades:
 * - Configuração do pool de conexões MySQL
 * - Função para testar conectividade
 * - Função utilitária para executar queries
 * - Configurações de segurança e performance
 */

// Carrega variáveis de ambiente
require('dotenv').config();

// Importa o driver MySQL2 com suporte a Promises
const mysql = require('mysql2/promise');

// ========================================
// CONFIGURAÇÃO DO POOL DE CONEXÕES
// ========================================

/**
 * Configuração do pool de conexões MySQL
 * Pool = gerenciador de múltiplas conexões reutilizáveis
 * Benefícios: melhor performance, controle de recursos, reconexão automática
 */
const dbConfig = {
    // Configurações básicas de conexão
    host: process.env.DB_HOST || 'localhost',                    // Endereço do servidor MySQL
    port: parseInt(process.env.DB_PORT) || 3306,                // Porta do MySQL (padrão: 3306)
    user: process.env.DB_USER || 'root',                        // Usuário do banco
    password: process.env.DB_PASSWORD || '',                    // Senha (em produção, sempre configure!)
    database: process.env.DB_NAME || 'encurtador_links',        // Nome do banco de dados
    
    // Configurações do pool de conexões
    waitForConnections: true,                                    // Aguarda conexão disponível se pool estiver cheio
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 15,  // Máximo de conexões simultâneas
    queueLimit: 0,                                             // Sem limite na fila de espera
    
    // Timeouts para evitar conexões travadas
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,  // Timeout para obter conexão (60s)
    timeout: parseInt(process.env.DB_TIMEOUT) || 60000,                 // Timeout para queries (60s)
    
    // Configurações de segurança
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,  // SSL se configurado
    
    // Configurações de charset e timezone
    charset: 'utf8mb4',                                        // Suporte completo a Unicode (incluindo emojis)
    timezone: '+00:00',                                        // UTC para consistência global
    
    // Nota: reconnect foi depreciado, o pool já gerencia reconexões automaticamente
};

// Cria o pool de conexões com as configurações definidas
const pool = mysql.createPool(dbConfig);

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Testa a conectividade com o banco de dados
 * Útil para verificar se as configurações estão corretas
 * 
 * @returns {Promise<boolean>} true se conectou com sucesso, false caso contrário
 */
async function testConnection() {
    try {
        // Obtém uma conexão do pool para teste
        const connection = await pool.getConnection();
        console.log('✅ Conectado ao MySQL com sucesso!');
        
        // IMPORTANTE: sempre liberar a conexão de volta para o pool
        connection.release();
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao conectar com MySQL:', error.message);
        console.log('📝 Certifique-se de que:');
        console.log('   - MySQL está rodando');
        console.log('   - Database "encurtador_links" existe');
        console.log('   - Credenciais no arquivo .env estão corretas');
        console.log('   - Firewall permite conexão na porta MySQL');
        return false;
    }
}

/**
 * Executa uma query SQL de forma segura usando prepared statements
 * Prepared statements previnem SQL Injection automaticamente
 * 
 * @param {string} sql - Query SQL com placeholders (?)
 * @param {Array} params - Parâmetros para substituir os placeholders
 * @returns {Promise<Array>} Resultado da query
 * 
 * Exemplo de uso:
 * const users = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
 */
async function executeQuery(sql, params = []) {
    try {
        // pool.execute() usa prepared statements automaticamente
        // Isso é mais seguro que pool.query() pois previne SQL injection
        const [results] = await pool.execute(sql, params);
        return results;
        
    } catch (error) {
        console.error('❌ Erro na execução da query:', error.message);
        console.error('📄 SQL:', sql);
        console.error('📋 Parâmetros:', params);
        
        // Re-lança o erro para ser tratado pela camada superior
        throw error;
    }
}

// ========================================
// EXPORTAÇÕES
// ========================================

module.exports = {
    pool,              // Pool de conexões (para uso avançado)
    testConnection,    // Função para testar conectividade
    executeQuery       // Função principal para executar queries
};