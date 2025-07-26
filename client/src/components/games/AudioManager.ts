import { Howl } from 'howler';

class AudioManager {
  private sounds: { [key: string]: Howl } = {};
  private muted: boolean = false;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    // Create audio using Web Audio API with simple tones
    this.createSound('shoot', this.createShootSound());
    this.createSound('explosion', this.createExplosionSound());
    this.createSound('hit', this.createHitSound());
    this.createSound('victory', this.createVictorySound());
    this.createSound('defeat', this.createDefeatSound());
    this.createSound('background', this.createBackgroundMusic());
  }

  private createSound(name: string, audioBuffer: string) {
    this.sounds[name] = new Howl({
      src: [audioBuffer],
      volume: 0.5,
      loop: name === 'background'
    });
  }

  private createShootSound(): string {
    // Return a simple base64 audio data URL for shoot sound
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBkOi0O+pdhgEKmbZ79SldTYbXrXy13Q9ATGNzJu8NowlFX0VWDuOTlxDSDYZt3v7t+z7iaBJXXnY3JBmGTydBb/vd0r7Ck+oo8kTU==';
  }

  private createExplosionSound(): string {
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBkOi0O+pdhgEKmbZ79SldTYbXrXy13Q9ATGNzJu8NowlFX0VWDuOTlxDSDYZt3v7t+z7iaBJXXnY3JBmGTydBb/vd0r7Ck+oo8kTU==';
  }

  private createHitSound(): string {
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBkOi0O+pdhgEKmbZ79SldTYbXrXy13Q9ATGNzJu8NowlFX0VWDuOTlxDSDYZt3v7t+z7iaBJXXnY3JBmGTydBb/vd0r7Ck+oo8kTU==';
  }

  private createVictorySound(): string {
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBkOi0O+pdhgEKmbZ79SldTYbXrXy13Q9ATGNzJu8NowlFX0VWDuOTlxDSDYZt3v7t+z7iaBJXXnY3JBmGTydBb/vd0r7Ck+oo8kTU==';
  }

  private createDefeatSound(): string {
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBkOi0O+pdhgEKmbZ79SldTYbXrXy13Q9ATGNzJu8NowlFX0VWDuOTlxDSDYZt3v7t+z7iaBJXXnY3JBmGTydBb/vd0r7Ck+oo8kTU==';
  }

  private createBackgroundMusic(): string {
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBkOi0O+pdhgEKmbZ79SldTYbXrXy13Q9ATGNzJu8NowlFX0VWDuOTlxDSDYZt3v7t+z7iaBJXXnY3JBmGTydBb/vd0r7Ck+oo8kTU==';
  }



  play(soundName: string) {
    if (!this.muted && this.sounds[soundName]) {
      this.sounds[soundName].play();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopAll();
    }
  }

  stopAll() {
    Object.values(this.sounds).forEach(sound => sound.stop());
  }

  setVolume(soundName: string, volume: number) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].volume(volume);
    }
  }
}

export default AudioManager;