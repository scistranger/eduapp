import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { vocabs } from '../data';
import { speakText, getPhonemeSound, initAudio, prefetchAudio, playPhoneme } from '../utils/audio';

import forestBg from '../assets/images/cartoon_forest_bg_1784540338051.jpg';
import dogImg from '../assets/images/dog_closeup_holding_card_solid_1784547773486.jpg';

function CartoonBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <img src={forestBg} alt="Forest Background" className="w-full h-full object-cover blur-[3px] scale-105" />
    </div>
  );
}

type MonkeyData = { id: number; letter: string; bushIndex: number; revealed: boolean; used: boolean };
type GameState = 'landing' | 'intro' | 'playing' | 'assembled' | 'celebrating' | 'quiz';
type QuizFeedback = 'correct' | 'incorrect' | null;

const quizLetters = ['b', 'f', 'h', 'c', 'r', 'm'];

export function PhonicsGame() {
  const [vocabIndex, setVocabIndex] = useState(0);
  const [bushes, setBushes] = useState<MonkeyData[]>([]);
  const [assembled, setAssembled] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>('landing');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedQuizLetter, setSelectedQuizLetter] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<QuizFeedback>(null);
  const [quizLocked, setQuizLocked] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const startQuiz = (index: number) => {
    const word = vocabs[index].word;
    setQuizIndex(index);
    setSelectedQuizLetter(null);
    setQuizFeedback(null);
    setQuizLocked(false);
    setQuizFinished(false);
    setGameState('quiz');
    prefetchAudio(`Listen carefully. ${word}. Which letter makes the first sound?`);
    speakText(`Listen carefully. ${word}. Which letter makes the first sound?`, 0.9, 1.2);
  };

  const startVocab = async (index: number) => {
    setAssembled([]);
    const word = vocabs[index].word;
    const letters = word.split('');
    const bushPositions = [0, 1, 2].sort(() => Math.random() - 0.5);
    
    // Prefetch audio in parallel
    prefetchAudio(`Let's spell... ${word}!`);
    // letters.forEach(l => prefetchAudio(getPhonemeSound(l))); // No-op for Drive URLs for now
    prefetchAudio(word);
    prefetchAudio("Great job! Let's try the next one!");
    prefetchAudio("Awesome work! You are doing great!");
    prefetchAudio("Perfect! Let's keep going!");
    prefetchAudio("You are a star! Next word!");

    const newBushes = letters.map((l, i) => ({
      id: i,
      letter: l,
      bushIndex: bushPositions[i],
      revealed: i === 0,
      used: false
    }));
    setBushes(newBushes);
    
    setGameState('playing');
    speakText(`Let's spell... ${word}!`);
  };

  const handleStartGame = async () => {
    initAudio();
    setGameState('intro');
    setVocabIndex(0);
    const word = vocabs[0].word;
    const letters = word.split('');
    prefetchAudio("Welcome to the Phonics Forest! Let's learn some words together!");
    prefetchAudio(`Let's spell... ${word}!`);
    letters.forEach(l => prefetchAudio(getPhonemeSound(l)));
    prefetchAudio(word);

    await speakText("Welcome to the Phonics Forest! Let's learn some words together!", 1.0, 1.3);
    startVocab(0);
  };

  const handleWordComplete = async () => {
    setGameState('assembled');
    const word = vocabs[vocabIndex].word;
    const letters = word.split('');
    
    await new Promise(r => setTimeout(r, 500));
    for (const letter of letters) {
       await playPhoneme(letter);
       await new Promise(r => setTimeout(r, 200));
    }
    await speakText(word, 1.0, 1.2);
    
    setGameState('celebrating');
    
    const encouragements = [
      "Great job! Let's try the next one!",
      "Awesome work! You are doing great!",
      "Perfect! Let's keep going!",
      "You are a star! Next word!"
    ];
    const enc = encouragements[Math.floor(Math.random() * encouragements.length)];
    await speakText(enc, 1.0, 1.4);
    
    if (vocabIndex === vocabs.length - 1) {
      await speakText("Now it's quiz time! Listen and find the first sound.", 1.0, 1.3);
      startQuiz(0);
      return;
    }

    const nextIndex = vocabIndex + 1;
    setVocabIndex(nextIndex);
    startVocab(nextIndex);
  };

  const handleLetterClick = async (monkeyData: MonkeyData) => {
    if (gameState !== 'playing' || monkeyData.used) return;
    
    setBushes(prev => prev.map(b => b.id === monkeyData.id ? { ...b, used: true } : b));
    setAssembled(prev => [...prev, monkeyData.letter]);
    
    const isLast = monkeyData.id === bushes.length - 1;
    if (isLast) {
      setGameState('assembled');
    } else {
      const nextId = monkeyData.id + 1;
      setBushes(prev => prev.map(b => b.id === nextId ? { ...b, revealed: true } : b));
    }

    // Don't await audio so UI is instant
    playPhoneme(monkeyData.letter).then(() => {
      if (isLast) {
        handleWordComplete();
      }
    });
  };

  const handleQuizLetterClick = async (letter: string) => {
    if (gameState !== 'quiz' || quizLocked || quizFinished) return;

    if (selectedQuizLetter !== letter) {
      setSelectedQuizLetter(letter);
      setQuizFeedback(null);
      await playPhoneme(letter);
      return;
    }

    setQuizLocked(true);
    const word = vocabs[quizIndex].word;
    const correctLetter = word[0];

    if (letter === correctLetter) {
      setQuizFeedback('correct');
      await speakText(`${word}. That's right!`, 1.0, 1.3);
      await new Promise(r => setTimeout(r, 500));

      if (quizIndex === vocabs.length - 1) {
        setQuizFinished(true);
        await speakText("Quiz complete! You are an at word star!", 1.0, 1.3);
        return;
      }

      startQuiz(quizIndex + 1);
      return;
    }

    setQuizFeedback('incorrect');
    await speakText(`Try again. Listen carefully. ${word}.`, 0.9, 1.2);
    setSelectedQuizLetter(null);
    setQuizFeedback(null);
    setQuizLocked(false);
  };

  if (gameState === 'landing') {
    return (
      <div className="flex h-screen w-full font-body overflow-hidden relative bg-[#F8F9FA]">
        <CartoonBackground />
        
        <div className="flex flex-col items-center justify-center h-full w-full relative z-20">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center text-center max-w-3xl mx-4"
          >
            <h1 
              className="text-6xl sm:text-[80px] font-display font-bold text-white mb-10 tracking-widest drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] z-10 w-full max-w-4xl text-center"
              style={{ 
                WebkitTextStroke: '6px #1A2F33',
                paintOrder: 'stroke fill',
                textShadow: '0 6px 0 #1A2F33, 0 10px 15px rgba(0,0,0,0.5)'
              }}
            >
              Phonics Forest
            </h1>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleStartGame}
                className="bg-[#00B8D4] text-white text-3xl sm:text-5xl font-fredoka font-black py-6 px-16 rounded-[3rem] shadow-[0_12px_0_#1A2F33] hover:translate-y-2 hover:shadow-[0_4px_0_#1A2F33] active:translate-y-4 active:shadow-none transition-all tracking-wide border-[6px] border-[#1A2F33] h-[100px] flex items-center justify-center"
              >
                PLAY
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gameState === 'quiz') {
    const quizVocab = vocabs[quizIndex];

    return (
      <div className="flex h-screen w-full font-body overflow-hidden relative bg-[#F8F9FA]">
        <CartoonBackground />

        <div className="flex flex-col h-full w-full relative z-10">
          <div className="h-[54%] flex flex-row items-center justify-center gap-6 sm:gap-12 px-4 w-full max-w-6xl mx-auto">
            <div className="flex flex-col items-center gap-4 shrink-0">
              <motion.div
                key={quizVocab.image}
                initial={{ scale: 0, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.6 }}
                className="w-40 h-40 sm:w-60 sm:h-60 bg-white border-[6px] border-[#1A2F33] rounded-[3rem] shadow-[0_12px_0_#1A2F33] overflow-hidden flex items-center justify-center p-2"
              >
                <img src={quizVocab.image} alt={quizVocab.word} className="w-full h-full object-cover rounded-[2rem]" />
              </motion.div>

              <button
                type="button"
                onClick={() => speakText(quizVocab.word, 0.9, 1.2)}
                aria-label={`Listen to ${quizVocab.word}`}
                className="bg-[#00B8D4] text-white text-lg sm:text-2xl font-fredoka font-black py-3 px-6 rounded-full border-[4px] border-[#1A2F33] shadow-[0_6px_0_#1A2F33] hover:translate-y-1 hover:shadow-[0_2px_0_#1A2F33] active:translate-y-2 active:shadow-none transition-all"
              >
                🔊 LISTEN
              </button>
            </div>

            <div className="flex flex-col items-center gap-5">
              <div className="bg-white/90 border-[4px] border-[#1A2F33] rounded-full px-5 py-2 text-[#1A2F33] text-lg sm:text-2xl font-fredoka font-bold shadow-[0_5px_0_#1A2F33]">
                Sound Quiz {quizIndex + 1}/{vocabs.length}
              </div>

              <div className="flex gap-3 sm:gap-5 justify-center">
                <motion.div
                  animate={selectedQuizLetter ? { y: -8, scale: 1.04 } : { y: 0, scale: 1 }}
                  className={`w-20 h-28 sm:w-28 sm:h-40 rounded-[2.5rem] border-[6px] border-[#1A2F33] flex items-center justify-center text-5xl sm:text-7xl font-fredoka font-black uppercase shadow-[0_10px_0_#1A2F33] transition-colors
                    ${quizFeedback === 'correct'
                      ? 'bg-[#69F0AE] text-[#1A2F33]'
                      : quizFeedback === 'incorrect'
                        ? 'bg-[#FF8A80] text-[#1A2F33]'
                        : selectedQuizLetter
                          ? 'bg-[#FFEA00] text-[#1A2F33]'
                          : 'bg-white text-[#8DA0A5]'}`}
                >
                  {selectedQuizLetter || '?'}
                </motion.div>

                {['a', 't'].map(letter => (
                  <div
                    key={letter}
                    className="w-20 h-28 sm:w-28 sm:h-40 rounded-[2.5rem] border-[6px] border-[#1A2F33] flex items-center justify-center text-5xl sm:text-7xl font-fredoka font-black uppercase bg-[#FFEA00] text-[#1A2F33] shadow-[0_10px_0_#1A2F33]"
                  >
                    {letter}
                  </div>
                ))}
              </div>

              <p className="max-w-md text-center bg-white/90 border-[4px] border-[#1A2F33] rounded-[2rem] px-5 py-3 text-[#1A2F33] text-base sm:text-xl font-fredoka font-bold shadow-[0_5px_0_#1A2F33]">
                {selectedQuizLetter
                  ? `You chose ${selectedQuizLetter.toUpperCase()}. Tap it again to confirm!`
                  : 'Listen to the word. Which letter comes first?'}
              </p>
            </div>
          </div>

          <div className="h-[46%] flex flex-col items-center justify-start pt-4 sm:pt-8 px-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-5">
              {quizLetters.map(letter => {
                const isSelected = selectedQuizLetter === letter;
                return (
                  <motion.button
                    key={letter}
                    type="button"
                    onClick={() => handleQuizLetterClick(letter)}
                    disabled={quizLocked || quizFinished}
                    aria-pressed={isSelected}
                    aria-label={isSelected ? `${letter}, selected. Tap again to confirm` : `Choose ${letter}`}
                    whileHover={quizLocked ? undefined : { y: -6, scale: 1.05 }}
                    whileTap={quizLocked ? undefined : { y: 4, scale: 0.98 }}
                    className={`w-20 h-24 sm:w-24 sm:h-28 rounded-[2rem] border-[5px] border-[#1A2F33] flex items-center justify-center text-5xl sm:text-6xl font-fredoka font-black uppercase transition-colors shadow-[0_9px_0_#1A2F33] disabled:cursor-default
                      ${isSelected ? 'bg-[#FFEA00] text-[#1A2F33]' : 'bg-white text-[#1A2F33]'}`}
                  >
                    {letter}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {quizFeedback === 'correct' && !quizFinished && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-5 top-5 sm:right-10 sm:top-10 z-40 text-5xl sm:text-7xl bg-[#69F0AE] border-[6px] border-[#1A2F33] rounded-full p-4 shadow-[0_8px_0_#1A2F33]"
            >
              ✓
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {quizFinished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-sm px-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.6 }}
                className="bg-[#FFEA00] border-[7px] border-[#1A2F33] rounded-[3rem] shadow-[0_14px_0_#1A2F33] p-8 sm:p-12 text-center max-w-xl"
              >
                <div className="text-7xl sm:text-9xl mb-4">⭐</div>
                <h2 className="text-4xl sm:text-6xl font-fredoka font-black text-[#1A2F33] mb-3">Quiz Complete!</h2>
                <p className="text-xl sm:text-3xl font-fredoka font-bold text-[#1A2F33] mb-8">You are an -at word star!</p>
                <button
                  type="button"
                  onClick={() => startQuiz(0)}
                  className="bg-[#00B8D4] text-white text-xl sm:text-3xl font-fredoka font-black py-4 px-8 rounded-full border-[5px] border-[#1A2F33] shadow-[0_8px_0_#1A2F33] hover:translate-y-1 hover:shadow-[0_3px_0_#1A2F33] active:translate-y-2 active:shadow-none transition-all"
                >
                  PLAY QUIZ AGAIN
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const vocab = vocabs[vocabIndex];
  const targetLetters = vocab.word.split('');

  return (
    <div className="flex h-screen w-full font-body overflow-hidden relative bg-[#F8F9FA]">
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="remove-white" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              -5 -5 -5 14.5 0
            " />
          </filter>
        </defs>
      </svg>
      <CartoonBackground />
      
      {/* Game Area */}
      <div className="flex flex-col h-full w-full relative z-10">
        
        {/* Upper Panel */}
        <div className="h-1/2 flex flex-row items-center justify-center gap-8 sm:gap-16 relative z-10 px-4 w-full max-w-6xl mx-auto">
          <motion.div 
            key={vocab.image}
            initial={{ scale: 0, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.6 }}
            className="w-40 h-40 sm:w-64 sm:h-64 bg-white border-[6px] border-[#1A2F33] rounded-[3rem] shadow-[0_12px_0_#1A2F33] overflow-hidden flex items-center justify-center p-2 shrink-0"
          >
            <img src={vocab.image} alt={vocab.word} className="w-full h-full object-cover rounded-[2rem]" />
          </motion.div>
          
          <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
            {targetLetters.map((l, i) => (
              <div 
                key={i} 
                className={`w-20 h-28 sm:w-28 sm:h-40 rounded-[2.5rem] border-[6px] border-[#1A2F33] flex items-center justify-center text-5xl sm:text-7xl font-fredoka font-black uppercase transition-all duration-500 shadow-[0_10px_0_#1A2F33]
                  ${assembled[i] 
                    ? 'bg-[#FFEA00] text-[#1A2F33] transform -translate-y-2' 
                    : 'bg-[#F8F9FA] text-transparent'}`}
              >
                {assembled[i] && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} type="spring" bounce={0.7}>
                    {assembled[i]}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Lower Panel - Dogs pop from bottom */}
        <div className="h-1/2 relative w-full flex items-end justify-center gap-4 sm:gap-16 z-20 pb-0 px-4">
          {[0, 1, 2].map((bushIndex) => {
            const monkeyData = bushes.find(b => b.bushIndex === bushIndex);
            return (
              <div key={bushIndex} className="relative w-32 sm:w-56 h-40 sm:h-64 flex items-end justify-center overflow-visible">
                <AnimatePresence>
                  {monkeyData && monkeyData.revealed && !monkeyData.used && (
                    <motion.div 
                      initial={{ y: '100%', opacity: 1 }}
                      animate={{ y: '0%', opacity: 1 }}
                      exit={{ y: '100%', opacity: 1, transition: { duration: 0.3 } }}
                      whileHover={{ y: '-5%', scale: 1.05 }}
                      onClick={() => handleLetterClick(monkeyData)}
                      className="absolute bottom-0 flex flex-col items-center cursor-pointer transition-transform duration-300 transform-gpu"
                    >
                      <div className="relative flex flex-col items-center justify-end w-40 sm:w-72 h-[270px]">
                        <div className="z-20 bg-white w-16 h-20 sm:w-24 sm:h-28 rounded-[1rem] shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] border-[4px] border-[#1A2F33] flex items-center justify-center text-5xl sm:text-7xl font-fredoka font-black text-[#1A2F33] uppercase -mb-4 sm:-mb-6">
                          {monkeyData.letter}
                        </div>
                        <img src={dogImg} alt="Dog" className="w-40 h-[270px] sm:w-72 object-cover object-top z-10 pointer-events-none drop-shadow-md" style={{ filter: 'url(#remove-white)' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {gameState === 'celebrating' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.6 }}
              className="text-9xl sm:text-[180px] bg-[#FFEA00] p-12 rounded-full shadow-[0_0_0_12px_#1A2F33,0_20px_40px_rgba(0,0,0,0.3)] text-white drop-shadow-2xl"
            >
              ⭐
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
