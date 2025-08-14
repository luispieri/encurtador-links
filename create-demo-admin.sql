-- ==========================================
-- SCRIPT PARA CRIAR USUÁRIO ADMIN DEMO
-- ==========================================
-- Este script cria o usuário administrador padrão para demonstração pública
-- Execute este script APÓS executar database-setup.sql

-- Credenciais do usuário demo:
-- Email: admin@pieritech.com.br
-- Senha: AdMin123 (hash bcrypt com salt rounds 12)

USE encurtador_links;

-- Inserir usuário administrador para demonstração
INSERT INTO admin_users (
    username, 
    email, 
    password_hash, 
    full_name, 
    is_active, 
    created_at
) VALUES (
    'admin',
    'admin@pieritech.com.br',
    '$2b$12$vZjXvSJvW8O1VGn.PH4nBe8VLr8k6YKV3QZN0LKYfz4X2R1G9VHKW',  -- Hash de "AdMin123"
    'Administrador Demo',
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    full_name = VALUES(full_name),
    is_active = VALUES(is_active);

-- Verificar se o usuário foi criado
SELECT id, username, email, full_name, is_active, created_at 
FROM admin_users 
WHERE email = 'admin@pieritech.com.br';

-- ==========================================
-- INFORMAÇÕES IMPORTANTES
-- ==========================================
/*
CREDENCIAIS DE ACESSO:
- Email: admin@pieritech.com.br  
- Senha: AdMin123

SEGURANÇA:
- Esta é uma conta de demonstração pública
- Em produção real, altere essas credenciais
- O hash da senha foi gerado com bcrypt e salt rounds 12

ACESSO AO PAINEL:
- URL do painel: http://seu-dominio.com/admin
- Use as credenciais acima para fazer login

LIMPEZA PERIÓDICA:
- Os dados de demonstração podem ser limpos periodicamente
- URLs de teste podem ser removidas automaticamente
*/