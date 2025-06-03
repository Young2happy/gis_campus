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
  Grid,
  Chip,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Building {
  _id: string;
  name: string;
  code: string;
  type: 'academic' | 'residential' | 'administrative' | 'service' | 'other';
  floors: number;
  description?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address?: string;
  constructionYear?: number;
  area?: number;
  facilities?: string[];
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

interface BuildingFormData {
  name: string;
  code: string;
  type: 'academic' | 'residential' | 'administrative' | 'service' | 'other';
  floors: number;
  description: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  address: string;
  constructionYear: number | '';
  area: number | '';
  facilities: string;
}

const defaultCoordinates = {
  longitude: 116.3252,
  latitude: 40.0064
};

const BuildingManagement: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [formData, setFormData] = useState<BuildingFormData>({
    name: '',
    code: '',
    type: 'academic',
    floors: 1,
    description: '',
    coordinates: { ...defaultCoordinates },
    address: '',
    constructionYear: '',
    area: '',
    facilities: ''
  });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/buildings');
      setBuildings(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取建筑列表失败');
      console.error('获取建筑列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (building?: Building) => {
    if (building) {
      setEditingBuilding(building);
      setFormData({
        name: building.name,
        code: building.code,
        type: building.type,
        floors: building.floors,
        description: building.description || '',
        coordinates: {
          longitude: building.location.coordinates[0],
          latitude: building.location.coordinates[1]
        },
        address: building.address || '',
        constructionYear: building.constructionYear || '',
        area: building.area || '',
        facilities: building.facilities ? building.facilities.join(', ') : ''
      });
    } else {
      setEditingBuilding(null);
      setFormData({
        name: '',
        code: '',
        type: 'academic',
        floors: 1,
        description: '',
        coordinates: { ...defaultCoordinates },
        address: '',
        constructionYear: '',
        area: '',
        facilities: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBuilding(null);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (name === 'longitude' || name === 'latitude') {
      setFormData({
        ...formData,
        coordinates: {
          ...formData.coordinates,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name as string]: value
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSubmit = async () => {
    try {
      // 将表单数据转换为API格式
      const buildingData = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        floors: Number(formData.floors),
        description: formData.description,
        location: {
          type: 'Point',
          coordinates: [
            Number(formData.coordinates.longitude),
            Number(formData.coordinates.latitude)
          ]
        },
        address: formData.address,
        constructionYear: formData.constructionYear ? Number(formData.constructionYear) : undefined,
        area: formData.area ? Number(formData.area) : undefined,
        facilities: formData.facilities ? formData.facilities.split(',').map(f => f.trim()) : []
      };

      if (editingBuilding) {
        // 更新建筑
        await axios.put(
          `http://localhost:5001/api/buildings/${editingBuilding._id}`,
          buildingData,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      } else {
        // 创建新建筑
        await axios.post(
          'http://localhost:5001/api/buildings',
          buildingData,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      }
      
      fetchBuildings();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败');
      console.error('保存建筑失败:', err);
    }
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    if (window.confirm('确定要删除这个建筑吗？此操作不可撤销。')) {
      try {
        await axios.delete(`http://localhost:5001/api/buildings/${buildingId}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        fetchBuildings();
      } catch (err: any) {
        setError(err.response?.data?.message || '删除建筑失败');
        console.error('删除建筑失败:', err);
      }
    }
  };

  const getBuildingTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'academic': '教学楼',
      'residential': '宿舍楼',
      'administrative': '行政楼',
      'service': '服务设施',
      'other': '其他'
    };
    return typeMap[type] || type;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">建筑管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          添加建筑
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
                <TableCell>编号</TableCell>
                <TableCell>名称</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>楼层数</TableCell>
                <TableCell>地址</TableCell>
                <TableCell>建筑面积(㎡)</TableCell>
                <TableCell>设施</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {buildings.map((building) => (
                <TableRow key={building._id}>
                  <TableCell>{building.code}</TableCell>
                  <TableCell>{building.name}</TableCell>
                  <TableCell>{getBuildingTypeText(building.type)}</TableCell>
                  <TableCell>{building.floors}</TableCell>
                  <TableCell>{building.address || '-'}</TableCell>
                  <TableCell>{building.area || '-'}</TableCell>
                  <TableCell>
                    {building.facilities && building.facilities.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {building.facilities.slice(0, 3).map((facility, index) => (
                          <Chip key={index} label={facility} size="small" />
                        ))}
                        {building.facilities.length > 3 && (
                          <Chip label={`+${building.facilities.length - 3}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(building)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteBuilding(building._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingBuilding ? '编辑建筑' : '添加建筑'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="名称"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="编号"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>类型</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    label="类型"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="academic">教学楼</MenuItem>
                    <MenuItem value="residential">宿舍楼</MenuItem>
                    <MenuItem value="administrative">行政楼</MenuItem>
                    <MenuItem value="service">服务设施</MenuItem>
                    <MenuItem value="other">其他</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="楼层数"
                  name="floors"
                  type="number"
                  value={formData.floors}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="描述"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="经度"
                  name="longitude"
                  type="number"
                  value={formData.coordinates.longitude}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <PlaceIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="纬度"
                  name="latitude"
                  type="number"
                  value={formData.coordinates.latitude}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <PlaceIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="地址"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="建造年份"
                  name="constructionYear"
                  type="number"
                  value={formData.constructionYear}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="建筑面积(㎡)"
                  name="area"
                  type="number"
                  value={formData.area}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="设施 (用逗号分隔)"
                  name="facilities"
                  value={formData.facilities}
                  onChange={handleInputChange}
                  fullWidth
                  helperText="例如: 电梯, 空调, 会议室"
                />
              </Grid>
            </Grid>
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

export default BuildingManagement; 