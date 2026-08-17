import { useState, useEffect } from 'react';

interface DiceCubeProps {
  value: number | null;
  isRolling: boolean;
  size?: number;
}

// CSS 3D dice with wood/bronze styling
export function DiceCube({ value, isRolling, size = 128 }: DiceCubeProps) {
  const [rotation, setRotation] = useState({ x: -25, y: 45 });

  useEffect(() => {
    if (!isRolling) {
      if (value) {
        setRotation(getRotationForValue(value));
      }
      return;
    }

    let count = 0;
    const interval = setInterval(() => {
      setRotation({
        x: Math.random() * 720 - 360,
        y: Math.random() * 720 - 360,
      });
      count++;
      if (count > 15) {
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isRolling, value]);

  const getRotationForValue = (v: number): { x: number; y: number } => {
    switch (v) {
      case 1: return { x: 0, y: 0 };
      case 2: return { x: 0, y: -90 };
      case 3: return { x: -90, y: 0 };
      case 4: return { x: 90, y: 0 };
      case 5: return { x: 0, y: 90 };
      case 6: return { x: 180, y: 0 };
      default: return { x: -25, y: 45 };
    }
  };

  const dotPositions: Record<number, string[]> = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'mid-left', 'mid-right', 'bottom-left', 'bottom-right'],
  };

  const renderFace = (faceValue: number) => {
    const positions = dotPositions[faceValue] || [];
    return (
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-3">
        {positions.map((pos) => {
          const posClass = {
            'center': 'col-start-2 row-start-2',
            'top-left': 'col-start-1 row-start-1',
            'top-right': 'col-start-3 row-start-1',
            'mid-left': 'col-start-1 row-start-2',
            'mid-right': 'col-start-3 row-start-2',
            'bottom-left': 'col-start-1 row-start-3',
            'bottom-right': 'col-start-3 row-start-3',
          }[pos];
          return (
            <div
              key={pos}
              className={`${posClass} flex items-center justify-center`}
            >
              <div className="w-3 h-3 rounded-full bg-bone/90 shadow-inner" />
            </div>
          );
        })}
      </div>
    );
  };

  const half = size / 2;

  const faceStyle = (transform: string): React.CSSProperties => ({
    position: 'absolute',
    width: size,
    height: size,
    background: 'linear-gradient(145deg, #2a2d26 0%, #1a1c17 100%)',
    border: '2px solid #8C5B37',
    borderRadius: 16,
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 10px rgba(181,138,74,0.1)',
    transform,
    backfaceVisibility: 'hidden' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: 600,
      }}
    >
      <div
        className="relative w-full h-full transition-transform"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transitionDuration: isRolling ? '0.08s' : '1.2s',
          transitionTimingFunction: isRolling ? 'linear' : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Front - 1 */}
        <div style={faceStyle(`translateZ(${half}px)`)}>
          {renderFace(1)}
        </div>
        {/* Back - 6 */}
        <div style={faceStyle(`rotateY(180deg) translateZ(${half}px)`)}>
          {renderFace(6)}
        </div>
        {/* Right - 5 */}
        <div style={faceStyle(`rotateY(90deg) translateZ(${half}px)`)}>
          {renderFace(5)}
        </div>
        {/* Left - 2 */}
        <div style={faceStyle(`rotateY(-90deg) translateZ(${half}px)`)}>
          {renderFace(2)}
        </div>
        {/* Top - 3 */}
        <div style={faceStyle(`rotateX(90deg) translateZ(${half}px)`)}>
          {renderFace(3)}
        </div>
        {/* Bottom - 4 */}
        <div style={faceStyle(`rotateX(-90deg) translateZ(${half}px)`)}>
          {renderFace(4)}
        </div>
      </div>
    </div>
  );
}
