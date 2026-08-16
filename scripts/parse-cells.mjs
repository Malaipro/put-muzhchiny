import fs from 'fs';

const TRANSITIONS = {
  support: { 10: 23, 17: 69, 20: 32, 22: 60, 27: 41, 28: 50, 37: 66, 45: 67, 46: 62, 54: 68 },
  breakdown: { 12: 8, 16: 4, 24: 7, 29: 6, 44: 9, 52: 35, 55: 3, 61: 13, 63: 2, 72: 51 },
};

function getTransition(cellId) {
  for (const [ttype, mapping] of Object.entries(TRANSITIONS)) {
    if (mapping[cellId]) return { type: ttype, target: mapping[cellId] };
  }
  return { type: 'none', target: null };
}

function extractSection(text, startMarker, endMarkers) {
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ends = endMarkers.map(esc).join('|');
  const pattern = new RegExp(`${esc(startMarker)}\\s*\\n([\\s\\S]*?)(?=\\n###\\s*(?:${ends})|\\Z)`);
  const m = text.match(pattern);
  return m ? m[1].trim() : '';
}

function parseCell(block) {
  const lines = block.trim().split('\n');
  const header = lines[0];
  const m = header.match(/##\s*(\d+)\.\s*(.+)/);
  if (!m) return null;

  const cellId = parseInt(m[1]);
  let rest = m[2].trim();

  let kempName, subtitle = '';
  if (rest.includes('###')) {
    const parts = rest.split('###');
    kempName = parts[0].trim();
    subtitle = parts[1] ? parts[1].trim() : '';
  } else {
    kempName = rest;
  }

  const body = lines.slice(1).join('\n');

  const persona = extractSection(body, '### ПЕРСОНА', ['ТЕНЬ', 'ОПОРА', 'Связь', 'Вопросы', 'Испытание', 'Механика', 'Короткая', 'Формула']);
  const shadow = extractSection(body, '### ТЕНЬ', ['ОПОРА', 'Связь', 'Вопросы', 'Испытание', 'Механика', 'Короткая', 'Формула']);
  const supportText = extractSection(body, '### ОПОРА', ['Связь', 'Вопросы', 'Испытание', 'Механика', 'Короткая', 'Формула']);

  const qMatch = body.match(/### Вопросы к себе\s*\n([\s\S]*?)(?=### Испытание|\Z)/);
  const questions = [];
  if (qMatch) {
    qMatch[1].trim().split('\n').forEach(line => {
      line = line.trim();
      if (/^\d+\./.test(line)) {
        questions.push(line.replace(/^\d+\.\s*/, ''));
      }
    });
  }

  let challenge = extractSection(body, '### Испытание на 24 часа', ['Механика', 'Короткая', 'Формула']);
  challenge = challenge.split(/После выполнения зафиксируй/)[0].trim();

  const shortMatch = body.match(/### Короткая версия для приложения\s*\n([\s\S]*?)(?=### Формула|\Z)/);
  const shortText = shortMatch ? shortMatch[1].trim() : '';

  const formulaMatch = body.match(/### Формула клетки\s*\n>\s*(.+?)(?=\n---|\Z)/s);
  const formula = formulaMatch ? formulaMatch[1].trim() : '';

  const fullMatch = body.match(/### Путь мужчины\s*\n([\s\S]*?)(?=### ПЕРСОНА|\Z)/);
  const fullText = fullMatch ? fullMatch[1].trim() : '';

  const qcMatch = body.match(/### Связь с исходным запросом\s*\n([\s\S]*?)(?=### Вопросы|\Z)/);
  const queryConnection = qcMatch ? qcMatch[1].trim() : '';

  const originalMatch = body.match(/### Оригинал Лилы\s*\n([\s\S]*?)(?=### Путь мужчины|\Z)/);
  let classicName = '';
  if (originalMatch) {
    const cm = originalMatch[1].trim().match(/^(.+?)\s*[—–-]\s*(.+)/);
    if (cm) classicName = cm[1].trim();
  }

  const { type: transitionType, target: transitionTarget } = getTransition(cellId);

  return {
    id: cellId,
    classicName,
    kempName,
    subtitle,
    shortText,
    fullText,
    persona,
    shadow,
    support: supportText,
    queryConnection,
    questions,
    challenge,
    formula,
    transitionType,
    transitionTarget,
  };
}

const inputPath = '/Users/mac/Desktop/Put_Muzhchiny_72_kletki_FINAL.md';
const outputPath = '/Users/mac/Documents/kimi/workspace/put-muzhchiny/src/lib/cells.ts';

const text = fs.readFileSync(inputPath, 'utf-8');

const blocks = text.match(/##\s*\d+\.\s*[\s\S]*?(?=##\s*\d+\.|\Z)/g) || [];

const cells = [];
for (const block of blocks) {
  const cell = parseCell(block);
  if (cell) cells.push(cell);
}

cells.sort((a, b) => a.id - b.id);

console.log(`Parsed ${cells.length} cells`);
cells.forEach(c => console.log(`  ${String(c.id).padStart(2)}. ${c.kempName} (${c.subtitle}) -> ${c.transitionType} ${c.transitionTarget}`));

const jsonStr = JSON.stringify(cells, null, 2);
const tsContent = `import type { Cell } from '../types';

export const CELLS: Cell[] = ${jsonStr};

export function getCellById(id: number): Cell | undefined {
  return CELLS.find(c => c.id === id);
}

export function getCellByName(name: string): Cell | undefined {
  return CELLS.find(c => c.kempName === name);
}

export const TOTAL_CELLS = 72;
export const FINISH_CELL = 68;

export const SUPPORTS: Record<number, number> = {
${Object.entries(TRANSITIONS.support).map(([k, v]) => `  ${k}: ${v},`).join('\n')}
};

export const BREAKDOWNS: Record<number, number> = {
${Object.entries(TRANSITIONS.breakdown).map(([k, v]) => `  ${k}: ${v},`).join('\n')}
};
`;

fs.writeFileSync(outputPath, tsContent, 'utf-8');
console.log(`\nGenerated ${outputPath}`);
