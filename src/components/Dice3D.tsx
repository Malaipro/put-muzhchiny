import { useRef, useEffect } from 'react';
import { getPublicUrl } from '../lib/assets';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  isPressed: boolean;
  size?: number;
}

export function Dice3D({ value, isRolling, isPressed, size = 200 }: Dice3DProps) {
  const cubeRef = useRef<HTMLDivElement>(null);

  // Half of cube size for translateZ
  const half = size / 2;

  // Face rotations to show specific value when not rolling
  const faceRotations: Record<number, { x: number; y: number }> = {
    1: { x: 0, y: 0 },       // front
    2: { x: 0, y: -90 },     // right
    3: { x: 0, y: 90 },      // left
    4: { x: -90, y: 0 },     // top
    5: { x: 90, y: 0 },      // bottom
    6: { x: 0, y: 180 },     // back
  };

  useEffect(() => {
    if (!cubeRef.current) return;
    
    if (isRolling) {
      // Random rotation during rolling
      const randomX = Math.floor(Math.random() * 4) * 360 + 720;
      const randomY = Math.floor(Math.random() * 4) * 360 + 720;
      cubeRef.current.style.transition = 'transform 1.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
      cubeRef.current.style.transform = `rotateX(${randomX}deg) rotateY(${randomY}deg)`;
    } else if (value && faceRotations[value]) {
      // Show the landed face
      const { x, y } = faceRotations[value];
      cubeRef.current.style.transition = 'transform 0.3s ease-out';
      cubeRef.current.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
    } else {
      // Default idle position
      cubeRef.current.style.transition = 'transform 0.3s ease-out';
      cubeRef.current.style.transform = 'rotateX(-15deg) rotateY(25deg)';
    }
  }, [isRolling, value]);

  const faces = [1, 2, 3, 4, 5, 6];
  
  const getFaceTransform = (face: number): string => {
    switch (face) {
      case 1: return `translateZ(${half}px)`;
      case 2: return `rotateY(90deg) translateZ(${half}px)`;
      case 3: return `rotateY(-90deg) translateZ(${half}px)`;
      case 4: return `rotateX(90deg) translateZ(${half}px)`;
      case 5: return `rotateX(-90deg) translateZ(${half}px)`;
      case 6: return `rotateY(180deg) translateZ(${half}px)`;
      default: return '';
    }
  };

  return (
    <div 
      className="relative"
      style={{ 
        width: size, 
        height: size,
        perspective: '800px',
      }}
    >
      <div
        ref={cubeRef}
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: isPressed 
            ? 'rotateX(-15deg) rotateY(25deg) scale(0.96)' 
            : 'rotateX(-15deg) rotateY(25deg)',
          transition: isPressed ? 'transform 0.1s ease' : 'transform 0.3s ease-out',
        }}
      >
        {faces.map((face) => (
          <div
            key={face}
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{
              transform: getFaceTransform(face),
              backfaceVisibility: 'hidden',
            }}
          >
            <img
              src={getPublicUrl(`/dice/dice_face_${face}.png`)}
              alt={`Грань ${face}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
