// API endpoint for users
// GET /api/users - 獲取用戶列表
// POST /api/users - 創建用戶

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

export default function handler(req, res) {
  const { method } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (method === 'GET') {
    return res.status(200).json({
      success: true,
      data: users
    });
  }

  if (method === 'POST') {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    const newUser = {
      id: users.length + 1,
      name,
      email
    };

    users.push(newUser);

    return res.status(201).json({
      success: true,
      data: newUser
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
