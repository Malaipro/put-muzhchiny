import { useState } from 'react';

interface OnboardingProps {
  onStart: (query: string) => void;
}

export function Onboarding({ onStart }: OnboardingProps) {
  const [query, setQuery] = useState('');
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'ПУТЬ МУЖЧИНЫ',
      subtitle: '72 состояния. Трансформационная игра КЭМП.',
      text: 'Кубик определяет маршрут. Смысл создаёт то, как мужчина проживает выпавшую клетку. Осознание без действия не засчитывается.',
    },
    {
      title: 'Запрос',
      subtitle: 'С каким вопросом ты входишь в Путь?',
      text: 'Один вопрос или жизненная тема. Запрос сохраняется неизменным в течение прохождения.',
    },
  ];

  if (step === 0) {
    return (
      <div 
        className="min-h-dvh flex flex-col items-center justify-center px-safe py-section bg-cover bg-center"
        style={{ backgroundImage: 'url(/textures/onboarding_background_390x844.png)' }}
      >
        <div className="text-center max-w-sm">
          <h1 className="font-heading text-display text-bronze mb-4">
            {steps[0].title}
          </h1>
          <p className="text-h2 text-bone mb-6">{steps[0].subtitle}</p>
          <p className="text-body text-muted mb-10 leading-relaxed">
            {steps[0].text}
          </p>
          <button
            onClick={() => setStep(1)}
            className="w-full min-h-cta bg-bronze text-ink font-heading text-h2 rounded-card hover:opacity-90 transition-opacity"
          >
            Начать Путь
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-safe py-section">
      <h2 className="font-heading text-h1 text-bronze mb-2">{steps[1].title}</h2>
      <p className="text-body text-muted mb-6">{steps[1].subtitle}</p>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Например: Почему я не довожу начатое до конца?"
        className="w-full flex-1 min-h-[120px] bg-graphite text-bone rounded-card p-4 text-body resize-none border border-copper/30 focus:border-bronze focus:outline-none mb-6"
      />

      <p className="text-caption text-muted mb-6">{steps[1].text}</p>

      <button
        onClick={() => query.trim() && onStart(query.trim())}
        disabled={!query.trim()}
        className="w-full min-h-cta bg-bronze text-ink font-heading text-h2 rounded-card hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Войти в Путь
      </button>
    </div>
  );
}
