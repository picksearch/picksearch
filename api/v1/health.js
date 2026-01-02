export default function handler(req, res) {
    res.status(200).json({
        status: 'ok',
        message: 'Basic health check working',
        time: new Date().toISOString()
    });
}
