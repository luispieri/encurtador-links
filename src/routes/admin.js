const express = require('express');
const AdminController = require('../controllers/adminController');
const AdminService = require('../services/adminService');

const router = express.Router();

// Middleware de autenticação JWT
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticação requerido'
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        const verification = await AdminService.verifyToken(token);
        
        if (!verification.valid) {
            return res.status(401).json({
                success: false,
                error: verification.error || 'Token inválido'
            });
        }
        
        // Adicionar usuário e token ao request
        req.user = verification.user;
        req.token = token;
        
        next();
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};

// ==== ROTAS PÚBLICAS (sem autenticação) ====
router.post('/login', AdminController.login);

// ==== ROTAS PROTEGIDAS (requerem autenticação) ====
router.use(requireAuth);

// Autenticação e usuário
router.post('/logout', AdminController.logout);
router.get('/me', AdminController.me);
router.post('/change-password', AdminController.changePassword);

// Gerenciamento de usuários admin
router.get('/users', AdminController.getAllAdminUsers);
router.post('/users', AdminController.createAdminUser);
router.patch('/users/:id/toggle', AdminController.toggleAdminUserStatus);

// Dashboard e estatísticas
router.get('/stats', AdminController.getStats);

// CRUD de URLs
router.get('/urls', AdminController.getAllUrls);
router.post('/urls', AdminController.createUrl);
router.get('/urls/:id', AdminController.getUrlDetails);
router.put('/urls/:id', AdminController.updateUrl);
router.delete('/urls/:id', AdminController.deleteUrl);
router.patch('/urls/:id/toggle', AdminController.toggleUrlStatus);

// Utilitários
router.delete('/cleanup/expired', AdminController.cleanExpiredUrls);
router.delete('/cleanup/sessions', AdminController.cleanSessions);

module.exports = router;