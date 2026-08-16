#!/usr/bin/env python3
"""Parse Put_Muzhchiny_72_kletki_FINAL.md and generate src/lib/cells.ts"""

import re
import json
from pathlib import Path

TRANSITIONS = {
    'support': {10: 23, 17: 69, 20: 32, 22: 60, 27: 41, 28: 50, 37: 66, 45: 67, 46: 62, 54: 68},
    'breakdown': {12: 8, 16: 4, 24: 7, 29: 6, 44: 9, 52: 35, 55: 3, 61: 13, 63: 2, 72: 51},
}

def get_transition(cell_id: int):
    for ttype, mapping in TRANSITIONS.items():
        if cell_id in mapping:
            return ttype, mapping[cell_id]
    return 'none', None

def parse_cell(text: str) -> dict:
    lines = text.strip().split('\n')
    
    # Parse header: ## N. NAME or ## N. NAME ### Subtitle
    header = lines[0]
    m = re.match(r'##\s*(\d+)\.\s*(.+)', header)
    if not m:
        return None
    
    cell_id = int(m.group(1))
    rest = m.group(2).strip()
    
    # Check for subtitle in header
    subtitle = ''
    if '###' in rest:
        parts = rest.split('###')
        kemp_name = parts[0].strip()
        subtitle = parts[1].strip() if len(parts) > 1 else ''
    else:
        kemp_name = rest
    
    # Join remaining text for easier parsing
    body = '\n'.join(lines[1:])
    
    def extract_section(start_marker, end_markers):
        pattern = rf'{re.escape(start_marker)}\s*\n(.*?)(?=\n###\s*(?:{"|".join(re.escape(m) for m in end_markers)})|\Z)'
        m2 = re.search(pattern, body, re.DOTALL)
        if m2:
            return m2.group(1).strip()
        return ''
    
    # Extract fields
    persona = extract_section('### ПЕРСОНА', ['ТЕНЬ', 'ОПОРА', 'Связь', 'Вопросы', 'Испытание', 'Механика', 'Короткая', 'Формула'])
    shadow = extract_section('### ТЕНЬ', ['ОПОРА', 'Связь', 'Вопросы', 'Испытание', 'Механика', 'Короткая', 'Формула'])
    support_text = extract_section('### ОПОРА', ['Связь', 'Вопросы', 'Испытание', 'Механика', 'Короткая', 'Формула'])
    
    questions_match = re.search(r'### Вопросы к себе\s*\n(.*?)(?=### Испытание|\Z)', body, re.DOTALL)
    questions = []
    if questions_match:
        q_text = questions_match.group(1).strip()
        for line in q_text.split('\n'):
            line = line.strip()
            if re.match(r'^\d+\.', line):
                questions.append(re.sub(r'^\d+\.\s*', '', line))
    
    challenge = extract_section('### Испытание на 24 часа', ['Механика', 'Короткая', 'Формула'])
    # Clean up challenge text - remove the "После выполнения зафиксируй..." part
    challenge = re.split(r'После выполнения зафиксируй', challenge)[0].strip()
    
    short_match = re.search(r'### Короткая версия для приложения\s*\n(.*?)(?=### Формула|\Z)', body, re.DOTALL)
    short_text = ''
    if short_match:
        short_text = short_match.group(1).strip()
    
    formula_match = re.search(r'### Формула клетки\s*\n>\s*(.+?)(?=\n---|\Z)', body, re.DOTALL)
    formula = ''
    if formula_match:
        formula = formula_match.group(1).strip()
    
    # Parse short text into components
    short_lines = [l.strip() for l in short_text.split('\n') if l.strip()]
    
    # Get transition info
    ttype, ttarget = get_transition(cell_id)
    
    # Extract full text (Путь мужчины section)
    full_match = re.search(r'### Путь мужчины\s*\n(.*?)(?=### ПЕРСОНА|\Z)', body, re.DOTALL)
    full_text = full_match.group(1).strip() if full_match else ''
    
    # Extract query connection
    qc_match = re.search(r'### Связь с исходным запросом\s*\n(.*?)(?=### Вопросы|\Z)', body, re.DOTALL)
    query_connection = qc_match.group(1).strip() if qc_match else ''
    
    # Extract original (classic) name
    original_match = re.search(r'### Оригинал Лилы\s*\n(.+?)(?=### Путь мужчины|\Z)', body, re.DOTALL)
    classic_name = ''
    if original_match:
        classic_text = original_match.group(1).strip()
        # Try to extract English name
        cm = re.search(r'^(.+?)\s*[—–-]\s*(.+)', classic_text)
        if cm:
            classic_name = cm.group(1).strip()
    
    return {
        'id': cell_id,
        'classicName': classic_name,
        'kempName': kemp_name,
        'subtitle': subtitle,
        'shortText': short_text,
        'fullText': full_text,
        'persona': persona,
        'shadow': shadow,
        'support': support_text,
        'queryConnection': query_connection,
        'questions': questions,
        'challenge': challenge,
        'formula': formula,
        'transitionType': ttype,
        'transitionTarget': ttarget,
    }

def main():
    input_path = Path('/Users/mac/Desktop/Put_Muzhchiny_72_kletki_FINAL.md')
    output_path = Path('/Users/mac/Documents/kimi/workspace/put-muzhchiny/src/lib/cells.ts')
    
    text = input_path.read_text(encoding='utf-8')
    
    # Split into cells by headers like ## N. NAME
    # Use regex to find all cell sections
    pattern = r'##\s*\d+\.\s*.+?(?=##\s*\d+\.|\Z)'
    cell_blocks = re.findall(pattern, text, re.DOTALL)
    
    cells = []
    for block in cell_blocks:
        cell = parse_cell(block)
        if cell:
            cells.append(cell)
    
    cells.sort(key=lambda x: x['id'])
    
    print(f"Parsed {len(cells)} cells")
    for c in cells:
        print(f"  {c['id']:2d}. {c['kempName']} ({c['subtitle']}) -> {c['transitionType']} {c['transitionTarget']}")
    
    # Generate TypeScript
    ts_lines = [
        "import type { Cell } from '../types';",
        "",
        "export const CELLS: Cell[] = [",
    ]
    
    for cell in cells:
        ts_lines.append("  {")
        for key, value in cell.items():
            if isinstance(value, list):
                items = ', '.join(json.dumps(v, ensure_ascii=False) for v in value)
                ts_lines.append(f"    {key}: [{items}],")
            elif isinstance(value, str):
                ts_lines.append(f"    {key}: {json.dumps(value, ensure_ascii=False)},")
            elif value is None:
                ts_lines.append(f"    {key}: null,")
            else:
                ts_lines.append(f"    {key}: {json.dumps(value, ensure_ascii=False)},")
        ts_lines.append("  },")
    
    ts_lines.append("];")
    ts_lines.append("")
    ts_lines.append("export function getCellById(id: number): Cell | undefined {")
    ts_lines.append("  return CELLS.find(c => c.id === id);")
    ts_lines.append("}")
    ts_lines.append("")
    ts_lines.append("export function getCellByName(name: string): Cell | undefined {")
    ts_lines.append("  return CELLS.find(c => c.kempName === name);")
    ts_lines.append("}")
    ts_lines.append("")
    ts_lines.append("export const TOTAL_CELLS = 72;")
    ts_lines.append("export const FINISH_CELL = 68;")
    ts_lines.append("")
    ts_lines.append("export const SUPPORTS: Record<number, number> = {")
    for src, dst in TRANSITIONS['support'].items():
        ts_lines.append(f"  {src}: {dst},")
    ts_lines.append("};")
    ts_lines.append("")
    ts_lines.append("export const BREAKDOWNS: Record<number, number> = {")
    for src, dst in TRANSITIONS['breakdown'].items():
        ts_lines.append(f"  {src}: {dst},")
    ts_lines.append("};")
    
    output_path.write_text('\n'.join(ts_lines), encoding='utf-8')
    print(f"\nGenerated {output_path}")

if __name__ == '__main__':
    main()
