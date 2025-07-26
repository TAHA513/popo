class SimpleAudioManager {
  private audioContext: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private createBeep(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || this.muted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  play(soundName: string) {
    if (this.muted) return;

    switch (soundName) {
      case 'shoot':
        this.createBeep(800, 0.1, 'square', 0.2);
        break;
      case 'explosion':
        this.createBeep(200, 0.3, 'sawtooth', 0.4);
        setTimeout(() => this.createBeep(150, 0.2, 'sawtooth', 0.3), 100);
        break;
      case 'hit':
        this.createBeep(300, 0.15, 'triangle', 0.3);
        break;
      case 'victory':
        this.createBeep(440, 0.2, 'sine', 0.4);
        setTimeout(() => this.createBeep(554, 0.2, 'sine', 0.4), 150);
        setTimeout(() => this.createBeep(659, 0.3, 'sine', 0.5), 300);
        break;
      case 'defeat':
        this.createBeep(220, 0.5, 'sine', 0.4);
        setTimeout(() => this.createBeep(185, 0.5, 'sine', 0.3), 200);
        break;
      case 'background':
        // Simple background ambient sound
        if (!this.muted) {
          this.createBeep(110, 2, 'sine', 0.05);
          setTimeout(() => this.play('background'), 3000);
        }
        break;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  stopAll() {
    // Web Audio API oscillators stop automatically
  }
}

export default SimpleAudioManager;