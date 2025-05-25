import React, { useState } from 'react';
import {
  Box,
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import facilitiesData from '../data/facilities.json';

interface Facility {
  id: string;
  code: string;
  name: string;
  type: 'library' | 'canteen' | 'express';
  maxCount: number;
  location: {
    lat: number;
    lng: number;
  };
}

const validateFacility = (facility: any): facility is Facility => {
  return (
    typeof facility.id === 'string' &&
    typeof facility.code === 'string' &&
    typeof facility.name === 'string' &&
    ['library', 'canteen', 'express'].includes(facility.type) &&
    typeof facility.maxCount === 'number' &&
    typeof facility.location?.lat === 'number' &&
    typeof facility.location?.lng === 'number'
  );
};

const validateFacilities = (data: any[]): Facility[] => {
  return data.filter(validateFacility);
};

interface FacilityFormData {
  code: string;
  name: string;
  type: 'library' | 'canteen' | 'express';
  maxCount: number;
  location: {
    lat: number;
    lng: number;
  };
}

const FacilityManager: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>(() => 
    validateFacilities(facilitiesData.facilities)
  );
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [formData, setFormData] = useState<FacilityFormData>({
    code: '',
    name: '',
    type: 'library',
    maxCount: 0,
    location: {
      lat: 39.9062,
      lng: 116.4084,
    },
  });

  const handleSave = () => {
    // 保存到本地JSON文件
    const updatedFacilities = [...facilities];
    if (editingFacility) {
      const index = facilities.findIndex(f => f.id === editingFacility.id);
      updatedFacilities[index] = {
        ...editingFacility,
        ...formData,
      };
    } else {
      const newFacility: Facility = {
        id: `${formData.type}${facilities.length + 1}`,
        ...formData,
      };
      updatedFacilities.push(newFacility);
    }
    setFacilities(updatedFacilities);
    
    // 在实际应用中，这里应该调用API来保存数据
    // 这里我们模拟保存到localStorage
    localStorage.setItem('facilities', JSON.stringify({ facilities: updatedFacilities }));
    
    handleClose();
  };

  const handleDelete = (id: string) => {
    const updatedFacilities = facilities.filter(f => f.id !== id);
    setFacilities(updatedFacilities);
    localStorage.setItem('facilities', JSON.stringify({ facilities: updatedFacilities }));
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      code: facility.code,
      name: facility.name,
      type: facility.type,
      maxCount: facility.maxCount,
      location: facility.location,
    });
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingFacility(null);
    setFormData({
      code: '',
      name: '',
      type: 'library',
      maxCount: 0,
      location: {
        lat: 39.9062,
        lng: 116.4084,
      },
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">设施管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          添加设施
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>编号</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>最大容量</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {facilities.map((facility) => (
              <TableRow key={facility.id}>
                <TableCell>{facility.code}</TableCell>
                <TableCell>{facility.name}</TableCell>
                <TableCell>
                  {facility.type === 'library' && '图书馆'}
                  {facility.type === 'canteen' && '食堂'}
                  {facility.type === 'express' && '快递点'}
                </TableCell>
                <TableCell>{facility.maxCount}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(facility)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(facility.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFacility ? '编辑设施' : '添加设施'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="编号"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
            <TextField
              label="名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <FormControl>
              <InputLabel>类型</InputLabel>
              <Select
                value={formData.type}
                label="类型"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'library' | 'canteen' | 'express' })}
              >
                <MenuItem value="library">图书馆</MenuItem>
                <MenuItem value="canteen">食堂</MenuItem>
                <MenuItem value="express">快递点</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="最大容量"
              type="number"
              value={formData.maxCount}
              onChange={(e) => setFormData({ ...formData, maxCount: parseInt(e.target.value) })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="纬度"
                type="number"
                value={formData.location.lat}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, lat: parseFloat(e.target.value) }
                })}
              />
              <TextField
                label="经度"
                type="number"
                value={formData.location.lng}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, lng: parseFloat(e.target.value) }
                })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacilityManager; 