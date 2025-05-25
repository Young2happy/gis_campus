const express = require('express');
const router = express.Router();
const Path = require('../models/Path');
const auth = require('../middleware/auth');

// 获取两点之间的路径
router.post('/find', auth, async (req, res) => {
  try {
    const { start, end, type = 'walking', accessibility = false } = req.body;
    
    // 这里可以集成实际的路径规划算法
    // 目前返回示例数据
    const path = {
      points: [
        { lat: start.lat, lng: start.lng, type: 'waypoint' },
        // 这里可以添加实际的路径点
        { lat: end.lat, lng: end.lng, type: 'waypoint' }
      ],
      distance: 0, // 计算实际距离
      estimatedTime: 0, // 计算预计时间
      type,
      accessibility: {
        hasStairs: false,
        hasElevator: true,
        isWheelchairAccessible: true
      }
    };

    res.json(path);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 保存常用路径
router.post('/save', auth, async (req, res) => {
  try {
    const path = new Path({
      ...req.body,
      createdAt: new Date()
    });

    await path.save();
    res.status(201).json(path);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 获取所有保存的路径
router.get('/saved', auth, async (req, res) => {
  try {
    const paths = await Path.find();
    res.json(paths);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取特定类型的路径
router.get('/type/:type', auth, async (req, res) => {
  try {
    const paths = await Path.find({ type: req.params.type });
    res.json(paths);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 