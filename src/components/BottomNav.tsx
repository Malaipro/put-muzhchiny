interface BottomNavProps {
  active: string;
  onNavigate: (screen: string) => void;
}

const items = [
  { id: 'map', label: 'Карта', icon: '/icons/nav_map.svg' },
  { id: 'diary', label: 'Дневник', icon: '/icons/nav_journal.svg' },
  { id: 'path', label: 'Путь', icon: '/icons/nav_path.svg' },
  { id: 'stats', label: 'Статистика', icon: '/icons/nav_stats.svg' },
  { id: 'passport', label: 'Профиль', icon: '/icons/nav_profile.svg' },
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
            <img
              src={item.icon}
              alt={item.label}
              width={20}
              height={20}
              className={`mb-0.5 ${active === item.id ? 'opacity-100' : 'opacity-60'}`}
            />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
