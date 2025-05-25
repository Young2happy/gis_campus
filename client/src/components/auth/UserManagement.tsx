import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  department?: string;
  studentId?: string;
  teacherId?: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserFormData {
  username: string;
  password?: string; // 将密码设为可选
  name: string;
  role: 'student' | 'teacher' | 'admin';
  department?: string;
  studentId?: string;
  teacherId?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    name: '',
    role: 'student',
    department: '',
    studentId: '',
    teacherId: ''
  });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/auth/users', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取用户列表失败');
      console.error('获取用户列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: undefined, // 编辑时密码为undefined
        name: user.name,
        role: user.role,
        department: user.department || '',
        studentId: user.studentId || '',
        teacherId: user.teacherId || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'student',
        department: '',
        studentId: '',
        teacherId: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // 更新用户
        const updateData = { ...formData };
        // 如果密码为空或undefined，从提交数据中移除
        if (!updateData.password) {
          const { password, ...restData } = updateData;
          await axios.put(
            `http://localhost:5001/api/auth/users/${editingUser._id}`,
            restData,
            { headers: { Authorization: `Bearer ${getToken()}` } }
          );
        } else {
          await axios.put(
            `http://localhost:5001/api/auth/users/${editingUser._id}`,
            updateData,
            { headers: { Authorization: `Bearer ${getToken()}` } }
          );
        }
      } else {
        // 创建新用户
        await axios.post(
          'http://localhost:5001/api/auth/register',
          formData,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      }
      
      fetchUsers();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败');
      console.error('保存用户失败:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      try {
        await axios.delete(`http://localhost:5001/api/auth/users/${userId}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        fetchUsers();
      } catch (err: any) {
        setError(err.response?.data?.message || '删除用户失败');
        console.error('删除用户失败:', err);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '从未登录';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">用户管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          添加用户
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>用户名</TableCell>
                <TableCell>姓名</TableCell>
                <TableCell>角色</TableCell>
                <TableCell>院系</TableCell>
                <TableCell>学号/工号</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>最后登录</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    {user.role === 'admin' && '管理员'}
                    {user.role === 'teacher' && '教师'}
                    {user.role === 'student' && '学生'}
                  </TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>{user.studentId || user.teacherId || '-'}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{formatDate(user.lastLogin)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteUser(user._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? '编辑用户' : '添加用户'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <TextField
              label="用户名"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              fullWidth
              required
              disabled={!!editingUser} // 编辑时不能修改用户名
            />
            
            <TextField
              label={editingUser ? '新密码（留空保持不变）' : '密码'}
              name="password"
              type="password"
              value={formData.password || ''}
              onChange={handleInputChange}
              fullWidth
              required={!editingUser} // 新用户必须填写密码
            />
            
            <TextField
              label="姓名"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>角色</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="角色"
                onChange={handleSelectChange}
              >
                <MenuItem value="student">学生</MenuItem>
                <MenuItem value="teacher">教师</MenuItem>
                <MenuItem value="admin">管理员</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="院系"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              fullWidth
            />
            
            {formData.role === 'student' && (
              <TextField
                label="学号"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                fullWidth
              />
            )}
            
            {formData.role === 'teacher' && (
              <TextField
                label="教师编号"
                name="teacherId"
                value={formData.teacherId}
                onChange={handleInputChange}
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            取消
          </Button>
          <Button onClick={handleSubmit} color="primary" startIcon={<SaveIcon />}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 