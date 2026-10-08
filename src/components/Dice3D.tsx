import type { CSSProperties } from 'react';

import { getPublicUrl } from '../lib/assets';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  isPressed: boolean;
  size?: number;
}

// Texture values for the cube's logical positions:
// front, right, left, top, bottom, back.
// Each row is a valid physical orientation with the requested value on top.
const faceLayoutByTopValue: Record<number, number[]> = {
  1: [2, 4, 3, 1, 6, 5],
  2: [6, 4, 3, 2, 5, 1],
  3: [2, 1, 6, 3, 4, 5],
  4: [2, 6, 1, 4, 3, 5],
  5: [1, 4, 3, 5, 2, 6],
  6: [5, 4, 3, 6, 1, 2],
};

const rollingFaceLayout = faceLayoutByTopValue[1];

const presentationRotation = 'rotateX(-18deg) rotateY(32deg) rotateZ(-2deg)';

export function Dice3D({ value, isRolling, isPressed, size = 230 }: Dice3DProps) {
  const half = size / 2;
  const faceLayout = value ? faceLayoutByTopValue[value] ?? rollingFaceLayout : rollingFaceLayout;
  const cubeStyle = {
    '--dice-half': `${half}px`,
    transform: isRolling ? undefined : `${presentationRotation} ${isPressed ? 'scale3d(.96,.96,.96)' : ''}`,
  } as CSSProperties;

  const transforms = [
    `translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
  ];

  return (
    <div
      className="dice-3d-scene"
      style={{ width: size, height: size }}
      role="img"
      aria-label={isRolling ? 'Кубик вращается' : value ? `На кубике ${value}` : 'Игровой кубик'}
    >
      <div className={`dice-3d-cube ${isRolling ? 'is-rolling' : ''}`} style={cubeStyle}>
        {transforms.map((transform, index) => (
          <div
            key={index}
            className="dice-3d-face"
            style={{ transform }}
          >
            <img
              src={getPublicUrl(`/runtime/cube_B_v001/faces/dice_face_${faceLayout[index]}.png`)}
              alt=""
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
