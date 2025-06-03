import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Button
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Task {
  id: string;
  title: string;
  description: string;
  creator: {
    name: string;
    username: string;
  };
  status: string;
  priority: string;
  deadline: string;
  location?: {
    building: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:5001/api/tasks/${taskId}/status`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await axios.delete(`http://localhost:5001/api/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in-progress': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        任务列表
      </Typography>
      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid item xs={12} sm={6} md={4} key={task.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" gutterBottom>
                    {task.title}
                  </Typography>
                  <Box>
                    <IconButton
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedTask(task.id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  {task.description}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={task.status}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                </Box>
                {task.location && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" />
                    <Typography variant="body2">
                      {task.location.building}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon fontSize="small" />
                  <Typography variant="body2">
                    {new Date(task.deadline).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  创建者: {task.creator.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedTask(null);
        }}
      >
        <MenuItem onClick={() => {
          if (selectedTask) handleStatusChange(selectedTask, 'pending');
          setAnchorEl(null);
        }}>
          标记为待处理
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedTask) handleStatusChange(selectedTask, 'in-progress');
          setAnchorEl(null);
        }}>
          标记为进行中
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedTask) handleStatusChange(selectedTask, 'completed');
          setAnchorEl(null);
        }}>
          标记为已完成
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskList; 