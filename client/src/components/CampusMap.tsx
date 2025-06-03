import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Icon, LatLng, LeafletMouseEvent, DivIcon } from 'leaflet';
import L from 'leaflet';
import { Box, Card, CardContent, Typography, Button, Stack, Chip, Fade, Snackbar, Alert } from '@mui/material';
import { DirectionsWalk, Timer, Straighten, Clear, MyLocation, PinDrop } from '@mui/icons-material';
import * as turf from '@turf/turf';
import 'leaflet-ant-path';
import 'leaflet/dist/leaflet.css';
import './CampusMap.css';

// 修复 Leaflet 默认图标问题
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// 自定义起点和终点图标
const createCustomIcon = (type: 'start' | 'end') => {
  return new DivIcon({
    className: `custom-marker-icon ${type}-marker`,
    html: `<div class="marker-pulse"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// 获取真实路径
async function getRoutePath(start: [number, number], end: [number, number]): Promise<[number, number][]> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
    }
    throw new Error('No route found');
  } catch (error) {
    console.error('Error fetching route:', error);
    // 如果路径规划失败，返回直线路径作为后备方案
    const line = turf.lineString([[start[1], start[0]], [end[1], end[0]]]);
    const curved = turf.bezierSpline(line);
    return curved.geometry.coordinates.map(coord => [coord[1], coord[0]]);
  }
}

// 计算路径距离
function calculatePathDistance(path: [number, number][]): number {
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += calculateDistance(path[i], path[i + 1]);
  }
  return totalDistance;
}

// 计算两点之间的距离
function calculateDistance(p1: [number, number], p2: [number, number]): number {
  const from = turf.point([p1[1], p1[0]]);
  const to = turf.point([p2[1], p2[0]]);
  return turf.distance(from, to, { units: 'kilometers' }) * 1000;
}

// 动画路径组件
const AnimatedPath: React.FC<{ 
  positions: [number, number][];
  onAnimationComplete?: () => void;
}> = ({ positions, onAnimationComplete }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length < 2) return;

    // 创建蚂蚁线路径
    const antPath = new (L as any).Polyline.AntPath(positions, {
      delay: 800,
      dashArray: [10, 20],
      weight: 5,
      color: '#39FF14',
      pulseColor: '#7FFF00',
      paused: false,
      reverse: false,
      hardwareAccelerated: true
    }).addTo(map);

    // 添加发光效果
    const glowPath = L.polyline(positions, {
      color: '#39FF14',
      weight: 8,
      opacity: 0.3
    }).addTo(map);

    // 自动缩放地图以显示整个路径
    map.fitBounds(antPath.getBounds(), { padding: [50, 50] });

    // 路径动画完成后的回调
    setTimeout(() => {
      onAnimationComplete?.();
    }, 1000);

    return () => {
      map.removeLayer(antPath);
      map.removeLayer(glowPath);
    };
  }, [positions, map, onAnimationComplete]);

  return null;
};

// 地图点击事件处理组件
const MapClickHandler: React.FC<{
  onMapClick: (e: LeafletMouseEvent) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click: onMapClick,
  });
  return null;
};

// 路径规划控制面板
const PathControls: React.FC<{
  onClear: () => void;
  pathInfo: { distance: number; time: number } | null;
  isAnimating: boolean;
  markers: [number, number][];
}> = ({ onClear, pathInfo, isAnimating, markers }) => {
  return (
    <Card sx={{ 
      position: 'absolute', 
      top: 10, 
      right: 10, 
      zIndex: 1000, 
      width: 300,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
            路径规划
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={onClear}
            size="small"
            disabled={isAnimating}
          >
            清除
          </Button>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary" sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <PinDrop fontSize="small" color="primary" />
            点击地图放置起点和终点标记
          </Typography>
          {markers?.length === 1 && (
            <Typography variant="body2" color="success.main">
              请点击地图选择终点位置
            </Typography>
          )}
        </Stack>
        <Fade in={!!pathInfo}>
          <Stack direction="row" spacing={1} mt={2}>
            <Chip
              icon={<Straighten />}
              label={`${pathInfo ? Math.round(pathInfo.distance) : 0}米`}
              color="primary"
              sx={{ flex: 1 }}
            />
            <Chip
              icon={<Timer />}
              label={`${pathInfo ? Math.round(pathInfo.time) : 0}分钟`}
              color="secondary"
              sx={{ flex: 1 }}
            />
          </Stack>
        </Fade>
      </CardContent>
    </Card>
  );
};

const CampusMap: React.FC = () => {
  const [markers, setMarkers] = useState<[number, number][]>([]);
  const [path, setPath] = useState<[number, number][]>([]);
  const [pathInfo, setPathInfo] = useState<{ distance: number; time: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);

  const handleMapClick = useCallback(async (e: LeafletMouseEvent) => {
    if (isAnimating) return;
    
    const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
    
    if (markers.length < 2) {
      setMarkers(prev => [...prev, newPosition]);
      
      if (markers.length === 0) {
        setPath([]);
        setPathInfo(null);
      } else {
        setIsAnimating(true);
        try {
          // 获取真实路径
          const routePath = await getRoutePath(markers[0], newPosition);
          setPath(routePath);
          
          // 计算实际路径距离
          const totalDistance = calculatePathDistance(routePath);
          // 假设步行速度为 1.2 米/秒
          const timeInMinutes = totalDistance / (1.2 * 60);
          
          setPathInfo({
            distance: totalDistance,
            time: timeInMinutes
          });
        } catch (error) {
          console.error('Failed to get route:', error);
        }
      }
    }
  }, [markers, isAnimating]);

  const handleClear = useCallback(() => {
    if (isAnimating) return;
    setMarkers([]);
    setPath([]);
    setPathInfo(null);
  }, [isAnimating]);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
  }, []);

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={[39.9062, 116.4084]}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {markers.map((position, index) => (
          <Marker
            key={index}
            position={position}
            icon={createCustomIcon(index === 0 ? 'start' : 'end')}
          />
        ))}
        {path.length > 0 && (
          <AnimatedPath 
            positions={path} 
            onAnimationComplete={handleAnimationComplete}
          />
        )}
        <MapClickHandler onMapClick={handleMapClick} />
      </MapContainer>
      
      {/* 左上角提示框 */}
      <Card sx={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 1000,
        width: 300,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        display: markers.length === 2 ? 'none' : 'block'
      }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <PinDrop color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              路径规划
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {markers.length === 0 
              ? "点击地图任意位置放置起点标记"
              : "请点击地图选择终点位置"}
          </Typography>
        </CardContent>
      </Card>

      <PathControls 
        onClear={handleClear} 
        pathInfo={pathInfo}
        isAnimating={isAnimating}
        markers={markers}
      />
    </Box>
  );
};

export default CampusMap; 