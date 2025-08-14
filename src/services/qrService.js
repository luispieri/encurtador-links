const QRCode = require('qrcode');

class QrService {
    static async generateQRCode(url) {
        try {
            return await QRCode.toDataURL(url);
        } catch (error) {
            throw new Error('Erro ao gerar QR Code: ' + error.message);
        }
    }
}

module.exports = QrService;