interface BottomNavProps {
  active: string;
  onNavigate: (screen: string) => void;
}

const items = [
  { id: 'map', label: 'Карта' },
  { id: 'diary', label: 'Дневник' },
  { id: 'path', label: 'Путь' },
  { id: 'stats', label: 'Статистика' },
  { id: 'passport', label: 'Профиль' },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-graphite/95 backdrop-blur border-t border-copper/20 z-50">
      <div className="max-w-[430px] mx-auto flex justify-around items-center h-14">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full text-caption transition-colors ${
              active === item.id ? 'text-bronze' : 'text-muted hover:text-bone'
            }`}
          >
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
