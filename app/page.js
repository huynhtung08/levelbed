"use client";
import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';

export default function HeightMapApp() {
  // Khởi tạo lưới 3x3 với giá trị mặc định là 0
  const [points, setPoints] = useState([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]);

  const updatePoint = (row, col, val) => {
    const newPoints = [...points];
    newPoints[row][col] = parseFloat(val) || 0;
    setPoints(newPoints);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-900 text-white">
      {/* Sidebar nhập liệu */}
      <div className="w-full md:w-80 p-6 bg-slate-800 shadow-xl z-10">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">Height Map Input</h1>
        <p className="text-sm mb-4 text-slate-400">Nhập độ cao cho lưới 3x3:</p>
        
        <div className="grid grid-cols-3 gap-2 mb-8">
          {points.map((row, rIdx) => 
            row.map((val, cIdx) => (
              <input
                key={`${rIdx}-${cIdx}`}
                type="number"
                value={val}
                onChange={(e) => updatePoint(rIdx, cIdx, e.target.value)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-center focus:border-blue-500 outline-none transition-all"
              />
            ))
          )}
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center"><span className="w-3 h-3 bg-red-500 mr-2"></span> Cao (Red)</div>
          <div className="flex items-center"><span className="w-3 h-3 bg-yellow-400 mr-2"></span> Tương đối (Yellow)</div>
          <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 mr-2"></span> Phẳng/Thấp (Blue)</div>
        </div>
      </div>

      {/* Vùng hiển thị 3D */}
      <div className="flex-1 relative cursor-move">
        <Canvas shadows={{ type: THREE.PCFShadowMap }}>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />
          <OrbitControls />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} castShadow />
          
          <Surface points={points} />
          
          <Grid infiniteGrid fadeDistance={20} cellColor="#334155" />
        </Canvas>
      </div>
    </div>
  );
}

// Component xử lý bề mặt 3D
function Surface({ points }: { points: number[][] }) {
  const size = 3;
  const meshRef = React.useRef<THREE.Mesh>(null);

  const { vertices, colors } = useMemo(() => {
    const v: number[] = [];
    const c: number[] = [];
    const color = new THREE.Color();

    // Duyệt qua mảng 3x3
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const h = points[i][j];
        
        // Tọa độ: X = j, Y = h (độ cao), Z = i
        // Trừ đi 1 để căn giữa tâm (0,0)
        v.push(j - 1, h, i - 1);
        
        // Logic màu sắc
        if (h > 1) color.set('#ef4444');      // Cao: Đỏ
        else if (h > 0) color.set('#facc15'); // Tương đối: Vàng
        else color.set('#3b82f6');            // Phẳng: Xanh dương
        
        c.push(color.r, color.g, color.b);
      }
    }
    return { 
      vertices: new Float32Array(v), 
      colors: new Float32Array(c) 
    };
  }, [points]); // Khi points thay đổi, tính toán lại vertices

  // Cập nhật mesh khi dữ liệu thay đổi
  React.useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.geometry.attributes.color.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals(); // Để ánh sáng đổ bóng đúng sau khi đổi hình dạng
    }
  }, [vertices]);

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2, 2, 2]}>
        <bufferAttribute 
          attach="attributes-position" 
          count={vertices.length / 3} 
          array={vertices} 
          itemSize={3} 
        />
        <bufferAttribute 
          attach="attributes-color" 
          count={colors.length / 3} 
          array={colors} 
          itemSize={3} 
        />
      </planeGeometry>
      <meshStandardMaterial 
        vertexColors 
        side={THREE.DoubleSide} 
        flatShading 
        roughness={0.3} 
      />
    </mesh>
  );
}