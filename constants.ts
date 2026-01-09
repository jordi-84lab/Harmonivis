
import { ChordNode, Connection, ChordFunction } from './types';

export const MAJOR_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const FUNCTION_COLORS: Record<ChordFunction, string> = {
  'tonic': 'bg-blue-600',
  'subdominant': 'bg-purple-600',
  'dominant': 'bg-amber-600',
  'secondary': 'bg-emerald-600',
  'modal-interchange': 'bg-pink-600',
  'ai-suggest': 'bg-yellow-500'
};

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

const ROMAN_MAP: Record<string, number> = {
  'I': 0, 'bII': 1, 'II': 2, 'bIII': 3, 'III': 4, 'IV': 5, '#IV': 6, 'bV': 6, 'V': 7, 'bVI': 8, 'VI': 9, 'bVII': 10, 'VII': 11,
  'i': 0, 'bii': 1, 'ii': 2, 'biii': 3, 'iii': 4, 'iv': 5, '#iv': 6, 'bv': 6, 'v': 7, 'bvi': 8, 'vi': 9, 'bvii': 10, 'vii': 11
};

function getNoteName(index: number, useFlats: boolean): string {
  const note = NOTES[(index + 12) % 12];
  const sharpsToFlats: Record<string, string> = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
  if (useFlats && sharpsToFlats[note]) return sharpsToFlats[note];
  return note;
}

export const chordFromRoman = (keyRoot: string, romanStr: string): ChordNode => {
  // Limpiar sufijos comunes de calidad (7, maj7, m7, sus4, dim) para encontrar el grado base
  const baseRoman = romanStr.match(/^(b|#)?(I|V|X|L|C|D|M|i|v|x|l|c|d|m)+/)?.[0] || 'I';
  const semitones = ROMAN_MAP[baseRoman] || 0;
  
  let rootIdx = NOTES.indexOf(keyRoot);
  if (rootIdx === -1 && FLAT_TO_SHARP[keyRoot]) rootIdx = NOTES.indexOf(FLAT_TO_SHARP[keyRoot]);
  
  const chordRootIdx = (rootIdx + semitones) % 12;
  const useFlats = keyRoot.includes('b') || keyRoot === 'F';
  const chordName = getNoteName(chordRootIdx, useFlats);
  
  // Determinar calidad por mayúsculas/minúsculas y sufijos
  const isMinor = (baseRoman === baseRoman.toLowerCase()) || romanStr.includes('m') && !romanStr.includes('maj');
  const isDim = romanStr.includes('dim') || romanStr.includes('°');
  const isSus = romanStr.includes('sus');
  const isDom = romanStr.includes('7') && !isMinor && !isDim && !romanStr.includes('maj');

  let label = chordName + (isMinor ? 'm' : '') + (isDim ? 'dim' : '') + (isSus ? 'sus' : '') + (isDom ? '7' : '');
  if (romanStr.includes('maj7')) label = chordName + 'maj7';

  const notes = generateTriad(chordRootIdx, isMinor ? 'm' : (isDim ? 'dim' : (isDom ? '7' : '')));

  return {
    id: label,
    label: label,
    roman: romanStr,
    degree: 0,
    function: 'ai-suggest',
    notes: notes,
    color: '#facc15',
    isDiatonic: false,
    tension: isDom || isDim ? 4 : 2,
    isAI: true
  };
};

function generateTriad(rootIdx: number, quality: string): string[] {
  const isMinor = quality.includes('m');
  const isDim = quality === 'dim';
  const isSeventh = quality.includes('7');
  
  return [
    `${getNoteName(rootIdx, false)}4`,
    `${getNoteName(rootIdx + (isMinor || isDim ? 3 : 4), false)}4`,
    `${getNoteName(rootIdx + (isDim ? 6 : 7), false)}4`,
    ...(isSeventh ? [`${getNoteName(rootIdx + 10, false)}4`] : [])
  ];
}

export const generateChordsForKey = (root: string): ChordNode[] => {
  const SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
  const CHORD_QUALITIES = ['', 'm', 'm', '', '', 'm', 'dim'];
  const ROMAN_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  const TENSIONS = [0, 2, 1, 2, 4, 1, 5];

  let rootIdx = NOTES.indexOf(root);
  if (rootIdx === -1 && FLAT_TO_SHARP[root]) rootIdx = NOTES.indexOf(FLAT_TO_SHARP[root]);

  return SCALE_INTERVALS.map((interval, i) => {
    const noteIdx = (rootIdx + interval) % 12;
    const name = getNoteName(noteIdx, root.includes('b') || root === 'F');
    return {
      id: `${name}${CHORD_QUALITIES[i]}`,
      label: `${name}${CHORD_QUALITIES[i]}`,
      roman: ROMAN_NUMERALS[i],
      degree: i + 1,
      function: i === 0 || i === 2 || i === 5 ? 'tonic' : (i === 1 || i === 3 ? 'subdominant' : 'dominant'),
      notes: generateTriad(noteIdx, CHORD_QUALITIES[i]),
      color: i === 0 ? '#3b82f6' : (i === 4 || i === 6 ? '#f59e0b' : '#8b5cf6'),
      isDiatonic: true,
      tension: TENSIONS[i]
    };
  });
};

export const generateLinksForChords = (chords: ChordNode[], showSubs: boolean): Connection[] => {
  const links: Connection[] = [];
  const findId = (roman: string) => chords.find(c => c.roman === roman)?.id;

  const definitions: Array<{from: string, to: string, strength: number, type: Connection['type']}> = [
    { from: 'V', to: 'I', strength: 5, type: 'resolution' },
    { from: 'vii°', to: 'I', strength: 5, type: 'resolution' },
    { from: 'IV', to: 'V', strength: 4, type: 'preparation' },
    { from: 'ii', to: 'V', strength: 5, type: 'preparation' },
    { from: 'I', to: 'IV', strength: 3, type: 'preparation' },
    { from: 'vi', to: 'ii', strength: 4, type: 'preparation' }
  ];

  definitions.forEach(d => {
    const s = findId(d.from);
    const t = findId(d.to);
    if (s && t) links.push({ source: s, target: t, strength: d.strength, type: d.type, description: `${d.from} → ${d.to}` });
  });

  return links;
};

export const parseChordString = (chordStr: string): ChordNode => {
  // Fallback para acordes que no son romanos (parsing por nombre absoluto)
  const rootMatch = chordStr.match(/^([A-G][#b]?)/);
  const rootName = rootMatch ? rootMatch[1] : 'C';
  let rootIdx = NOTES.indexOf(rootName);
  if (rootIdx === -1 && FLAT_TO_SHARP[rootName]) rootIdx = NOTES.indexOf(FLAT_TO_SHARP[rootName]);
  
  const isMinor = chordStr.includes('m') && !chordStr.includes('maj');
  const isDim = chordStr.includes('dim') || chordStr.includes('°');
  const isDom7 = chordStr.includes('7') && !isMinor && !isDim;

  return {
    id: chordStr,
    label: chordStr,
    roman: '?', 
    degree: 0,
    function: 'ai-suggest',
    notes: generateTriad(rootIdx, isMinor ? 'm' : (isDim ? 'dim' : (isDom7 ? '7' : ''))),
    color: '#facc15',
    isDiatonic: false,
    tension: 3,
    isAI: true
  };
};
