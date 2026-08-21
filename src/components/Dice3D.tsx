import { useEffect, useRef, useState } from 'react';
import { getPublicUrl } from '../lib/assets';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  size?: number;
}

// CSS 3D dice using designer face textures
export function Dice3D({ value, isRolling, size = 120 }: Dice3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentValue, setCurrentValue] = useState(value ?? 1);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!isRolling) {
      if (value) {
        setCurrentValue(value);
        setShowResult(true);
      }
      return;
    }

    setShowResult(false);
    let count = 0;
    const interval = setInterval(() => {
      setCurrentValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 12) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRolling, value]);

  // Calculate final rotation for each face (1-6)
  const getFinalRotation = (face: number): string => {
    const half = size / 2;
    switch (face) {
      case 1: return `rotateX(0deg) rotateY(0deg) translateZ(${half}px)`;
      case 6: return `rotateX(180deg) rotateY(0deg) translateZ(${half}px)`;
      case 2: return `rotateX(-90deg) rotateY(0deg) translateZ(${half}px)`;
      case 5: return `rotateX(90deg) rotateY(0deg) translateZ(${half}px)`;
      case 3: return `rotateX(0deg) rotateY(-90deg) translateZ(${half}px)`;
      case 4: return `rotateX(0deg) rotateY(90deg) translateZ(${half}px)`;
      default: return `rotateX(0deg) rotateY(0deg) translateZ(${half}px)`;
    }
  };

  const faces = [1, 2, 3, 4, 5, 6];

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: '600px',
      }}
    >
      <div
        className={`w-full h-full relative ${isRolling ? 'animate-dice-3d-roll' : ''}`}
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          animationDuration: '1.35s',
          animationTimingFunction: 'cubic-bezier(.22,1,.36,1)',
          animationFillMode: 'both',
        }}
      >
        {faces.map((face) => (
          <div
            key={face}
            className="absolute inset-0"
            style={{
              width: size,
              height: size,
              backfaceVisibility: 'hidden',
              transform: getFinalRotation(face),
              opacity: showResult && face === currentValue ? 1 : !showResult ? 1 : 0.15,
              transition: 'opacity 0.2s',
            }}
          >
            <img
              src={getPublicUrl(`/dice/dice_face_${face}.png`)}
              alt={`Грань ${face}`}
              width={size}
              height={size}
              className="w-full h-full"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
