// Minimal Web Audio API synthesizer for game sounds
export class Audio {
  constructor() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      this._ctx = null;
    }
    this._resumed = false;

    // Resume context on first user gesture
    const resume = () => {
      if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
      this._resumed = true;
    };
    window.addEventListener('keydown', resume, { once: true });
    window.addEventListener('click', resume, { once: true });

    this._startAmbient();
  }

  play(sound) {
    if (!this._ctx) return;
    if (this._ctx.state === 'suspended') this._ctx.resume();

    switch (sound) {
      case 'eat': this._playEat(); break;
      case 'bask': this._playBask(); break;
      case 'dig': this._playDig(); break;
      case 'hawk': this._playHawk(); break;
      case 'friend': this._playFriend(); break;
      case 'grow': this._playGrow(); break;
      case 'raccoon': this._playRaccoon(); break;
    }
  }

  _node(type, freq, when = 0) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    return { osc, gain };
  }

  _playEat() {
    const ctx = this._ctx;
    const n = this._node('sine', 300);
    n.gain.gain.setValueAtTime(0.15, ctx.currentTime);
    n.osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
    n.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    n.osc.stop(ctx.currentTime + 0.2);
  }

  _playBask() {
    const ctx = this._ctx;
    // Three soft ascending chime notes — warm and positive
    [0, 0.18, 0.36].forEach((when, i) => {
      const n = this._node('sine', [440, 550, 660][i], when);
      n.gain.gain.setValueAtTime(0.0, ctx.currentTime + when);
      n.gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + when + 0.04);
      n.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.38);
      n.osc.stop(ctx.currentTime + when + 0.42);
    });
  }

  _playDig() {
    const ctx = this._ctx;
    for (let i = 0; i < 4; i++) {
      const n = this._node('sawtooth', 60 + Math.random() * 30, i * 0.1);
      n.gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.1);
      n.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.08);
      n.osc.stop(ctx.currentTime + i * 0.1 + 0.1);
    }
  }

  _playRaccoon() {
    const ctx = this._ctx;
    // Short harsh chitter — rapid bursts of detuned sawtooth descending in pitch
    [0, 0.07, 0.14, 0.21, 0.28].forEach((when, i) => {
      const n = this._node('sawtooth', 380 - i * 30, when);
      n.gain.gain.setValueAtTime(0.09, ctx.currentTime + when);
      n.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.06);
      n.osc.stop(ctx.currentTime + when + 0.07);
    });
  }

  _playHawk() {
    const ctx = this._ctx;
    const n = this._node('sawtooth', 600);
    n.gain.gain.setValueAtTime(0.12, ctx.currentTime);
    n.osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
    n.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    n.osc.stop(ctx.currentTime + 0.7);
  }

  _playFriend() {
    const ctx = this._ctx;
    [0, 0.15, 0.3, 0.45].forEach((when, i) => {
      const freqs = [440, 550, 660, 880];
      const n = this._node('sine', freqs[i], when);
      n.gain.gain.setValueAtTime(0.12, ctx.currentTime + when);
      n.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.25);
      n.osc.stop(ctx.currentTime + when + 0.3);
    });
  }

  _playGrow() {
    const ctx = this._ctx;
    const notes = [262, 330, 392, 523, 659];
    notes.forEach((freq, i) => {
      const n = this._node('sine', freq, i * 0.12);
      n.gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.12);
      n.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      n.osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  }

  _startAmbient() {
    if (!this._ctx) return;

    // Bird chirps — short high twittering, feels like a sunny outdoor morning
    const playChirp = () => {
      if (!this._ctx || this._ctx.state === 'suspended') {
        setTimeout(playChirp, 2000);
        return;
      }
      const ctx = this._ctx;
      const freq = 1800 + Math.random() * 1000;
      const n = this._node('sine', freq);
      n.gain.gain.setValueAtTime(0.018, ctx.currentTime);
      n.osc.frequency.linearRampToValueAtTime(freq * 1.15, ctx.currentTime + 0.04);
      n.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      n.osc.stop(ctx.currentTime + 0.15);
      setTimeout(playChirp, (1 + Math.random() * 4) * 1000);
    };
    setTimeout(playChirp, 1500);

    // Warm C-major pad (C3 + E3 + G3) — gentle background warmth, not spooky
    const startPad = () => {
      if (!this._ctx) return;
      const ctx = this._ctx;
      [131, 165, 196].forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.012;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        // Very slow gentle swell — never wobbly or low/droning
        setInterval(() => {
          gain.gain.linearRampToValueAtTime(0.008 + Math.random() * 0.008, ctx.currentTime + 6);
        }, 6000);
      });
    };
    setTimeout(startPad, 800);

    // Cheerful melody — C major pentatonic, plucky xylophone tone
    // Each entry: [frequency_hz, beat_duration]
    const MELODY = [
      [523, 0.4], [659, 0.4], [784, 0.4], [659, 0.4],
      [523, 0.4], [440, 0.4], [523, 0.8],
      [0,   0.4],
      [392, 0.4], [440, 0.4], [523, 0.4], [659, 0.4],
      [784, 0.8], [659, 0.4], [523, 1.2],
      [0,   0.8],
    ];

    const playMelody = () => {
      if (!this._ctx || this._ctx.state === 'suspended') {
        setTimeout(playMelody, 2000);
        return;
      }
      const ctx = this._ctx;
      let t = ctx.currentTime + 0.05;

      MELODY.forEach(([freq, dur]) => {
        if (freq === 0) { t += dur; return; }

        // Triangle wave + quick sine harmonic = warm xylophone/ukulele pluck
        const osc = ctx.createOscillator();
        const harm = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;
        harm.type = 'sine';
        harm.frequency.value = freq * 2;

        osc.connect(gain);
        harm.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.032, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur, 0.55));

        osc.start(t);
        harm.start(t);
        osc.stop(t + dur);
        harm.stop(t + dur);

        t += dur;
      });

      // Loop: schedule next run just after this one ends
      const totalDur = MELODY.reduce((s, [, d]) => s + d, 0);
      setTimeout(playMelody, (totalDur + 1.5) * 1000);
    };

    // Wait for first user gesture before starting melody (AudioContext policy)
    const startOnGesture = () => {
      if (this._ctx.state === 'suspended') {
        this._ctx.resume().then(playMelody);
      } else {
        playMelody();
      }
    };
    window.addEventListener('keydown', startOnGesture, { once: true });
    window.addEventListener('click', startOnGesture, { once: true });
  }
}
