import { useState } from 'react';
import type { Cell } from '../types';
import type { VisitRecord } from '../lib/game';

interface CellViewProps {
  cell: Cell;
  visit: VisitRecord;
  isUnlocked: boolean;
  onComplete: () => void;
  onBack: () => void;
}

const tabs = [
  { id: 'short', label: 'Кратко' },
  { id: 'full', label: 'Путь' },
  { id: 'persona', label: 'Персона' },
  { id: 'shadow', label: 'Тень' },
  { id: 'support', label: 'Опора' },
  { id: 'questions', label: 'Вопросы' },
  { id: 'challenge', label: 'Задание' },
];

export function CellView({ cell, visit, isUnlocked, onComplete, onBack }: CellViewProps) {
  const [activeTab, setActiveTab] = useState('short');
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [challengeDone, setChallengeDone] = useState(false);

  const handleReflectionChange = (q: string, value: string) => {
    setReflections(prev => ({ ...prev, [q]: value }));
  };

  const canComplete = isUnlocked && challengeDone;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'short':
        return (
          <div className="space-y-4">
            <div className="prose prose-invert prose-sm max-w-none text-body leading-relaxed"
              dangerouslySetInnerHTML={{ __html: cell.shortText.replace(/\*\*/g, '<strong>').replace(/\n/g, '<br/>') }}
            />
            {cell.formula && (
              <blockquote className="border-l-2 border-bronze pl-4 text-bronze italic">
                {cell.formula.replace(/\*\*/g, '')}
              </blockquote>
            )}
          </div>
        );
      case 'full':
        return (
          <div className="text-body leading-relaxed space-y-4">
            <p>{cell.fullText}</p>
            {cell.queryConnection && (
              <div className="bg-graphite rounded p-3 border border-copper/20">
                <p className="text-caption text-muted mb-1">Связь с запросом</p>
                <p className="text-body text-bone/90">{cell.queryConnection}</p>
              </div>
            )}
          </div>
        );
      case 'persona':
        return (
          <div className="space-y-3">
            <h4 className="font-heading text-h2 text-bronze">ПЕРСОНА</h4>
            <p className="text-body leading-relaxed">{cell.persona}</p>
          </div>
        );
      case 'shadow':
        return (
          <div className="space-y-3">
            <h4 className="font-heading text-h2 text-red">ТЕНЬ</h4>
            <p className="text-body leading-relaxed">{cell.shadow}</p>
          </div>
        );
      case 'support':
        return (
          <div className="space-y-3">
            <h4 className="font-heading text-h2 text-olive">ОПОРА</h4>
            <p className="text-body leading-relaxed">{cell.support}</p>
          </div>
        );
      case 'questions':
        return (
          <div className="space-y-4">
            <h4 className="font-heading text-h2 text-bone">Вопросы к себе</h4>
            {cell.questions.map((q, i) => (
              <div key={i} className="space-y-2">
                <p className="text-body text-bone">{i + 1}. {q}</p>
                <textarea
                  value={reflections[q] || ''}
                  onChange={(e) => handleReflectionChange(q, e.target.value)}
                  placeholder="Твой ответ..."
                  className="w-full bg-graphite text-bone rounded p-3 text-body min-h-[80px] border border-copper/20 focus:border-bronze focus:outline-none resize-none"
                />
              </div>
            ))}
          </div>
        );
      case 'challenge':
        return (
          <div className="space-y-4">
            <h4 className="font-heading text-h2 text-bone">Испытание на 24 часа</h4>
            <div className="bg-graphite rounded-card p-4 border border-bronze/30">
              <p className="text-body leading-relaxed mb-4">{cell.challenge}</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={challengeDone}
                  onChange={(e) => setChallengeDone(e.target.checked)}
                  className="w-5 h-5 accent-bronze"
                />
                <span className="text-body">Я принял задание / выполнил действие</span>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-caption text-muted hover:text-bone transition-colors">
          ← Назад
        </button>
        <span className="text-caption text-muted">
          {visit.visitMode === 'introduction' ? 'Знакомство' :
           visit.visitMode === 'return' ? 'Возврат' : 'Узел'}
        </span>
      </div>

      {/* Cell Title */}
      <div className="mb-4">
        <span className="text-caption text-muted">Клетка {cell.id}</span>
        <h2 className="font-heading text-h1 text-bone">{cell.kempName}</h2>
        <p className="text-caption text-muted">{cell.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-caption whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-bronze text-ink'
                : 'bg-graphite text-muted hover:text-bone'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-graphite/30 rounded-card p-4 border border-copper/10 min-h-[300px]">
        {renderTabContent()}
      </div>

      {/* Complete Button */}
      <div className="mt-6">
        {canComplete ? (
          <button
            onClick={onComplete}
            className="w-full min-h-cta bg-bronze text-ink font-heading text-h2 rounded-card hover:opacity-90 transition-opacity"
          >
            Завершить клетку
          </button>
        ) : (
          <div className="text-center">
            <p className="text-caption text-muted">
              {!isUnlocked
                ? 'Минимум 24 часа на клетке. Вернуться позже.'
                : 'Отметь выполнение задания, чтобы завершить клетку.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
