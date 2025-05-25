const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// 数据文件路径
const BUILDINGS_FILE = path.join(__dirname, '..', 'data', 'buildings.json');

// 读取建筑数据
async function readBuildings() {
  try {
    const data = await fs.readFile(BUILDINGS_FILE, 'utf8');
    return JSON.parse(data).buildings;
  } catch (error) {
    console.error('Error reading buildings:', error);
    return [];
  }
}

// 保存建筑数据
async function saveBuildings(buildings) {
  try {
    await fs.writeFile(BUILDINGS_FILE, JSON.stringify({ buildings }, null, 2));
  } catch (error) {
    console.error('Error saving buildings:', error);
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

// 获取所有建筑物
router.get('/', async (req, res) => {
  try {
    const buildings = await readBuildings();
    res.json(buildings);
  } catch (error) {
    console.error('Get buildings error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 获取特定建筑物
router.get('/:id', async (req, res) => {
  try {
    const buildings = await readBuildings();
    const building = buildings.find(b => b._id === req.params.id);
    
    if (!building) {
      return res.status(404).json({ message: '找不到该建筑物' });
    }
    
    res.json(building);
  } catch (error) {
    console.error('Get building error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 创建新建筑物 (仅管理员)
router.post('/', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const buildings = await readBuildings();
    
    // 检查编号是否已存在
    if (buildings.some(b => b.code === req.body.code)) {
      return res.status(400).json({ message: '建筑编号已存在' });
    }
    
    const newBuilding = {
      _id: Date.now().toString(), // 使用时间戳作为ID
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.userId
    };
    
    buildings.push(newBuilding);
    await saveBuildings(buildings);
    
    res.status(201).json(newBuilding);
  } catch (error) {
    console.error('Create building error:', error);
    res.status(400).json({ message: error.message });
  }
});

// 更新建筑物信息 (仅管理员)
router.put('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const buildings = await readBuildings();
    
    const buildingIndex = buildings.findIndex(b => b._id === req.params.id);
    if (buildingIndex === -1) {
      return res.status(404).json({ message: '找不到该建筑物' });
    }
    
    // 检查是否有其他建筑已使用此编号
    if (req.body.code && req.body.code !== buildings[buildingIndex].code) {
      const codeExists = buildings.some(b => b.code === req.body.code && b._id !== req.params.id);
      if (codeExists) {
        return res.status(400).json({ message: '建筑编号已被其他建筑使用' });
      }
    }
    
    // 更新建筑信息
    buildings[buildingIndex] = {
      ...buildings[buildingIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await saveBuildings(buildings);
    res.json(buildings[buildingIndex]);
  } catch (error) {
    console.error('Update building error:', error);
    res.status(400).json({ message: error.message });
  }
});

// 删除建筑物 (仅管理员)
router.delete('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    let buildings = await readBuildings();
    
    const buildingIndex = buildings.findIndex(b => b._id === req.params.id);
    if (buildingIndex === -1) {
      return res.status(404).json({ message: '找不到该建筑物' });
    }
    
    // 删除建筑
    buildings.splice(buildingIndex, 1);
    await saveBuildings(buildings);
    
    res.json({ message: '建筑物已成功删除' });
  } catch (error) {
    console.error('Delete building error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 根据类型获取建筑物
router.get('/type/:type', async (req, res) => {
  try {
    const buildings = await readBuildings();
    const filteredBuildings = buildings.filter(b => b.type === req.params.type);
    res.json(filteredBuildings);
  } catch (error) {
    console.error('Get buildings by type error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 获取附近建筑物 (基于地理位置)
router.get('/nearby/:lng/:lat/:maxDistance?', async (req, res) => {
  try {
    const { lng, lat } = req.params;
    const maxDistance = req.params.maxDistance ? parseFloat(req.params.maxDistance) : 1000; // 默认1000米
    const userLng = parseFloat(lng);
    const userLat = parseFloat(lat);
    
    const buildings = await readBuildings();
    
    // 简单距离计算 (近似值)
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3; // 地球半径，单位：米
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      return R * c; // 距离，单位：米
    }
    
    // 过滤出在指定距离内的建筑
    const nearbyBuildings = buildings.filter(building => {
      if (!building.location || !building.location.coordinates) return false;
      
      const bLng = building.location.coordinates[0];
      const bLat = building.location.coordinates[1];
      const distance = calculateDistance(userLat, userLng, bLat, bLng);
      
      // 为建筑添加距离信息
      building.distance = distance;
      
      return distance <= maxDistance;
    });
    
    // 按距离排序
    nearbyBuildings.sort((a, b) => a.distance - b.distance);
    
    res.json(nearbyBuildings);
  } catch (error) {
    console.error('Get nearby buildings error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 