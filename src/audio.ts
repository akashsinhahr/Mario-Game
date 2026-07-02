/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple retro Web Audio API Synthesizer for 8-bit sounds and background chiptune music.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private isMuted: boolean = false;
  private currentTrack: 'overworld' | 'underworld' | 'castle' | 'invincible' | null = null;
  private masterVolume: GainNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported in this browser", e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number): { osc: OscillatorNode; gain: GainNode } | null {
    this.init();
    if (!this.ctx || !this.masterVolume) return null;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(this.masterVolume);

    return { osc, gain };
  }

  // --- Sound Effects ---

  playJump() {
    const sfx = this.createOscillator('square', 150, 0.18);
    if (!sfx) return;
    const { osc, gain } = sfx;
    const now = this.ctx!.currentTime;

    osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playCoin() {
    const sfx = this.createOscillator('sine', 987.77, 0.35); // B5
    if (!sfx) return;
    const { osc, gain } = sfx;
    const now = this.ctx!.currentTime;

    gain.gain.setValueAtTime(0.3, now);
    // After 0.08 seconds, step up to E6 (1318.51 Hz)
    osc.frequency.setValueAtTime(1318.51, now + 0.08);
    gain.gain.setValueAtTime(0.3, now + 0.08);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playStomp() {
    const sfx = this.createOscillator('triangle', 120, 0.15);
    if (!sfx) return;
    const { osc, gain } = sfx;
    const now = this.ctx!.currentTime;

    osc.frequency.linearRampToValueAtTime(40, now + 0.12);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playPowerUpSpawn() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [330, 392, 659, 523, 587, 784]; // E4, G4, E5, C5, D5, G5
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const sfx = this.createOscillator('triangle', freq, 0.08);
        if (sfx) {
          sfx.gain.gain.setValueAtTime(0.2, this.ctx!.currentTime);
          sfx.gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + 0.08);
          sfx.osc.start();
          sfx.osc.stop(this.ctx!.currentTime + 0.08);
        }
      }, index * 70);
    });
  }

  playPowerUp() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [330, 392, 659, 523, 587, 784, 987]; // E4, G4, E5, C5, D5, G5, B5
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const sfx = this.createOscillator('square', freq, 0.1);
        if (sfx) {
          sfx.gain.gain.setValueAtTime(0.25, this.ctx!.currentTime);
          sfx.gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + 0.1);
          sfx.osc.start();
          sfx.osc.stop(this.ctx!.currentTime + 0.1);
        }
      }, index * 60);
    });
  }

  playPowerDown() {
    this.init();
    if (!this.ctx) return;
    const notes = [784, 587, 523, 392, 330, 220]; // Descending sweep
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const sfx = this.createOscillator('triangle', freq, 0.12);
        if (sfx) {
          sfx.gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);
          sfx.gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + 0.12);
          sfx.osc.start();
          sfx.osc.stop(this.ctx!.currentTime + 0.12);
        }
      }, index * 80);
    });
  }

  playFireball() {
    const sfx = this.createOscillator('triangle', 350, 0.12);
    if (!sfx) return;
    const { osc, gain } = sfx;
    const now = this.ctx!.currentTime;

    osc.frequency.linearRampToValueAtTime(150, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playDeath() {
    this.stopMusic();
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Play a short tragic ditty
    const deathNotes = [
      { f: 494, d: 0.15 }, // B4
      { f: 440, d: 0.15 }, // A4
      { f: 349, d: 0.15 }, // F4
      { f: 330, d: 0.4 }   // E4
    ];

    deathNotes.forEach((note, index) => {
      setTimeout(() => {
        const sfx = this.createOscillator('square', note.f, note.d);
        if (sfx) {
          sfx.gain.gain.setValueAtTime(0.35, this.ctx!.currentTime);
          sfx.gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + note.d);
          sfx.osc.start();
          sfx.osc.stop(this.ctx!.currentTime + note.d);
        }
      }, index * 160);
    });
  }

  playStageClear() {
    this.stopMusic();
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Triumphant theme
    const notes = [
      { f: 261.63, d: 0.1 },  // C4
      { f: 329.63, d: 0.1 },  // E4
      { f: 392.00, d: 0.1 },  // G4
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.3 }   // G5 (holds)
    ];

    notes.forEach((note, index) => {
      setTimeout(() => {
        const sfx = this.createOscillator('triangle', note.f, note.d);
        if (sfx) {
          sfx.gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);
          sfx.gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + note.d);
          sfx.osc.start();
          sfx.osc.stop(this.ctx!.currentTime + note.d);
        }
      }, index * 120);
    });

    // Final blast note
    setTimeout(() => {
      const finalSfx = this.createOscillator('square', 1046.50, 0.5); // C6
      if (finalSfx) {
        finalSfx.gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);
        finalSfx.gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + 0.5);
        finalSfx.osc.start();
        finalSfx.osc.stop(this.ctx!.currentTime + 0.5);
      }
    }, notes.length * 120 + 50);
  }

  // --- Background Music Loop Engine ---

  startMusic(track: 'overworld' | 'underworld' | 'castle' | 'invincible') {
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.init();
    if (!this.ctx) return;

    this.currentTrack = track;
    let tempo = 120; // BPM
    let melody: number[] = [];
    let bass: number[] = [];
    let type: OscillatorType = 'square';

    if (track === 'overworld') {
      tempo = 140;
      type = 'square';
      // Classic happy-sounding sequence
      melody = [
        659, 659, 0, 659, 0, 523, 659, 0,
        784, 0, 0, 0, 392, 0, 0, 0,
        523, 0, 0, 392, 0, 0, 330, 0,
        440, 0, 494, 0, 466, 440, 0, 0,
        392, 659, 784, 880, 0, 698, 784, 0,
        659, 0, 523, 587, 494, 0, 0, 0
      ];
      bass = [
        262, 0, 262, 0, 262, 0, 262, 0,
        196, 0, 196, 0, 196, 0, 196, 0,
        220, 0, 220, 0, 220, 0, 220, 0,
        174, 0, 196, 0, 262, 0, 262, 0
      ];
    } else if (track === 'underworld') {
      tempo = 100;
      type = 'triangle';
      // Mysterious, creepy low notes
      melody = [
        262, 523, 494, 466, 440, 0, 0, 0,
        294, 587, 554, 523, 494, 0, 0, 0,
        262, 523, 494, 466, 440, 0, 220, 0,
        196, 0, 208, 0, 220, 0, 0, 0
      ];
      bass = [
        131, 0, 0, 131, 0, 0, 131, 0,
        147, 0, 0, 147, 0, 0, 147, 0,
        131, 0, 0, 131, 0, 0, 110, 0,
        98, 0, 104, 0, 110, 0, 0, 0
      ];
    } else if (track === 'castle') {
      tempo = 150;
      type = 'sawtooth'; // Intimidation!
      melody = [
        220, 0, 220, 233, 220, 0, 220, 233,
        220, 233, 247, 262, 277, 294, 311, 330,
        349, 0, 349, 330, 349, 0, 349, 330,
        220, 0, 233, 0, 220, 0, 0, 0
      ];
      bass = [
        110, 110, 110, 110, 110, 110, 110, 110,
        110, 110, 110, 110, 110, 110, 110, 110,
        130, 130, 130, 130, 130, 130, 130, 130,
        110, 0, 116, 0, 110, 0, 0, 0
      ];
    } else if (track === 'invincible') {
      tempo = 180;
      type = 'square';
      // Extremely fast starry melody
      melody = [
        523, 0, 392, 0, 523, 0, 392, 0,
        587, 0, 440, 0, 587, 0, 440, 0,
        659, 0, 523, 0, 659, 0, 523, 0,
        587, 440, 523, 392, 330, 0, 0, 0
      ];
      bass = [
        262, 262, 196, 196, 262, 262, 196, 196,
        294, 294, 220, 220, 294, 294, 220, 220,
        330, 330, 262, 262, 330, 330, 262, 262,
        294, 220, 262, 196, 165, 0, 0, 0
      ];
    }

    let index = 0;
    const stepDuration = 60 / tempo / 2; // eighth notes

    const playStep = () => {
      if (this.isMuted || !this.ctx) return;

      const melNote = melody[index % melody.length];
      const bassNote = bass ? bass[index % bass.length] : 0;

      if (melNote > 0) {
        const sfx = this.createOscillator(type, melNote, stepDuration * 0.9);
        if (sfx) {
          sfx.gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
          sfx.gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + stepDuration * 0.9);
          sfx.osc.start();
          sfx.osc.stop(this.ctx.currentTime + stepDuration * 0.9);
        }
      }

      if (bassNote > 0) {
        const bSfx = this.createOscillator('triangle', bassNote, stepDuration * 0.95);
        if (bSfx) {
          bSfx.gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
          bSfx.gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + stepDuration * 0.95);
          bSfx.osc.start();
          bSfx.osc.stop(this.ctx.currentTime + stepDuration * 0.95);
        }
      }

      index++;
    };

    // Run first beat immediately
    playStep();
    this.musicInterval = setInterval(playStep, stepDuration * 1000);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = null;
  }
}

export const audio = new AudioEngine();
