
const phoneticMap: Record<string, string> = {
  c: "kuh",
  a: "ah",
  t: "tuh",
  b: "buh",
  h: "huh",
};

export const initAudio = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    // Pre-load voices to ensure they are available immediately without delay
    window.speechSynthesis.getVoices();
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
