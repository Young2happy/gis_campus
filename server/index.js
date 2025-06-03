const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

const announcementsRoutes = require('./routes/announcements');

// 加载环境变量
dotenv.config();

// 导入路由
const authRoutes = require('./routes/auth');
const buildingsRoutes = require('./routes/buildings');

const app = express();
const PORT = process.env.PORT || 5001;

// 数据文件路径
const TASKS_FILE = path.join(__dirname, 'data', 'tasks.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const BUILDINGS_FILE = path.join(__dirname, 'data', 'buildings.json');
const ANNOUNCEMENTS_FILE = path.join(__dirname, 'data', 'announcements.json');

// 确保数据文件存在
async function ensureDataFilesExist() {
  try {
    // 确保data目录存在
    try {
      await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
      console.log('确保数据目录存在');
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // 检查并初始化tasks.json
    try {
      await fs.access(TASKS_FILE);
    } catch (err) {
      console.log('创建tasks.json文件');
      await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks: [] }, null, 2));
    }

    // 检查并初始化announcements.json  
    try {
      await fs.access(ANNOUNCEMENTS_FILE);
    } catch (err) {
      console.log('创建announcements.json文件');
      const defaultAnnouncements = {
        announcements: [
          {
            id: "1",
            title: "图书馆延长开放时间通知",
            content: "为方便同学们复习备考，图书馆将从本周开始延长开放时间至晚上11点。",
            type: "library",
            priority: "normal",
            createTime: new Date().toISOString(),
            expireTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: "active"
          }
        ]
      };
      await fs.writeFile(ANNOUNCEMENTS_FILE, JSON.stringify(defaultAnnouncements, null, 2));
      await fs.writeFile(ANNOUNCEMENTS_FILE, JSON.stringify(defaultAnnouncements, null, 2));
    }

    // 检查并初始化users.json
    try {
      await fs.access(USERS_FILE);
    } catch (err) {
      console.log('创建users.json文件');
      // 创建默认管理员账户
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const users = {
        users: [
          {
            _id: 'admin123',
            username: 'admin',
            password: hashedPassword,
            name: '系统管理员',
            role: 'admin',
            department: '信息技术中心',
            createdAt: new Date().toISOString(),
            lastLogin: null
          }
        ]
      };
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }

    // 检查并初始化buildings.json
    try {
      await fs.access(BUILDINGS_FILE);
    } catch (err) {
      console.log('创建buildings.json文件');
      await fs.writeFile(BUILDINGS_FILE, JSON.stringify({ buildings: [] }, null, 2));
    }

    console.log('数据文件初始化完成');
  } catch (error) {
    console.error('数据文件初始化失败:', error);
    process.exit(1);
  }
}

// 中间件
app.use(cors());
app.use(express.json());

// 注册API路由
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingsRoutes);

// 添加公告路由  
app.use('/api/announcements', announcementsRoutes);

// 读取任务数据
async function readTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data).tasks;
  } catch (error) {
    console.error('Error reading tasks:', error);
    return [];
  }
}

// 保存任务数据
async function saveTasks(tasks) {
  try {
    await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks }, null, 2));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

// API路由
// 获取所有任务
app.get('/api/tasks', async (req, res) => {
  const tasks = await readTasks();
  res.json(tasks);
});

// 创建新任务
app.post('/api/tasks', async (req, res) => {
  try {
    const tasks = await readTasks();
    const newTask = {
      id: Date.now().toString(),
      ...req.body,
      creator: {
        name: '管理员',
        username: 'admin'
      },
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    await saveTasks(tasks);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 更新任务状态
app.patch('/api/tasks/:id/status', async (req, res) => {
  try {
    const tasks = await readTasks();
    const task = tasks.find(t => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    task.status = req.body.status;
    task.updatedAt = new Date().toISOString();
    await saveTasks(tasks);
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    let tasks = await readTasks();
    tasks = tasks.filter(t => t.id !== req.params.id);
    await saveTasks(tasks);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 启动服务器
async function startServer() {
  // 确保数据文件存在
  await ensureDataFilesExist();

  // 启动服务器
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}

// 启动应用
startServer().catch(err => {
  console.error('启动服务器失败:', err);
  process.exit(1);
}); 