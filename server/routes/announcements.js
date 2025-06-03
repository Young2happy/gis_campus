const express = require('express');  
const router = express.Router();  
const jwt = require('jsonwebtoken');  
const fs = require('fs').promises;  
const path = require('path');  
  
// 数据文件路径  
const ANNOUNCEMENTS_FILE = path.join(__dirname, '..', 'data', 'announcements.json');  
  
// JWT认证中间件  
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
  
// 读取公告数据  
async function readAnnouncements() {  
  try {  
    const data = await fs.readFile(ANNOUNCEMENTS_FILE, 'utf8');  
    return JSON.parse(data).announcements;  
  } catch (error) {  
    console.error('Error reading announcements:', error);  
    return [];  
  }  
}  
  
// 保存公告数据  
async function saveAnnouncements(announcements) {  
  try {  
    await fs.writeFile(ANNOUNCEMENTS_FILE, JSON.stringify({ announcements }, null, 2));  
  } catch (error) {  
    console.error('Error saving announcements:', error);  
    throw error;  
  }  
}  
  
// 获取所有公告  
router.get('/', async (req, res) => {  
  try {  
    const announcements = await readAnnouncements();  
    res.json(announcements);  
  } catch (error) {  
    console.error('Get announcements error:', error);  
    res.status(500).json({ message: error.message });  
  }  
});  
  
// 创建新公告（需要管理员权限）  
router.post('/', authenticateJWT, isAdmin, async (req, res) => {  
  try {  
    const announcements = await readAnnouncements();  
    const newAnnouncement = {  
      id: Date.now().toString(),  
      ...req.body,  
      createTime: new Date().toISOString(),  
      status: 'active'  
    };  
      
    announcements.unshift(newAnnouncement);  
    await saveAnnouncements(announcements);  
    res.status(201).json(newAnnouncement);  
  } catch (error) {  
    console.error('Create announcement error:', error);  
    res.status(400).json({ message: error.message });  
  }  
});  
  
// 更新公告  
router.put('/:id', authenticateJWT, isAdmin, async (req, res) => {  
  try {  
    const announcements = await readAnnouncements();  
    const announcementIndex = announcements.findIndex(a => a.id === req.params.id);  
      
    if (announcementIndex === -1) {  
      return res.status(404).json({ message: '找不到该公告' });  
    }  
      
    announcements[announcementIndex] = {  
      ...announcements[announcementIndex],  
      ...req.body,  
      updatedAt: new Date().toISOString()  
    };  
      
    await saveAnnouncements(announcements);  
    res.json(announcements[announcementIndex]);  
  } catch (error) {  
    console.error('Update announcement error:', error);  
    res.status(400).json({ message: error.message });  
  }  
});  
  
// 删除公告  
router.delete('/:id', authenticateJWT, isAdmin, async (req, res) => {  
  try {  
    const announcements = await readAnnouncements();  
    const filteredAnnouncements = announcements.filter(a => a.id !== req.params.id);  
      
    if (filteredAnnouncements.length === announcements.length) {  
      return res.status(404).json({ message: '找不到该公告' });  
    }  
      
    await saveAnnouncements(filteredAnnouncements);  
    res.json({ message: '公告删除成功' });  
  } catch (error) {  
    console.error('Delete announcement error:', error);  
    res.status(500).json({ message: error.message });  
  }  
});  
  
module.exports = router;