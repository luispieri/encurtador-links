#!/usr/bin/env node

/**
 * ========================================
 * SCRIPT DE CRIAÇÃO DE USUÁRIO ADMIN
 * ========================================
 * 
 * Este script permite criar usuários administradores via linha de comando.
 * É essencial para configuração inicial do sistema, pois permite criar
 * o primeiro usuário admin que terá acesso ao painel administrativo.
 * 
 * Como usar:
 * node create-admin.js
 * 
 * O script é interativo e solicitará:
 * - Username (único)
 * - Email (único)
 * - Nome completo (opcional)
 * - Senha (mínimo 6 caracteres)
 * - Confirmação da senha
 */

// Importações necessárias
const readline = require('readline');  // Para entrada interativa de dados
require('dotenv').config();           // Carrega variáveis de ambiente

const AdminService = require('./src/services/adminService'); // Service para operações admin

// ========================================
// CONFIGURAÇÃO DA INTERFACE DE ENTRADA
// ========================================

/**
 * Interface readline para capturar entrada do usuário no terminal
 * Permite fazer perguntas e receber respostas de forma interativa
 */
const rl = readline.createInterface({
    input: process.stdin,   // Entrada padrão (teclado)
    output: process.stdout  // Saída padrão (terminal)
});

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Faz uma pergunta ao usuário e aguarda resposta
 * 
 * @param {string} question - Pergunta a ser exibida
 * @returns {Promise<string>} Resposta do usuário
 */
const prompt = (question) => {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
};

/**
 * Captura senha do usuário de forma oculta (mostra asteriscos)
 * Implementa entrada de senha segura no terminal
 * 
 * @param {string} question - Pergunta a ser exibida
 * @returns {Promise<string>} Senha digitada pelo usuário
 */
const promptPassword = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (password) => {
            resolve(password);
        });
        
        // Sobrescreve função de output para ocultar caracteres da senha
        rl._writeToOutput = function _writeToOutput(stringToWrite) {
            if (stringToWrite.charCodeAt(0) === 13) {      // Enter pressionado
                rl.output.write('\n');
            } else if (stringToWrite.charCodeAt(0) === 8) { // Backspace pressionado
                rl.output.write('\b \b');
            } else {                                       // Qualquer outro caractere
                rl.output.write('*');                      // Mostra asterisco
            }
        };
    });
};

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

/**
 * Função principal que orquestra todo o processo de criação de usuário admin
 * Implementa validações, coleta de dados e criação do usuário
 */
async function createAdminUser() {
    try {
        // === HEADER DO SCRIPT ===
        console.log('========================================');
        console.log('  CRIAÇÃO DE USUÁRIO ADMINISTRADOR');
        console.log('========================================\n');
        
        // === COLETA DE DADOS BÁSICOS ===
        
        // Solicitar username
        const username = await prompt('Username: ');
        if (!username.trim()) {
            console.log('❌ Erro: Username é obrigatório');
            process.exit(1);
        }
        
        // Solicitar email
        const email = await prompt('Email: ');
        if (!email.trim()) {
            console.log('❌ Erro: Email é obrigatório');
            process.exit(1);
        }
        
        // Solicitar nome completo (opcional)
        const fullName = await prompt('Nome completo (opcional): ');
        
        // === VALIDAÇÕES ===
        
        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Erro: Email inválido');
            process.exit(1);
        }
        
        // === COLETA E VALIDAÇÃO DE SENHA ===
        
        console.log('\nSenha (mínimo 6 caracteres):');
        const password = await promptPassword('');
        
        // Restaura função normal de output após captura da senha
        rl._writeToOutput = function _writeToOutput(stringToWrite) {
            rl.output.write(stringToWrite);
        };
        
        // Validar comprimento da senha
        if (!password || password.length < 6) {
            console.log('\n❌ Erro: Senha deve ter pelo menos 6 caracteres');
            process.exit(1);
        }
        
        // === CONFIRMAÇÃO DE SENHA ===
        
        console.log('\nConfirme a senha:');
        const confirmPassword = await promptPassword('');
        
        // Restaura função normal de output novamente
        rl._writeToOutput = function _writeToOutput(stringToWrite) {
            rl.output.write(stringToWrite);
        };
        
        // Verificar se senhas coincidem
        if (password !== confirmPassword) {
            console.log('\n❌ Erro: Senhas não coincidem');
            process.exit(1);
        }
        
        // === CRIAÇÃO DO USUÁRIO ===
        
        console.log('\n⏳ Criando usuário administrador...');
        
        // Chama o service para criar o usuário
        const result = await AdminService.createUser({
            username: username.trim(),
            email: email.trim(),
            password,
            fullName: fullName.trim() || null
        });
        
        // === RESULTADO DA OPERAÇÃO ===
        
        if (result.success) {
            console.log('\n========================================');
            console.log('✅ USUÁRIO ADMINISTRADOR CRIADO!');
            console.log('========================================');
            console.log(`🆔 ID: ${result.userId}`);
            console.log(`👤 Username: ${result.username}`);
            console.log(`📧 Email: ${result.email}`);
            if (result.fullName) {
                console.log(`📝 Nome: ${result.fullName}`);
            }
            console.log('\n🔗 Agora você pode acessar o painel admin em:');
            console.log('   http://localhost:8080/admin');
            console.log('========================================');
            
        } else {
            console.log(`\n❌ Erro ao criar usuário: ${result.error}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n❌ Erro inesperado:', error.message);
        console.error('💡 Dica: Verifique se o banco de dados está configurado corretamente');
        process.exit(1);
        
    } finally {
        // Sempre fecha a interface readline
        rl.close();
    }
}

// ========================================
// EXECUÇÃO DO SCRIPT
// ========================================

// Verifica se o script foi chamado diretamente (não importado)
if (require.main === module) {
    createAdminUser();
}

// Exporta a função para uso em outros módulos (se necessário)
module.exports = createAdminUser;