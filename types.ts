
export type ChordFunction = 'tonic' | 'subdominant' | 'dominant' | 'secondary' | 'modal-interchange' | 'ai-suggest';

export type ConnectionType = 'resolution' | 'preparation' | 'modulation' | 'chromatic' | 'tritone_sub' | 'backdoor' | 'ai-path';

export interface ChordNode {
  id: string;
  label: string;
  roman: string;
  degree: number; 
  function: ChordFunction;
  notes: string[];
  color: string;
  isDiatonic: boolean;
  tension: number; 
  isAI?: boolean;
  aiStep?: number; // Posición en la progresión (1, 2, 3...)
  substitutionInfo?: {
    type: 'tritone' | 'backdoor';
    originalChord?: string;
    explanation: string;
  };
}

export interface Connection {
  source: string;
  target: string;
  description: string;
  strength: number; 
  type: ConnectionType;
  isAI?: boolean;
}

export interface HarmonyExplanation {
  analysis: string;
  commonUsage: string;
  suggestedNext: {
    chord: string;
    reason: string;
  }[];
}

export interface ProgressionSuggestion {
  text: string;
  chords: string[]; // Se usará para almacenar los grados relativos (ej. ["I", "vi", "ii", "V"])
  suggestedKey?: string;
}
