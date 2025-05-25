const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 数据文件路径
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

async function initAdmin() {
  try {
    // 确保data目录存在
    try {
      await fs.mkdir(path.join(__dirname, '..', 'data'), { recursive: true });
      console.log('确保数据目录存在');
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // 读取现有用户数据
    let users = [];
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(data).users;
    } catch (err) {
      // 文件不存在或无法解析，使用空数组
      console.log('创建新的users.json文件');
    }

    // 检查是否已存在管理员账户
    const existingAdmin = users.find(user => user.role === 'admin');
    if (existingAdmin) {
      console.log('管理员账户已存在:', existingAdmin.username);
      return;
    }

    // 创建管理员账户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = {
      _id: 'admin123',
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'admin',
      department: '信息技术中心',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    // 添加到用户列表
    users.push(adminUser);

    // 保存用户数据
    await fs.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2));

    console.log('管理员账户创建成功!');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('请在首次登录后修改密码!');
  } catch (error) {
    console.error('初始化管理员账户失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initAdmin(); 