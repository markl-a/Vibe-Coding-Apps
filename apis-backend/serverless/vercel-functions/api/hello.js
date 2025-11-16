// GET /api/hello
export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Vercel Functions!',
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query
  });
}
