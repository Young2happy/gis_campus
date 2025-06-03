import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import CampusMap from './components/CampusMap';
import TaskList from './components/tasks/TaskList';
import CreateTask from './components/tasks/CreateTask';
import FlipBoard from './components/FlipBoard';
import AnnouncementBoard from './components/AnnouncementBoard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import UserManagement from './components/auth/UserManagement';
import BuildingManagement from './components/BuildingManagement';
import Navigation from './components/Navigation';
import './App.css';

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'map' | 'tasks' | 'users' | 'buildings'>('map');
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // 从本地存储中获取用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData: { token: string, user: User }) => {
    setUser(userData.user);
    setLoginOpen(false);
    showSnackbar('登录成功，欢迎回来！', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('map'); // 回到地图视图
    showSnackbar('您已成功退出登录', 'info');
  };

  const handleRegisterSuccess = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
    showSnackbar('注册成功，请登录', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navigation
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLoginClick={() => setLoginOpen(true)}
        onRegisterClick={() => setRegisterOpen(true)}
        onLogout={handleLogout}
      />

      <Box sx={{ flexGrow: 1, display: 'flex', p: 2 }}>
        {/* 左侧信息面板 - 仅在地图和任务视图中显示 */}
        {(currentView === 'map' || currentView === 'tasks') && (
          <Box sx={{ width: '30%', mr: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ flex: '1 0 auto' }}>
              <FlipBoard />
            </Box>
            <Box sx={{ flex: '1 0 auto' }}>
              <AnnouncementBoard />
            </Box>
          </Box>
        )}

        {/* 右侧主要内容区 */}
        <Box sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.paper', 
          borderRadius: 1, 
          overflow: 'hidden',
          width: (currentView === 'users' || currentView === 'buildings') ? '100%' : undefined
        }}>
          {currentView === 'map' && <CampusMap />}
          {currentView === 'tasks' && <TaskList />}
          {currentView === 'users' && user?.role === 'admin' && <UserManagement />}
          {currentView === 'buildings' && user?.role === 'admin' && <BuildingManagement />}
        </Box>
      </Box>

      {currentView === 'tasks' && user && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setCreateTaskOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* 登录对话框 */}
      {loginOpen && (
        <Login 
          onLogin={handleLogin} 
          onClose={() => setLoginOpen(false)}
        />
      )}

      {/* 注册对话框 */}
      {registerOpen && (
        <Register 
          onRegisterSuccess={handleRegisterSuccess}
          onClose={() => setRegisterOpen(false)}
        />
      )}

      {/* 创建任务对话框 */}
      <CreateTask
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onTaskCreated={() => {
          setCreateTaskOpen(false);
        }}
      />

      {/* 全局提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
