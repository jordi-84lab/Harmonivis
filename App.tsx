
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import HarmonyMap from './components/HarmonyMap';
import { MAJOR_KEYS, generateChordsForKey, generateLinksForChords, chordFromRoman } from './constants';
import { ChordNode, Connection, ProgressionSuggestion, HarmonyExplanation } from './types';
import { getProgressionSuggestion, getHarmonyExplanation } from './services/gemini';

const App: React.FC = () => {
  const [selectedChord, setSelectedChord] = useState<ChordNode | null>(null);
  const [keyRoot, setKeyRoot] = useState('C');
  const [showSubs, setShowSubs] = useState(false);
  const [activeTab, setActiveTab] = useState<'key' | 'subs' | 'chat' | null>('key');
  
  // IA related states
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<ProgressionSuggestion | null>(null);
  
  // Chord Analysis states
  const [explanation, setExplanation] = useState<HarmonyExplanation | null>(null);
  const [isExpLoading, setIsExpLoading] = useState(false);
  
  // Nodos y enlaces dinámicos generados por la IA
  const [aiNodes, setAiNodes] = useState<ChordNode[]>([]);
  const [aiLinks, setAiLinks] = useState<Connection[]>([]);

  const baseNodes = useMemo(() => generateChordsForKey(keyRoot), [keyRoot]);
  const baseLinks = useMemo(() => generateLinksForChords(baseNodes, showSubs), [baseNodes, showSubs]);

  // Sincronización automática de la progresión con la tonalidad actual
  useEffect(() => {
    if (!aiResponse) {
      setAiNodes([]);
      setAiLinks([]);
      return;
    }

    const newAiNodes: ChordNode[] = [];
    const newAiLinks: Connection[] = [];
    
    aiResponse.chords.forEach((romanStr, index) => {
      const rawNode = chordFromRoman(keyRoot, romanStr);
      const nodeToAdd: ChordNode = { ...rawNode, aiStep: index + 1 };
      
      const existingInBase = baseNodes.find(n => n.label === nodeToAdd.label);
      if (existingInBase) {
        const decoratedBase = { ...existingInBase, isAI: true, aiStep: index + 1, roman: romanStr };
        newAiNodes.push(decoratedBase);
      } else {
        newAiNodes.push(nodeToAdd);
      }

      if (index > 0) {
        newAiLinks.push({
          source: newAiNodes[index - 1].id,
          target: newAiNodes[index].id,
          description: 'Secuencia IA',
          strength: 4,
          type: 'ai-path',
          isAI: true
        });
      }
    });

    setAiNodes(newAiNodes);
    setAiLinks(newAiLinks);
  }, [aiResponse, keyRoot, baseNodes]);

  // Cargar explicación armónica cuando se selecciona un acorde
  useEffect(() => {
    if (selectedChord) {
      setIsExpLoading(true);
      setExplanation(null);
      getHarmonyExplanation(selectedChord.label, keyRoot).then(data => {
        setExplanation(data);
        setIsExpLoading(false);
      });
    } else {
      setExplanation(null);
    }
  }, [selectedChord, keyRoot]);

  // Merge de nodos base con nodos AI (evitando duplicados por label)
  const allNodes = useMemo(() => {
    const nodeMap = new Map<string, ChordNode>();
    baseNodes.forEach(n => nodeMap.set(n.id, { ...n }));
    aiNodes.forEach(aiNode => {
      const existing = nodeMap.get(aiNode.id);
      if (existing) {
        existing.isAI = true;
        existing.aiStep = aiNode.aiStep;
        existing.roman = aiNode.roman;
      } else {
        nodeMap.set(aiNode.id, aiNode);
      }
    });
    return Array.from(nodeMap.values());
  }, [baseNodes, aiNodes]);

  const allLinks = useMemo(() => [...baseLinks, ...aiLinks], [baseLinks, aiLinks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedChord(null);
        setActiveTab(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChordSelect = useCallback((chord: ChordNode | null) => {
    setSelectedChord(chord);
  }, []);

  const clearProgression = () => {
    setAiResponse(null);
    setAiNodes([]);
    setAiLinks([]);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    setIsChatLoading(true);
    const result = await getProgressionSuggestion(chatInput, keyRoot);
    
    if (result) {
      setAiResponse(result);
      if (result.suggestedKey && MAJOR_KEYS.includes(result.suggestedKey)) {
        setKeyRoot(result.suggestedKey);
      }
    }
    setIsChatLoading(false);
    setChatInput('');
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden relative font-sans flex flex-col">
      {/* HUD Superior */}
      <header className="absolute top-0 left-0 right-0 p-4 md:p-8 flex flex-col md:flex-row justify-between items-start gap-4 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 md:gap-3 bg-slate-950/40 md:bg-transparent p-2 rounded-2xl backdrop-blur-sm md:backdrop-blur-none">
            <div className="bg-gradient-to-br from-indigo-500 via-blue-500 to-emerald-400 p-2 md:p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <i className="fas fa-magic text-white text-base md:text-xl"></i>
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-black tracking-tight leading-none">HARMONIVIS</h1>
              <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Motor de Transposición IA</p>
            </div>
          </div>
        </div>
        
        <div className="pointer-events-auto w-full md:w-auto flex flex-col items-end gap-3">
          <div className="bg-slate-900/95 md:bg-slate-900/90 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden w-full md:min-w-[320px] transition-all duration-300 ease-in-out">
            <div className="flex border-b border-slate-800 bg-slate-900/40">
              <button 
                onClick={() => setActiveTab('key')}
                className={`flex-1 px-3 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 relative ${activeTab === 'key' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="fas fa-music"></i>
                <span>Tonalidad</span>
                {activeTab === 'key' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full mx-2 md:mx-4"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-3 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 relative ${activeTab === 'chat' ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="fas fa-brain"></i>
                <span>IA Chat</span>
                {aiNodes.length > 0 && <div className="absolute top-2.5 right-2 md:right-4 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_emerald]"></div>}
                {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full mx-2 md:mx-4"></div>}
              </button>
            </div>

            {activeTab && (
              <div className="p-4 md:p-5 relative animate-[fadeIn_0.2s_ease-out]">
                <button 
                  onClick={() => setActiveTab(null)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded-full transition-all z-10"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>

                {activeTab === 'key' && (
                  <div className="grid grid-cols-4 xs:grid-cols-6 md:grid-cols-4 gap-1.5 md:gap-2">
                    {MAJOR_KEYS.map(k => (
                      <button
                        key={k}
                        onClick={() => setKeyRoot(k)}
                        className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold transition-all border ${keyRoot === k 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105' 
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="flex flex-col gap-3">
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Pide una progresión (ej: i vi ii V)..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button 
                        type="submit"
                        disabled={isChatLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        {isChatLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles"></i>}
                      </button>
                    </form>
                    
                    {aiNodes.length > 0 && (
                      <button 
                        onClick={clearProgression}
                        className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 self-end flex items-center gap-1 transition-colors"
                      >
                        <i className="fas fa-trash"></i> Limpiar Progresión
                      </button>
                    )}

                    {aiResponse && (
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 max-h-48 overflow-y-auto">
                        <p className="text-[10px] text-slate-300 leading-relaxed italic">
                          {aiResponse.text}
                        </p>
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {aiResponse.chords.map((c, idx) => (
                            <span key={idx} className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Inspector de Acorde */}
      <div 
        className={`fixed inset-x-0 bottom-0 md:absolute md:inset-auto md:bottom-32 md:right-8 z-30 md:z-20 transition-all duration-500 transform ${selectedChord ? 'translate-y-0 opacity-100' : 'translate-y-full md:translate-y-10 opacity-0 pointer-events-none'}`}
      >
        {selectedChord && (
           <div 
             className="bg-slate-900/98 md:bg-slate-900/90 backdrop-blur-2xl p-6 pb-8 md:pb-6 rounded-t-[2.5rem] md:rounded-3xl border-t md:border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full md:w-80 pointer-events-auto max-h-[80vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-6 md:hidden"></div>
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Identidad del Acorde</div>
                  <div className="text-4xl md:text-5xl font-black text-white">{selectedChord.label}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => setSelectedChord(null)} className="md:hidden text-slate-500 p-2"><i className="fas fa-times"></i></button>
                  <div className="bg-slate-800 px-3 py-1 rounded-lg font-mono text-xs md:text-sm font-bold text-slate-400 border border-slate-700">
                    {selectedChord.isAI ? `PASO IA ${selectedChord.aiStep}` : selectedChord.roman}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Notas</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedChord.notes.map(n => (
                      <span key={n} className="bg-slate-800/50 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-slate-300 border border-slate-700">
                        {n.replace(/\d/, '')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-brain text-[10px] text-emerald-500"></i>
                    <div className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Análisis Armónico</div>
                  </div>
                  {isExpLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-2 bg-slate-800 rounded w-full"></div>
                      <div className="h-2 bg-slate-800 rounded w-5/6"></div>
                      <div className="h-2 bg-slate-800 rounded w-4/6"></div>
                    </div>
                  ) : explanation ? (
                    <div className="space-y-3">
                      <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed font-medium">
                        {explanation.analysis}
                      </p>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Uso común:</div>
                      <p className="text-[10px] md:text-[11px] text-slate-400 leading-tight">
                        {explanation.commonUsage}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600 italic">No hay información disponible para este acorde.</p>
                  )}
                </div>
              </div>
           </div>
        )}
      </div>

      <div className="flex-1 w-full overflow-hidden">
        <HarmonyMap 
          nodes={allNodes} 
          links={allLinks} 
          onChordSelect={handleChordSelect}
          selectedChordId={selectedChord?.id || null}
        />
      </div>

      <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20 pointer-events-none">
        <div className="flex flex-wrap gap-3 md:gap-6 bg-slate-900/60 backdrop-blur-md px-4 py-2.5 md:px-6 md:py-4 rounded-2xl md:rounded-3xl border border-slate-800/50 pointer-events-auto max-w-[calc(100vw-2rem)]">
          {[
            {color: '#3b82f6', label: 'Tónica'},
            {color: '#8b5cf6', label: 'Subdom'},
            {color: '#f59e0b', label: 'Dom'},
            {color: '#facc15', label: 'Sugerencia IA'}
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shadow-[0_0_10px]" style={{backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}`}}></div>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
