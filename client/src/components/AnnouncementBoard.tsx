import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Fade,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  LocalLibrary,
  Restaurant,
  Event,
  Warning,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import announcementsData from '../data/announcements.json';
import './AnnouncementBoard.css';
import axios from 'axios';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'library' | 'canteen' | 'activity' | 'other';
  priority: 'high' | 'normal' | 'low';
  createTime: string;
  expireTime: string;
  status: 'active' | 'expired';
}

const AnnouncementBoard: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'other',
    priority: 'normal',
    expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认7天后过期
  });

  // useEffect(() => {
  //   // 从localStorage获取数据，如果没有则使用默认数据
  //   const savedAnnouncements = localStorage.getItem('announcements');
  //   if (savedAnnouncements) {
  //     setAnnouncements(JSON.parse(savedAnnouncements));
  //   } else {
  //     setAnnouncements(announcementsData.announcements as Announcement[]);
  //   }
  // }, []);

  // 修改 useEffect  
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // const handleSave = () => {
  //   const updatedAnnouncements = [...announcements];
  //   const newAnnouncement: Announcement = {
  //     id: editingAnnouncement?.id || Date.now().toString(),
  //     title: formData.title,
  //     content: formData.content,
  //     type: formData.type as 'library' | 'canteen' | 'activity' | 'other',
  //     priority: formData.priority as 'high' | 'normal' | 'low',
  //     createTime: editingAnnouncement?.createTime || new Date().toISOString(),
  //     expireTime: formData.expireTime.toISOString(),
  //     status: 'active',
  //   };

  //   if (editingAnnouncement) {
  //     const index = announcements.findIndex(a => a.id === editingAnnouncement.id);
  //     updatedAnnouncements[index] = newAnnouncement;
  //   } else {
  //     updatedAnnouncements.unshift(newAnnouncement);
  //   }

  //   setAnnouncements(updatedAnnouncements);
  //   localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
  //   handleClose();
  // };
  // 替换原有的 handleSave 方法  
  const handleSave = async () => {
    try {
      const announcementData = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        expireTime: formData.expireTime.toISOString(),
      };

      if (editingAnnouncement) {
        // 更新公告  
        await axios.put(
          `http://localhost:5001/api/announcements/${editingAnnouncement.id}`,
          announcementData,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      } else {
        // 创建新公告  
        await axios.post(
          'http://localhost:5001/api/announcements',
          announcementData,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      }

      fetchAnnouncements();
      handleClose();
    } catch (err: any) {
      console.error('保存公告失败:', err);
      // 添加错误处理  
    }
  };

  // const handleDelete = (id: string) => {
  //   const updatedAnnouncements = announcements.filter(a => a.id !== id);
  //   setAnnouncements(updatedAnnouncements);
  //   localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
  // };
  // 替换原有的 handleDelete 方法  
  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个公告吗？')) {
      try {
        await axios.delete(`http://localhost:5001/api/announcements/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        fetchAnnouncements();
      } catch (err: any) {
        console.error('删除公告失败:', err);
      }
    }
  };

  // 添加获取token的方法  
  const getToken = () => {
    return localStorage.getItem('token');
  };


  // 添加获取公告的方法  
  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/announcements');
      setAnnouncements(response.data);
    } catch (err) {
      console.error('获取公告失败:', err);
    }
  };
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      expireTime: new Date(announcement.expireTime),
    });
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      type: 'other',
      priority: 'normal',
      expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'library':
        return <LocalLibrary color="primary" />;
      case 'canteen':
        return <Restaurant color="primary" />;
      case 'activity':
        return <Event color="primary" />;
      default:
        return <NotificationsIcon color="primary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'normal':
        return 'primary';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box className="announcement-board">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#39FF14', display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon />
          校园公告
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{
            bgcolor: alpha('#39FF14', 0.2),
            color: '#39FF14',
            '&:hover': {
              bgcolor: alpha('#39FF14', 0.3),
            }
          }}
        >
          发布公告
        </Button>
      </Box>

      <Stack spacing={2}>
        {announcements.map((announcement) => (
          <Fade in key={announcement.id}>
            <Card
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(57, 255, 20, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '1px solid rgba(57, 255, 20, 0.3)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTypeIcon(announcement.type)}
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      {announcement.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={announcement.priority === 'high' ? '重要' : '普通'}
                      color={getPriorityColor(announcement.priority)}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Box>
                    <Tooltip title="编辑">
                      <IconButton size="small" onClick={() => handleEdit(announcement)} sx={{ color: '#39FF14' }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除">
                      <IconButton size="small" onClick={() => handleDelete(announcement.id)} sx={{ color: '#ff4444' }}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, color: '#ccc' }}>
                  {announcement.content}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    发布时间: {new Date(announcement.createTime).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    有效期至: {new Date(announcement.expireTime).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        ))}
      </Stack>

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAnnouncement ? '编辑公告' : '发布新公告'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="标题"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="内容"
              fullWidth
              multiline
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>类型</InputLabel>
              <Select
                value={formData.type}
                label="类型"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="library">图书馆</MenuItem>
                <MenuItem value="canteen">食堂</MenuItem>
                <MenuItem value="activity">活动</MenuItem>
                <MenuItem value="other">其他</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>优先级</InputLabel>
              <Select
                value={formData.priority}
                label="优先级"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value="high">重要</MenuItem>
                <MenuItem value="normal">普通</MenuItem>
                <MenuItem value="low">低优先级</MenuItem>
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="有效期至"
                value={formData.expireTime}
                onChange={(newValue) => {
                  if (newValue) {
                    setFormData({ ...formData, expireTime: newValue });
                  }
                }}
              />
            </LocalizationProvider>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnnouncementBoard; 