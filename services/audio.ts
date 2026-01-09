
class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private noteToFreq(note: string): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = parseInt(note.slice(-1));
    const key = notes.indexOf(note.slice(0, -1));
    return 440 * Math.pow(2, (key - 9 + (octave - 4) * 12) / 12);
  }

  public playChord(notes: string[]) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    gainNode.connect(this.ctx.destination);

    notes.forEach(note => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle'; // Softer, more harmonic-rich sound
      osc.frequency.setValueAtTime(this.noteToFreq(note), now);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 1.5);
    });
  }
}

export const audioService = new AudioService();
