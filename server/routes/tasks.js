const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// 获取所有任务
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('creator', 'name username')
      .populate('assignedTo', 'name username');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 创建新任务
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers and admins can create tasks' });
    }

    const task = new Task({
      ...req.body,
      creator: req.user.userId
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 更新任务状态
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.assignedTo.includes(req.user.userId) && 
        task.creator.toString() !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = req.body.status;
    task.updatedAt = new Date();
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 分配任务
router.patch('/:id/assign', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.creator.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to assign this task' });
    }

    task.assignedTo = req.body.assignedTo;
    task.updatedAt = new Date();
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 