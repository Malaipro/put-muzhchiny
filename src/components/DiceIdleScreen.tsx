import { useState } from 'react';
import { Dice3D } from './Dice3D';

interface DiceIdleScreenProps {
  onRoll: () => void;
  onBack: () => void;
  canRoll?: boolean;
}

export function DiceIdleScreen({ 
  onRoll, 
  onBack, 
  canRoll = true,
}: DiceIdleScreenProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const handlePressStart = () => {
    if (!canRoll || isRolling) return;
    setIsPressed(true);
  };

  const handlePressEnd = () => {
    if (!isPressed) return;
    setIsPressed(false);
  };

  const handleRoll = () => {
    if (!canRoll || isRolling) return;
    setIsRolling(true);
    
    // Call parent's roll handler
    onRoll();

    // Reset rolling state after animation completes
    // Parent should handle navigation to result screen
    setTimeout(() => {
      setIsRolling(false);
    }, 1600);
  };

  return (
    <div 
      className="min-h-dvh flex flex-col relative"
      style={{
        backgroundImage: `url(/textures/base_graphite_topography_400.png)`,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-28">
        
        {/* Header - 7-15% */}
        <header className="w-full text-center mt-[7%]">
          <p 
            className="font-body font-semibold tracking-[0.14em]"
            style={{ 
              fontSize: '12px', 
              color: '#D3AE6F',
            }}
          >
            ПУТЬ МУЖЧИНЫ
          </p>
          <h1 
            className="font-heading font-normal mt-2.5"
            style={{ 
              fontSize: '30px', 
              lineHeight: '36px',
              color: '#E8E1D3',
            }}
          >
            Кубик пути
          </h1>
        </header>

        {/* Dice hero area - 22-57% */}
        <div className="flex-1 flex items-center justify-center w-full my-8">
          <div 
            className="cursor-pointer"
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onClick={handleRoll}
          >
            <Dice3D 
              value={null}
              isRolling={isRolling}
              isPressed={isPressed}
              size={200}
            />
          </div>
        </div>

        {/* Caption - 59-68% */}
        <div className="text-center mb-6" style={{ maxWidth: '300px' }}>
          <p 
            className="font-body font-normal text-center"
            style={{ 
              fontSize: '15px', 
              lineHeight: '23px',
              color: 'rgba(232,225,211,0.76)',
            }}
          >
            Ты готов сделать следующий шаг?
          </p>
          <p 
            className="font-body font-normal text-center mt-1"
            style={{ 
              fontSize: '13px', 
              lineHeight: '20px',
              color: 'rgba(232,225,211,0.5)',
            }}
          >
            Доверься Пути. Брось кубик.
          </p>
        </div>

        {/* Primary CTA - 73-80% */}
        <button
          onClick={handleRoll}
          disabled={!canRoll || isRolling}
          className="w-full max-w-[350px] font-body font-bold uppercase tracking-[0.05em]"
          style={{
            height: '56px',
            borderRadius: '10px',
            border: '1px solid #D3AE6F',
            background: 'linear-gradient(180deg, #B58A4A 0%, #806033 100%)',
            color: '#111310',
            fontSize: '15px',
            boxShadow: '0 8px 22px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.12)',
            opacity: (!canRoll || isRolling) ? 0.5 : 1,
            cursor: (!canRoll || isRolling) ? 'not-allowed' : 'pointer',
          }}
        >
          {isRolling ? 'Бросок...' : 'Бросить кубик'}
        </button>

        {/* Back link - 82-87% */}
        <button
          onClick={onBack}
          className="mt-4 font-body font-medium flex items-center gap-2"
          style={{
            fontSize: '14px',
            color: '#918F86',
            minHeight: '44px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <path d="m12 19-7-7 7-7"/>
          </svg>
          Вернуться к карте
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-4"
        style={{
          height: 'calc(72px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'rgba(17,19,16,0.96)',
          borderTop: '1px solid rgba(181,138,74,0.20)',
        }}
      >
        {[
          { label: 'Путь', active: true },
          { label: 'Клетки', active: false },
          { label: 'Размышления', active: false },
          { label: 'Профиль', active: false },
        ].map((item) => (
          <button
            key={item.label}
            className="flex flex-col items-center justify-center gap-1"
            style={{
              color: item.active ? '#D3AE6F' : '#918F86',
              fontSize: '11px',
              fontFamily: 'Manrope, system-ui, sans-serif',
              minHeight: '44px',
            }}
          >
            <div 
              className="w-6 h-6 rounded-full"
              style={{
                background: item.active ? '#D3AE6F' : 'transparent',
                border: item.active ? 'none' : '1px solid #918F86',
              }}
            />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
