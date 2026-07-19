export class RingtonePlayer {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private interval: NodeJS.Timeout | null = null;
  private isPlaying = false;

  startRinging(incoming: boolean = false) {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = () => {
        if (!this.audioCtx) return;
        this.oscillator = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();

        this.oscillator.type = 'sine';
        
        // Incoming ringtone is slightly higher pitch
        this.oscillator.frequency.setValueAtTime(incoming ? 600 : 440, this.audioCtx.currentTime);
        this.oscillator.frequency.setValueAtTime(incoming ? 800 : 480, this.audioCtx.currentTime + 0.1);

        this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.05);
        this.gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime + 1.0);
        this.gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.2);

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);

        this.oscillator.start(this.audioCtx.currentTime);
        this.oscillator.stop(this.audioCtx.currentTime + 1.2);
      };

      playBeep();
      this.interval = setInterval(playBeep, 2500);

    } catch (e) {
      console.warn("AudioContext not supported or blocked", e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.interval) clearInterval(this.interval);
    if (this.oscillator) {
      try { this.oscillator.stop(); } catch (e) {}
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (e) {}
      this.audioCtx = null;
    }
  }
}

export const ringtonePlayer = new RingtonePlayer();
