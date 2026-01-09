
import React, { useState, useEffect } from 'react';
import { ChordNode, HarmonyExplanation } from '../types';
import { getHarmonyExplanation } from '../services/gemini';
import { FUNCTION_COLORS } from '../constants';

interface SidebarProps {
  selectedChord: ChordNode | null;
  currentKey: string;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedChord, currentKey }) => {
  const [explanation, setExplanation] = useState<HarmonyExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedChord) {
      setLoading(true);
      getHarmonyExplanation(selectedChord.label, currentKey).then(data => {
        setExplanation(data);
        setLoading(false);
      });
    } else {
      setExplanation(null);
    }
  }, [selectedChord, currentKey]);

  if (!selectedChord) {
    return (
      <div className="w-96 bg-slate-800 border-l border-slate-700 p-6 flex flex-col items-center justify-center text-center">
        <div className="text-slate-500 mb-4">
          <i className="fas fa-music text-5xl opacity-20"></i>
        </div>
        <h2 className="text-xl font-bold text-slate-400">Selecciona un Acorde</h2>
        <p className="text-slate-500 text-sm mt-2">
          Haz clic en cualquier nodo del mapa para explorar su función armónica y progresiones comunes.
        </p>
      </div>
    );
  }

  return (
    <div className="w-96 bg-slate-800 border-l border-slate-700 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${FUNCTION_COLORS[selectedChord.function]}`}>
              {selectedChord.function === 'tonic' ? 'TÓNICA' : 
               selectedChord.function === 'subdominant' ? 'SUBDOMINANTE' : 
               selectedChord.function === 'dominant' ? 'DOMINANTE' : 
               selectedChord.function.toUpperCase()}
            </span>
            <h1 className="text-4xl font-black mt-2">{selectedChord.label}</h1>
            <p className="text-slate-400 font-mono text-lg">Acorde de {selectedChord.roman} en {currentKey}</p>
          </div>
          <div className="text-slate-300">
             <i className="fas fa-wave-square text-2xl opacity-50"></i>
          </div>
        </div>

        <section className="mb-8">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Notas Constituyentes</h3>
          <div className="flex gap-2">
            {selectedChord.notes.map(note => (
              <div key={note} className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-blue-400 border border-slate-600">
                {note.replace(/\d/, '')}
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-20 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            <div className="h-20 bg-slate-700 rounded"></div>
          </div>
        ) : explanation ? (
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-brain text-amber-500 text-sm"></i>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Análisis Teórico</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {explanation.analysis}
              </p>
            </section>

            <section>
               <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-guitar text-blue-500 text-sm"></i>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Uso Común</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {explanation.commonUsage}
              </p>
            </section>

            <section>
               <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-arrow-right-long text-emerald-500 text-sm"></i>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">¿Hacia dónde ir ahora?</h3>
              </div>
              <div className="space-y-3">
                {explanation.suggestedNext.map((suggestion, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-colors">
                    <div className="font-bold text-emerald-400 mb-1">{suggestion.chord}</div>
                    <div className="text-xs text-slate-400">{suggestion.reason}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">Error al cargar información de la IA. Intenta de nuevo.</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
