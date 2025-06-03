const express = require('express');  
const router = express.Router();  
const jwt = require('jsonwebtoken');  
const fs = require('fs').promises;  
const path = require('path');  
  
const FACILITIES_FILE = path.join(__dirname, '..', 'data', 'facilities.json');  
  
// 复用认证中间件  
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
  
const isAdmin = (req, res, next) => {  
  if (req.user && req.user.role === 'admin') {  
    next();  
  } else {  
    res.status(403).json({ message: '需要管理员权限' });  
  }  
};  
  
// 读取设施数据  
async function readFacilities() {  
  try {  
    const data = await fs.readFile(FACILITIES_FILE, 'utf8');  
    return JSON.parse(data).facilities;  
  } catch (error) {  
    console.error('Error reading facilities:', error);  
    return [];  
  }  
}  
  
// 保存设施数据  
async function saveFacilities(facilities) {  
  try {  
    await fs.writeFile(FACILITIES_FILE, JSON.stringify({ facilities }, null, 2));  
  } catch (error) {  
    console.error('Error saving facilities:', error);  
    throw error;  
  }  
}  
  
// 获取所有设施  
router.get('/', async (req, res) => {  
  try {  
    const facilities = await readFacilities();  
    res.json(facilities);  
  } catch (error) {  
    console.error('Get facilities error:', error);  
    res.status(500).json({ message: error.message });  
  }  
});  
  
// 创建新设施  
router.post('/', authenticateJWT, isAdmin, async (req, res) => {  
  try {  
    const facilities = await readFacilities();  
      
    // 检查编号是否已存在  
    const codeExists = facilities.some(f => f.code === req.body.code);  
    if (codeExists) {  
      return res.status(400).json({ message: '设施编号已存在' });  
    }  
      
    const newFacility = {  
      id: Date.now().toString(),  
      ...req.body,  
      createdAt: new Date().toISOString()  
    };  
      
    facilities.push(newFacility);  
    await saveFacilities(facilities);  
    res.status(201).json(newFacility);  
  } catch (error) {  
    console.error('Create facility error:', error);  
    res.status(400).json({ message: error.message });  
  }  
});  
  
// 更新设施  
router.put('/:id', authenticateJWT, isAdmin, async (req, res) => {  
  try {  
    const facilities = await readFacilities();  
    const facilityIndex = facilities.findIndex(f => f.id === req.params.id);  
      
    if (facilityIndex === -1) {  
      return res.status(404).json({ message: '找不到该设施' });  
    }  
      
    // 检查编号冲突  
    if (req.body.code && req.body.code !== facilities[facilityIndex].code) {  
      const codeExists = facilities.some(f => f.code === req.body.code && f.id !== req.params.id);  
      if (codeExists) {  
        return res.status(400).json({ message: '设施编号已被其他设施使用' });  
      }  
    }  
      
    facilities[facilityIndex] = {  
      ...facilities[facilityIndex],  
      ...req.body,  
      updatedAt: new Date().toISOString()  
    };  
      
    await saveFacilities(facilities);  
    res.json(facilities[facilityIndex]);  
  } catch (error) {  
    console.error('Update facility error:', error);  
    res.status(400).json({ message: error.message });  
  }  
});  
  
// 删除设施  
router.delete('/:id', authenticateJWT, isAdmin, async (req, res) => {  
  try {  
    const facilities = await readFacilities();  
    const filteredFacilities = facilities.filter(f => f.id !== req.params.id);  
      
    if (filteredFacilities.length === facilities.length) {  
      return res.status(404).json({ message: '找不到该设施' });  
    }  
      
    await saveFacilities(filteredFacilities);  
    res.json({ message: '设施删除成功' });  
  } catch (error) {  
    console.error('Delete facility error:', error);  
    res.status(500).json({ message: error.message });  
  }  
});  
  
module.exports = router;