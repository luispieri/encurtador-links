const UrlModel = require('../models/urlModel');

class StatsController {
    static async getUrlStats(req, res) {
        try {
            const { code } = req.params;
            const stats = await UrlModel.getStats(code);
            
            if (!stats.url) {
                return res.status(404).json({
                    success: false,
                    error: 'URL não encontrada'
                });
            }

            res.json({
                success: true,
                data: {
                    url: stats.url,
                    totalClicks: stats.url.clicks,
                    dailyStats: stats.clicks
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = StatsController;