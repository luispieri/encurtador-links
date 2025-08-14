-- =====================================================
-- SCRIPT DE SETUP COMPLETO - ENCURTADOR DE LINKS PRO
-- =====================================================
-- Execute este script no seu banco MySQL para criar todas as tabelas necessárias

-- Tabela para armazenar as URLs encurtadas
CREATE TABLE IF NOT EXISTS `url_links` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `original_url` TEXT NOT NULL,
    `short_code` VARCHAR(50) UNIQUE NOT NULL,
    `custom_code` BOOLEAN DEFAULT FALSE,
    `title` VARCHAR(255),
    `description` TEXT,
    `clicks` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `user_ip` VARCHAR(45),
    INDEX `idx_short_code` (`short_code`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_expires_at` (`expires_at`),
    INDEX `idx_is_active` (`is_active`)
);

-- Tabela para armazenar estatísticas detalhadas de cliques
CREATE TABLE IF NOT EXISTS `url_clicks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `url_id` INT NOT NULL,
    `clicked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `user_ip` VARCHAR(45),
    `user_agent` TEXT,
    `referer` TEXT,
    `country` VARCHAR(2),
    `city` VARCHAR(100),
    FOREIGN KEY (`url_id`) REFERENCES `url_links`(`id`) ON DELETE CASCADE,
    INDEX `idx_url_id` (`url_id`),
    INDEX `idx_clicked_at` (`clicked_at`)
);

-- Tabela de usuários administradores
CREATE TABLE IF NOT EXISTS `admin_users` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `username` VARCHAR(50) UNIQUE NOT NULL,
    `email` VARCHAR(100) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100),
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_login` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_username` (`username`),
    INDEX `idx_email` (`email`),
    INDEX `idx_is_active` (`is_active`)
);

-- Tabela para controle de sessões de admin
CREATE TABLE IF NOT EXISTS `admin_sessions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    
    FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE,
    INDEX `idx_token_hash` (`token_hash`),
    INDEX `idx_expires_at` (`expires_at`),
    INDEX `idx_user_id` (`user_id`)
);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir usuário admin padrão
-- IMPORTANTE: Use o script create-admin.js para criar usuários admin de forma segura
-- Este é apenas um exemplo e não deve ser usado em produção

-- Para criar um usuário admin, execute:
-- node create-admin.js

-- =====================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índice composto para consultas de URLs ativas por data
ALTER TABLE `url_links` ADD INDEX `idx_active_created` (`is_active`, `created_at`);

-- Índice para consultas de cliques por IP e data
ALTER TABLE `url_clicks` ADD INDEX `idx_ip_clicked` (`user_ip`, `clicked_at`);

-- Índice para consultas de sessões ativas
ALTER TABLE `admin_sessions` ADD INDEX `idx_active_sessions` (`user_id`, `expires_at`);

COMMIT;