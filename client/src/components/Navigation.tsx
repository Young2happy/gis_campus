import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Map as MapIcon,
  Assignment as AssignmentIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  HelpOutline as HelpIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
}

interface NavigationProps {
  user: User | null;
  currentView: 'map' | 'tasks' | 'users' | 'buildings';
  onViewChange: (view: 'map' | 'tasks' | 'users' | 'buildings') => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  user,
  currentView,
  onViewChange,
  onLoginClick,
  onRegisterClick,
  onLogout
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            智慧校园系统
          </Typography>

          {user && (
            <IconButton 
              color="inherit" 
              sx={{ mr: 1 }}
              onClick={handleNotificationMenuOpen}
            >
              <NotificationsIcon />
            </IconButton>
          )}
          
          {user ? (
            <>
              <Button 
                color="inherit" 
                onClick={handleUserMenuOpen}
                startIcon={
                  <Avatar 
                    sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}
                  >
                    {user.name.charAt(0)}
                  </Avatar>
                }
              >
                {user.name} ({user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : '学生'})
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: { minWidth: 180 }
                }}
              >
                <MenuItem dense disabled>
                  <Typography variant="body2" color="textSecondary">
                    {user.username}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleUserMenuClose}>
                  <ListItemIcon>
                    <AccountCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>个人资料</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleUserMenuClose}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>设置</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>退出登录</ListItemText>
                </MenuItem>
              </Menu>
              
              {/* 通知菜单 */}
              <Menu
                anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={handleNotificationMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: { width: 320, maxHeight: 400 }
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    通知中心
                  </Typography>
                </Box>
                
                <MenuItem>
                  <Box sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="bold">
                        系统更新
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        2小时前
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      系统已更新到最新版本，新增了多项功能和优化
                    </Typography>
                  </Box>
                </MenuItem>
                
                <MenuItem>
                  <Box sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="bold">
                        新任务分配
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        昨天
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      您有一个新的任务需要处理
                    </Typography>
                    <Chip 
                      label="查看详情" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </MenuItem>
                
                <Box sx={{ p: 1.5, borderTop: '1px solid #eee', textAlign: 'center' }}>
                  <Button size="small">
                    查看全部通知
                  </Button>
                </Box>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                startIcon={<LoginIcon />}
                onClick={onLoginClick}
                sx={{ mr: 1 }}
              >
                登录
              </Button>
              <Button 
                variant="outlined" 
                color="inherit"
                onClick={onRegisterClick}
              >
                注册
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <List sx={{ width: 250 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="h6">智慧校园导航</Typography>
          </Box>
          
          <ListItem 
            button 
            selected={currentView === 'map'}
            onClick={() => {
              onViewChange('map');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              <MapIcon color={currentView === 'map' ? 'primary' : undefined} />
            </ListItemIcon>
            <ListItemText primary="校园地图" />
          </ListItem>
          
          <ListItem 
            button 
            selected={currentView === 'tasks'}
            onClick={() => {
              onViewChange('tasks');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              <AssignmentIcon color={currentView === 'tasks' ? 'primary' : undefined} />
            </ListItemIcon>
            <ListItemText primary="任务管理" />
          </ListItem>
          
          {user && user.role === 'admin' && (
            <>
              <Divider sx={{ my: 1 }}>
                <Chip label="管理功能" size="small" />
              </Divider>
              
              <ListItem 
                button 
                selected={currentView === 'buildings'}
                onClick={() => {
                  onViewChange('buildings');
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  <ApartmentIcon color={currentView === 'buildings' ? 'primary' : undefined} />
                </ListItemIcon>
                <ListItemText primary="建筑管理" />
              </ListItem>
              
              <ListItem 
                button 
                selected={currentView === 'users'}
                onClick={() => {
                  onViewChange('users');
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  <PeopleIcon color={currentView === 'users' ? 'primary' : undefined} />
                </ListItemIcon>
                <ListItemText primary="用户管理" />
              </ListItem>
            </>
          )}
          
          <Divider sx={{ my: 1 }} />
          
          <ListItem button onClick={() => setDrawerOpen(false)}>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary="帮助与文档" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Navigation; 