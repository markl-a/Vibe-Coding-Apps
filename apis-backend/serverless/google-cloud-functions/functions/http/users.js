/**
 * Users API HTTP Cloud Function
 * RESTful API for user management
 */

const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');

// 初始化 Firestore（在生產環境中使用）
const firestore = new Firestore();
const COLLECTION_NAME = 'users';

// 模擬數據庫（用於測試）
let mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    createdAt: new Date().toISOString()
  }
];

/**
 * 設定 CORS
 */
function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * 驗證 email 格式
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 獲取所有用戶
 */
async function getUsers(req, res) {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // 從 Firestore 獲取數據（生產環境）
    // const snapshot = await firestore.collection(COLLECTION_NAME).get();
    // const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 使用模擬數據
    let users = [...mockUsers];

    // 過濾
    if (role) {
      users = users.filter(u => u.role === role);
    }
    if (search) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 分頁
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: users.length,
        totalPages: Math.ceil(users.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
}

/**
 * 獲取單個用戶
 */
async function getUser(req, res) {
  try {
    const userId = req.params[0] || req.query.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // const doc = await firestore.collection(COLLECTION_NAME).doc(userId).get();
    // const user = doc.exists ? { id: doc.id, ...doc.data() } : null;

    const user = mockUsers.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
}

/**
 * 創建用戶
 */
async function createUser(req, res) {
  try {
    const { name, email, role = 'user' } = req.body;

    // 驗證
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // 檢查 email 是否已存在
    if (mockUsers.some(u => u.email === email)) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }

    const newUser = {
      id: uuidv4(),
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // await firestore.collection(COLLECTION_NAME).doc(newUser.id).set(newUser);

    mockUsers.push(newUser);

    console.log('User created:', newUser.id);

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
}

/**
 * 更新用戶
 */
async function updateUser(req, res) {
  try {
    const userId = req.params[0] || req.body.id;
    const { name, email, role } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const userIndex = mockUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 驗證 email
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // 更新數據
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    updates.updatedAt = new Date().toISOString();

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...updates
    };

    // await firestore.collection(COLLECTION_NAME).doc(userId).update(updates);

    console.log('User updated:', userId);

    res.status(200).json({
      success: true,
      data: mockUsers[userIndex],
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
}

/**
 * 刪除用戶
 */
async function deleteUser(req, res) {
  try {
    const userId = req.params[0] || req.body.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const userIndex = mockUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // await firestore.collection(COLLECTION_NAME).doc(userId).delete();

    mockUsers.splice(userIndex, 1);

    console.log('User deleted:', userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
}

/**
 * 主函數 - 路由處理
 */
exports.usersAPI = async (req, res) => {
  setCors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const method = req.method;
  const path = req.path;

  console.log(`${method} ${path}`);

  try {
    // 路由
    if (method === 'GET' && path === '/users') {
      await getUsers(req, res);
    } else if (method === 'GET' && path.startsWith('/users/')) {
      await getUser(req, res);
    } else if (method === 'POST' && path === '/users') {
      await createUser(req, res);
    } else if (method === 'PUT' && path.startsWith('/users/')) {
      await updateUser(req, res);
    } else if (method === 'DELETE' && path.startsWith('/users/')) {
      await deleteUser(req, res);
    } else {
      res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
