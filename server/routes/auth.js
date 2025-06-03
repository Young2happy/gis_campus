const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// 数据文件路径
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// 读取用户数据
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data).users;
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

// 保存用户数据
async function saveUsers(users) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
    throw error;
  }
}

// JWT 验证中间件
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here', (err, user) => {
      if (err) {
        return res.status(403).json({ message: '令牌无效或已过期' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: '未提供授权令牌' });
  }
};

// 管理员权限检查中间件
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: '需要管理员权限' });
  }
};

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, name, studentId, teacherId, department } = req.body;
    
    // 检查用户是否已存在
    const users = await readUsers();
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser = {
      _id: Date.now().toString(), // 使用时间戳作为ID
      username,
      password: hashedPassword,
      role,
      name,
      studentId,
      teacherId,
      department,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    // 添加到用户列表并保存
    users.push(newUser);
    await saveUsers(users);
    
    res.status(201).json({ message: '用户创建成功' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const users = await readUsers();
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ message: '用户不存在' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: '密码错误' });
    }

    // 生成JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '24h' }
    );

    // 更新最后登录时间
    user.lastLogin = new Date().toISOString();
    await saveUsers(users);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 获取当前用户信息
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u._id === req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 不返回密码
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 获取所有用户 (仅管理员)
router.get('/users', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const users = await readUsers();
    // 不返回密码
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 更新用户信息 (仅管理员)
router.put('/users/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { name, role, department } = req.body;
    const users = await readUsers();
    
    const userIndex = users.findIndex(u => u._id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 更新用户信息
    users[userIndex].name = name;
    users[userIndex].role = role;
    users[userIndex].department = department;
    
    // 如果提供了学号/工号，也更新
    if (req.body.studentId) {
      users[userIndex].studentId = req.body.studentId;
    }
    if (req.body.teacherId) {
      users[userIndex].teacherId = req.body.teacherId;
    }
    
    // 如果提供了新密码，更新密码
    if (req.body.password) {
      users[userIndex].password = await bcrypt.hash(req.body.password, 10);
    }
    
    await saveUsers(users);
    
    // 返回更新后的用户（不含密码）
    const { password, ...updatedUser } = users[userIndex];
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 删除用户 (仅管理员)
router.delete('/users/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    let users = await readUsers();
    
    const userIndex = users.findIndex(u => u._id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 删除用户
    users.splice(userIndex, 1);
    await saveUsers(users);
    
    res.json({ message: '用户已成功删除' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 