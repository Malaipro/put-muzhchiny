import { useEffect, useState, type CSSProperties } from 'react';

import { getPublicUrl } from '../lib/assets';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  isPressed: boolean;
  size?: number;
}

// Texture values for the cube's logical positions: front, right, left, top,
// bottom, back. The visible isometric composition uses top, left and front.
// Each row remains a valid physical orientation with the requested value on top.
const faceLayoutByTopValue: Record<number, number[]> = {
  1: [2, 4, 3, 1, 6, 5],
  2: [6, 4, 3, 2, 5, 1],
  3: [2, 1, 6, 3, 4, 5],
  4: [2, 6, 1, 4, 3, 5],
  5: [1, 4, 3, 5, 2, 6],
  6: [5, 4, 3, 6, 1, 2],
};

export function Dice3D({ value, isRolling, isPressed, size = 230 }: Dice3DProps) {
  const [rollingValue, setRollingValue] = useState(1);

  useEffect(() => {
    if (!isRolling) return;

    const interval = window.setInterval(() => {
      setRollingValue((current) => current % 6 + 1);
    }, 95);

    return () => window.clearInterval(interval);
  }, [isRolling]);

  const visibleValue = value ?? rollingValue;
  const faceLayout = faceLayoutByTopValue[visibleValue] ?? faceLayoutByTopValue[1];
  const visibleFaces = [
    { className: 'is-top', value: faceLayout[3] },
    { className: 'is-left', value: faceLayout[2] },
    { className: 'is-right', value: faceLayout[0] },
  ];
  const cubeStyle = {
    transform: !isRolling && isPressed ? 'translateY(3px) scale(.96)' : undefined,
  } as CSSProperties;

  return (
    <div
      className="dice-3d-scene"
      style={{ width: size, height: size }}
      role="img"
      aria-label={isRolling ? 'Кубик вращается' : value ? `На кубике ${value}` : 'Игровой кубик'}
    >
      <div className={`dice-3d-cube ${isRolling ? 'is-rolling' : ''}`} style={cubeStyle}>
        {visibleFaces.map((face) => (
          <img
            key={face.className}
            className={`dice-3d-face ${face.className}`}
            src={getPublicUrl(`/runtime/cube_B_v001/faces/dice_face_${face.value}.png`)}
            alt=""
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
