import React, { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import { LocalLibrary, Restaurant, LocalShipping } from '@mui/icons-material';
import './FlipBoard.css';

interface Location {
  id: string;
  code: string;
  name: string;
  currentCount: number;
  maxCount: number;
  type: 'library' | 'canteen' | 'express';
  updateTime?: string;
}

const getStatusClass = (current: number, max: number): string => {
  const ratio = current / max;
  if (ratio < 0.5) return 'status-normal';
  if (ratio < 0.8) return 'status-busy';
  return 'status-crowded';
};

const getStatusText = (current: number, max: number): string => {
  const ratio = current / max;
  if (ratio < 0.5) return '空闲';
  if (ratio < 0.8) return '较忙';
  return '拥挤';
};

const FlipBoard: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([
    { id: 'lib1', code: 'LIB-A', name: '中心图书馆', currentCount: 153, maxCount: 500, type: 'library' },
    { id: 'lib2', code: 'LIB-B', name: '工学分馆', currentCount: 89, maxCount: 200, type: 'library' },
    { id: 'lib3', code: 'LIB-C', name: '医学分馆', currentCount: 45, maxCount: 150, type: 'library' },
    { id: 'can1', code: 'CAN-1', name: '第一食堂', currentCount: 155, maxCount: 300, type: 'canteen' },
    { id: 'can2', code: 'CAN-2', name: '第二食堂', currentCount: 98, maxCount: 250, type: 'canteen' },
    { id: 'can3', code: 'CAN-3', name: '教工食堂', currentCount: 76, maxCount: 200, type: 'canteen' },
    { id: 'exp1', code: 'EXP-1', name: '主楼快递点', currentCount: 27, maxCount: 100, type: 'express' },
    { id: 'exp2', code: 'EXP-2', name: '宿舍快递点', currentCount: 45, maxCount: 150, type: 'express' },
  ]);

  // 模拟实时更新数据
  useEffect(() => {
    const interval = setInterval(() => {
      setLocations(prev => prev.map(location => ({
        ...location,
        currentCount: Math.floor(Math.random() * location.maxCount),
        updateTime: new Date().toLocaleTimeString()
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'library':
        return <LocalLibrary />;
      case 'canteen':
        return <Restaurant />;
      case 'express':
        return <LocalShipping />;
      default:
        return null;
    }
  };

  return (
    <Box className="flip-board">
      <Grid container className="header-row" spacing={2}>
        <Grid item xs={2}>编号</Grid>
        <Grid item xs={3}>位置</Grid>
        <Grid item xs={3}>当前人数</Grid>
        <Grid item xs={2}>状态</Grid>
        <Grid item xs={2}>更新时间</Grid>
      </Grid>
      
      {locations.map((location) => (
        <Box key={location.id} className="flip-item">
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs={2}>
              <span className="location-code">{location.code}</span>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getIcon(location.type)}
                <span className="location-name">{location.name}</span>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <span className="count-display flip-animation">
                {location.currentCount} / {location.maxCount}
              </span>
            </Grid>
            <Grid item xs={2}>
              <span className={`status-badge ${getStatusClass(location.currentCount, location.maxCount)}`}>
                {getStatusText(location.currentCount, location.maxCount)}
              </span>
            </Grid>
            <Grid item xs={2}>
              <span className="time-display">
                {location.updateTime || new Date().toLocaleTimeString()}
              </span>
            </Grid>
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default FlipBoard; 