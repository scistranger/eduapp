
const phoneticMap: Record<string, string> = {
  c: "kuh",
  a: "ah",
  t: "tuh",
  b: "buh",
  f: "fff",
  h: "huh",
  m: "mmm",
  r: "rrr",
};

let rewardAudioContext: AudioContext | null = null;

export const initAudio = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    // Pre-load voices to ensure they are available immediately without delay
    window.speechSynthesis.getVoices();
  }

  if (typeof window !== "undefined" && "AudioContext" in window) {
    rewardAudioContext ??= new AudioContext();
    if (rewardAudioContext.state === "suspended") {
      void rewardAudioContext.resume();
    }
  }
};

export const prefetchAudio = async (text: string) => {
  // No-op for Web Speech API since it doesn't require network prefetching
  // which eliminates network latency / delay
};

export const speakText = async (
  text: string,
  rate = 1.0,
  pitch = 1.2
): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      const executeSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        
        const voices = window.speechSynthesis.getVoices();
        const targetVoices = [
          "Google US English",
          "Samantha",
          "Victoria",
          "Joanna",
          "Kendra",
          "Microsoft Zira Desktop - English (United States)",
        ];
        
        let selectedVoice = voices.find(v => targetVoices.includes(v.name));
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith("en-US") && (v.name.includes("Female") || v.name.includes("Google")));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      };

      // Ensure voices are loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          executeSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      } else {
        executeSpeak();
      }
    } else {
      setTimeout(resolve, 500);
    }
  });
};

export const getPhonemeSound = (letter: string) => {
  return phoneticMap[letter.toLowerCase()] || letter;
};

export const pickFreshLine = (lines: string[], previous?: string | null) => {
  const freshLines = lines.filter((line) => line !== previous);
  const choices = freshLines.length > 0 ? freshLines : lines;
  return choices[Math.floor(Math.random() * choices.length)];
};

export const playRewardSound = async (): Promise<void> => {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;

  rewardAudioContext ??= new AudioContext();
  if (rewardAudioContext.state === "suspended") {
    await rewardAudioContext.resume();
  }

  const context = rewardAudioContext;
  const start = context.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const noteStart = start + index * 0.11;

    oscillator.type = index === notes.length - 1 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.2, noteStart + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.3);
  });

  await new Promise((resolve) => setTimeout(resolve, 650));
};

export const playCrackRewardSound = async (): Promise<void> => {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;

  rewardAudioContext ??= new AudioContext();
  if (rewardAudioContext.state === "suspended") {
    await rewardAudioContext.resume();
  }

  const context = rewardAudioContext;
  const duration = 0.2;
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    const decay = 1 - index / data.length;
    data[index] = (Math.random() * 2 - 1) * decay * decay;
  }

  const crack = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  crack.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 1100;
  gain.gain.setValueAtTime(0.32, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  crack.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  crack.start();

  await new Promise((resolve) => setTimeout(resolve, 120));
  await playRewardSound();
};

export const playPhoneme = async (letter: string): Promise<void> => {
  try {
    const normalizedLetter = letter.toLowerCase();
    const filePhoneme = normalizedLetter === 'c'
      ? 'ck'
      : normalizedLetter === 'q'
        ? 'qu'
        : normalizedLetter;
    const url = `/sound_${encodeURIComponent(filePhoneme)}.mp3`;
    
    // Check that the bundled phoneme recording is available.
    const checkRes = await fetch(url, { method: 'HEAD' });
    
    if (checkRes.ok) {
      console.log(`Playing local phoneme for [${letter}]`);
      return new Promise((resolve) => {
        const audio = new Audio(url);
        audio.onended = () => resolve();
        audio.onerror = (e) => {
          console.warn(`Local audio error for [${letter}], falling back:`, e);
          speakText(getPhonemeSound(letter)).then(resolve);
        };
        audio.play();
      });
    } else {
      console.log(`Local phoneme not found for [${letter}] (Status: ${checkRes.status}), using fallback.`);
    }
  } catch (error) {
    console.error('Error playing local phoneme from backend:', error);
  }
  
  // Default fallback to TTS if the local recording is not available
  return speakText(getPhonemeSound(letter));
};
