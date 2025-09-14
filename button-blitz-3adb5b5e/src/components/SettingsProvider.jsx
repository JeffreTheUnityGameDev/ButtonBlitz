import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';

export const SettingsContext = createContext();

const defaultSettings = {
  gameMode: 'party',
  totalRounds: 10,
  masterVolume: 0.7,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  vibrationEnabled: true,
  showHints: true,
  theme: 'dark',
  graphics: 'high',
};

// --- Audio Engine with Programmatic Music ---
let audioContext;
let musicSource;
let masterGain;
let musicGain;
let sfxGain;

const initAudio = () => {
    if (typeof window !== 'undefined' && !audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            musicGain = audioContext.createGain();
            sfxGain = audioContext.createGain();

            musicGain.connect(masterGain);
            sfxGain.connect(masterGain);
            masterGain.connect(audioContext.destination);
        } catch (error) {
            console.warn('Audio not supported on this device:', error);
        }
    }
};

// --- Enhanced Sound Engine ---
function playTone(frequency, duration, type = 'sine', volume = 1) {
  if (!audioContext || !sfxGain) return;
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(sfxGain);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) { console.error("Error playing tone:", error); }
}

const soundEffects = {
  tap: () => playTone(600, 0.05, 'triangle', 0.3),
  ui_click: () => playTone(800, 0.05, 'square', 0.2),
  button_click: () => playTone(950, 0.08, 'sine', 0.4),
  menu_hover: () => playTone(700, 0.03, 'sine', 0.15),
  success: () => { 
    playTone(440, 0.1, 'sine', 0.4); 
    setTimeout(() => playTone(587.33, 0.1, 'sine', 0.4), 100); 
    setTimeout(() => playTone(880, 0.15, 'sine', 0.5), 200); 
  },
  fail: () => { 
    playTone(220, 0.2, 'square', 0.4); 
    setTimeout(() => playTone(164.81, 0.3, 'square', 0.4), 150); 
  },
  start: () => playTone(523.25, 0.1, 'sine', 0.5),
  beep: () => playTone(800, 0.1, 'square', 0.2),
  countdown_tick: () => playTone(1200, 0.05, 'sine', 0.3),
  win: () => {
    playTone(523.25, 0.2, 'sine', 0.6);
    setTimeout(() => playTone(659.25, 0.2, 'sine', 0.6), 200);
    setTimeout(() => playTone(783.99, 0.2, 'sine', 0.6), 400);
    setTimeout(() => playTone(1046.50, 0.4, 'sine', 0.7), 600);
    setTimeout(() => playTone(1318.51, 0.3, 'sine', 0.8), 1000);
  },
  whoosh: () => playTone(200, 0.3, 'sawtooth', 0.3),
  ding: () => playTone(1000, 0.1, 'sine', 0.4),
  pop: () => playTone(800, 0.05, 'square', 0.3),
  positive_tap: () => playTone(783.99, 0.05, 'triangle', 0.25),
  negative_tap: () => playTone(200, 0.08, 'sawtooth', 0.3),
  score_up: () => {
    playTone(659.25, 0.05, 'sine', 0.4);
    setTimeout(() => playTone(783.99, 0.05, 'sine', 0.4), 50);
    setTimeout(() => playTone(987.77, 0.1, 'sine', 0.5), 100);
  },
  power_up: () => {
    for(let i = 0; i < 5; i++) {
      setTimeout(() => playTone(440 + i * 100, 0.1, 'square', 0.3), i * 50);
    }
  }
};

// Enhanced Programmatic music generation with different tracks
const createMenuMusic = () => {
    if (!audioContext) return null;
    
    const bufferLength = audioContext.sampleRate * 32; // 32 seconds
    const buffer = audioContext.createBuffer(2, bufferLength, audioContext.sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Chill menu chord progression: Am - F - C - G
    const progression = [
        [220, 261.63, 329.63],    // A minor
        [174.61, 220, 261.63],    // F major
        [261.63, 329.63, 392.00], // C major
        [196, 246.94, 293.66]     // G major
    ];
    
    for (let i = 0; i < bufferLength; i++) {
        const time = i / audioContext.sampleRate;
        const chordIndex = Math.floor(time / 8) % progression.length;
        const chord = progression[chordIndex];
        
        let sample = 0;
        
        // Gentle arpeggiated melody
        chord.forEach((freq, index) => {
            const envelope = 0.3 + 0.1 * Math.sin(time * Math.PI * 0.25);
            sample += Math.sin(2 * Math.PI * freq * time) * envelope * 0.08;
            // Add soft harmony
            sample += Math.sin(2 * Math.PI * freq * 1.5 * time) * envelope * 0.03;
        });
        
        // Soft bassline
        const bassFreq = chord[0] * 0.5;
        sample += Math.sin(2 * Math.PI * bassFreq * time) * 0.06;
        
        // Gentle ambient pad
        sample += Math.sin(2 * Math.PI * chord[1] * 0.25 * time) * 0.04;
        
        leftChannel[i] = sample;
        rightChannel[i] = sample * 0.9; // Slight stereo separation
    }
    
    return buffer;
};

const createGameMusic = () => {
    if (!audioContext) return null;
    
    const bufferLength = audioContext.sampleRate * 36; // 36 seconds loop
    const buffer = audioContext.createBuffer(2, bufferLength, audioContext.sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    const bpm = 140; // Energetic tempo for gameplay
    const beatDuration = 60 / bpm;
    const noteDuration = beatDuration / 4;
    
    // High energy progression: Em - C - G - D
    const melodyA = [329.63, 392, 440, 523.25, 587.33, 523.25, 440, 392];
    const melodyB = [659.25, 587.33, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25];
    const bassLine = [164.81, 130.81, 196, 146.83, 164.81, 130.81, 196, 146.83];

    for (let i = 0; i < bufferLength; i++) {
        const time = i / audioContext.sampleRate;
        const beatIndex = Math.floor(time / noteDuration) % 8;
        
        const currentMelody = Math.floor(time / (beatDuration * 8)) % 2 === 0 ? melodyA : melodyB;
        const melodyFreq = currentMelody[beatIndex];
        const bassFreq = bassLine[beatIndex];
        
        let sample = 0;
        
        // Dynamic melody
        const envelope = Math.exp(-(time % noteDuration) * 12);
        sample += Math.sin(2 * Math.PI * melodyFreq * time) * envelope * 0.12;
        sample += Math.sin(2 * Math.PI * melodyFreq * 2 * time) * envelope * 0.04;
        
        // Driving bass
        const bassEnvelope = Math.exp(-(time % noteDuration) * 8);
        sample += Math.sin(2 * Math.PI * bassFreq * time) * bassEnvelope * 0.15;
        
        // Enhanced rhythmic elements
        if (beatIndex === 0 || beatIndex === 4) {
            if (time % beatDuration < 0.05) {
                sample += Math.sin(2 * Math.PI * 60 * time) * Math.exp(-(time % beatDuration) * 50) * 0.5;
            }
        }

        // Snare hits
        if (beatIndex === 2 || beatIndex === 6) {
            if (time % beatDuration < 0.03) {
                sample += (Math.random() * 2 - 1) * Math.exp(-(time % beatDuration) * 100) * 0.15;
            }
        }
        
        // Hi-hat pattern
        if (time % (noteDuration) < 0.01) {
            sample += (Math.random() * 2 - 1) * 0.04;
        }
        
        // Add some electronic effects
        sample += Math.sin(2 * Math.PI * melodyFreq * 0.5 * time + Math.sin(time * 4)) * 0.03;
        
        leftChannel[i] = sample;
        rightChannel[i] = sample * 0.95;
    }
    
    return buffer;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const currentMusic = useRef(null);
  const settingsRef = useRef(defaultSettings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    initAudio();
    try {
      const savedSettings = localStorage.getItem('gameSettings');
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      setSettings(defaultSettings);
    }
  }, []);

  const updateSettings = useCallback((key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('gameSettings', JSON.stringify(newSettings));
      
      // Update audio levels immediately
      if (audioContext && masterGain && musicGain && sfxGain) {
        try {
          const masterVol = key === 'masterVolume' ? value : newSettings.masterVolume;
          const musicVol = key === 'musicVolume' ? value : newSettings.musicVolume;  
          const sfxVol = key === 'sfxVolume' ? value : newSettings.sfxVolume;
          
          masterGain.gain.setValueAtTime(masterVol, audioContext.currentTime);
          musicGain.gain.setValueAtTime(musicVol, audioContext.currentTime);
          sfxGain.gain.setValueAtTime(sfxVol, audioContext.currentTime);
        } catch (error) {
          console.warn('Failed to set audio levels:', error);
        }
      }
      
      return newSettings;
    });
  }, []);

  const applyTheme = useCallback((theme) => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
      
      if (theme === 'light') {
        document.body.classList.add('theme-light');
      } else if (theme === 'high-contrast') {
        document.body.classList.add('theme-high-contrast');
      } else {
        document.body.classList.add('theme-dark');
      }

      const root = document.documentElement;
      if (settings?.graphics === 'low') {
        root.style.setProperty('--animation-duration', '0s');
        root.style.setProperty('--backdrop-blur', 'none');
        root.style.setProperty('--shadow-intensity', '0');
      } else if (settings?.graphics === 'medium') {
        root.style.setProperty('--animation-duration', '0.15s');
        root.style.setProperty('--backdrop-blur', 'blur(8px)');
        root.style.setProperty('--shadow-intensity', '0.5');
      } else {
        root.style.setProperty('--animation-duration', '0.3s');
        root.style.setProperty('--backdrop-blur', 'blur(16px)');
        root.style.setProperty('--shadow-intensity', '1');
      }
    }
  }, [settings?.graphics]);
  
  const playSound = useCallback((type) => {
    const currentSettings = settingsRef.current;
    if (currentSettings?.sfxVolume > 0 && soundEffects[type]) {
      if (!audioContext) initAudio();
      if (audioContext?.state === 'suspended') {
        audioContext.resume();
      }
      soundEffects[type]();
    }
  }, []);

  const playMusic = useCallback(async (track) => {
    const currentSettings = settingsRef.current;
    if (!audioContext || !currentSettings?.musicVolume || currentSettings.musicVolume === 0) {
      if (musicSource) {
        try { 
          musicSource.stop(); 
          musicSource.disconnect();
        } catch (e) {}
        musicSource = null;
        currentMusic.current = null;
      }
      return;
    }
    if (currentMusic.current === track) return;
    
    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      if (musicSource) {
        try { 
          musicSource.stop(); 
          musicSource.disconnect();
        } catch (e) {}
      }

      currentMusic.current = track;
      
      let audioBuffer;
      if (track === 'menu') {
        audioBuffer = createMenuMusic();
      } else if (track === 'game') {
        audioBuffer = createGameMusic();
      }
      
      if (audioBuffer) {
        musicSource = audioContext.createBufferSource();
        musicSource.buffer = audioBuffer;
        musicSource.loop = true;
        musicSource.connect(musicGain);
        musicSource.start();
      }
      
    } catch (error) {
      console.warn(`Music playback failed for track: ${track}. Continuing without music.`, error);
    }

  }, []);

  useEffect(() => {
    if (settings) {
      applyTheme(settings.theme);
      if (audioContext && masterGain && musicGain && sfxGain) {
        try {
            masterGain.gain.setValueAtTime(settings.masterVolume, audioContext.currentTime);
            musicGain.gain.setValueAtTime(settings.musicVolume, audioContext.currentTime);
            sfxGain.gain.setValueAtTime(settings.sfxVolume, audioContext.currentTime);
        } catch (error) {
          console.warn('Failed to set audio levels:', error);
        }
      }
    }
  }, [settings, applyTheme]);

  const value = { settings, updateSettings, playMusic, playSound };

  return (
    <SettingsContext.Provider value={value}>
      {settings ? children : (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
          </div>
      )}
    </SettingsContext.Provider>
  );
}