import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  initAudio,
  pickFreshLine,
  playPhoneme,
  playRewardSound,
  speakText,
} from "../utils/audio";

import forestBg from "../assets/images/cartoon_forest_bg_1784540338051.jpg";

const learningLetters = ["b", "m", "r", "f", "h", "a", "t", "c"];

const introPrompts = [
  (letter: string) => `Here comes letter ${letter.toUpperCase()}. Listen to its special sound.`,
  (letter: string) => `Say hello to ${letter.toUpperCase()}. What a useful sound! Listen.`,
  (letter: string) => `Our next forest friend is ${letter.toUpperCase()}. Here's how it sounds.`,
  (letter: string) => `Look at ${letter.toUpperCase()}. Let's hear its sound together.`,
];

const quizPrompts = [
  "Listen closely. Which card matches this sound?",
  "Can your ears find this sound? Choose one card.",
  "Here comes a sound. Tap the letter that belongs to it.",
  "Sound detective, which letter did you hear?",
];

const correctLines = [
  "Yes! Your listening ears found it.",
  "That's the one! Brilliant sound matching.",
  "You got it! That letter and sound belong together.",
  "Wonderful! You caught that sound.",
  "Exactly right! Let's keep exploring.",
];

const tryAgainLines = [
  "Good try. Let's hear the sound once more.",
  "Almost! Listen again and take another look.",
  "Not this one yet. Your ears get another chance.",
  "Let's try that sound again. You can do it.",
];

type Phase = "intro" | "quiz" | "complete";

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const buildChoices = (target: string) =>
  shuffle([
    target,
    ...shuffle(learningLetters.filter((letter) => letter !== target)).slice(0, 2),
  ]);

function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <img src={forestBg} alt="" className="h-full w-full scale-105 object-cover blur-[3px]" />
      <div className="absolute inset-0 bg-[#113e39]/25" />
    </div>
  );
}

export function LetterGame({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [introIndex, setIntroIndex] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const [quizOrder, setQuizOrder] = useState(() => shuffle(learningLetters));
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizLocked, setQuizLocked] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const previousPrompt = useRef<string | null>(null);
  const previousPraise = useRef<string | null>(null);
  const previousTryAgain = useRef<string | null>(null);

  const introLetter = learningLetters[introIndex];
  const quizTarget = quizOrder[quizIndex];
  const choices = useMemo(() => buildChoices(quizTarget), [quizTarget]);

  useEffect(() => {
    initAudio();
  }, []);

  useEffect(() => {
    if (phase !== "intro") return;
    let active = true;

    const introduce = async () => {
      setIntroReady(false);
      const lineMaker = introPrompts[introIndex % introPrompts.length];
      await speakText(lineMaker(introLetter), 0.94, 1.16);
      await playPhoneme(introLetter);
      if (active) setIntroReady(true);
    };

    void introduce();
    return () => {
      active = false;
    };
  }, [introIndex, introLetter, phase]);

  useEffect(() => {
    if (phase !== "quiz") return;
    let active = true;

    const ask = async () => {
      setQuizLocked(true);
      setSelectedLetter(null);
      setFeedback(null);
      const line = pickFreshLine(quizPrompts, previousPrompt.current);
      previousPrompt.current = line;
      await speakText(line, 0.96, 1.18);
      await playPhoneme(quizTarget);
      if (active) setQuizLocked(false);
    };

    void ask();
    return () => {
      active = false;
    };
  }, [phase, quizIndex, quizTarget]);

  const moveFromIntro = async () => {
    if (!introReady) return;

    if (introIndex < learningLetters.length - 1) {
      setIntroIndex((index) => index + 1);
      return;
    }

    setIntroReady(false);
    await speakText("You've met every letter on this trail. Now let's match sounds to cards!", 0.96, 1.18);
    setPhase("quiz");
  };

  const replayIntroSound = () => {
    initAudio();
    void playPhoneme(introLetter);
  };

  const replayQuizSound = async () => {
    if (quizLocked) return;
    setQuizLocked(true);
    await playPhoneme(quizTarget);
    setQuizLocked(false);
  };

  const chooseLetter = async (letter: string) => {
    if (phase !== "quiz" || quizLocked) return;

    setQuizLocked(true);
    setSelectedLetter(letter);

    if (letter === quizTarget) {
      setFeedback("correct");
      await playRewardSound();
      const line = pickFreshLine(correctLines, previousPraise.current);
      previousPraise.current = line;
      await speakText(line, 0.98, 1.22);

      if (quizIndex === quizOrder.length - 1) {
        setPhase("complete");
        await playRewardSound();
        await speakText("You finished the Letter Sound Trail! Every sound has a letter friend.", 0.96, 1.2);
        return;
      }

      setQuizIndex((index) => index + 1);
      return;
    }

    setFeedback("incorrect");
    const line = pickFreshLine(tryAgainLines, previousTryAgain.current);
    previousTryAgain.current = line;
    await speakText(line, 0.94, 1.14);
    await playPhoneme(quizTarget);
    setSelectedLetter(null);
    setFeedback(null);
    setQuizLocked(false);
  };

  const replayLevel = () => {
    setIntroIndex(0);
    setQuizOrder(shuffle(learningLetters));
    setQuizIndex(0);
    setSelectedLetter(null);
    setFeedback(null);
    setPhase("intro");
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden px-4 py-4 font-body sm:px-8 sm:py-6">
      <Background />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border-4 border-[#1A2F33] bg-white px-4 py-2 font-fredoka text-base font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33] transition-all hover:translate-y-1 hover:shadow-[0_2px_0_#1A2F33] sm:text-xl"
        >
          ← LEVELS
        </button>
        <div className="rounded-full border-4 border-[#1A2F33] bg-[#FFEA00] px-4 py-2 text-center font-fredoka text-base font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33] sm:px-7 sm:text-xl">
          LEVEL 1 · LETTER SOUND TRAIL
        </div>
      </header>

      {phase === "intro" && (
        <section className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center justify-center py-5">
          <div className="mb-4 flex gap-2" aria-label={`Letter ${introIndex + 1} of ${learningLetters.length}`}>
            {learningLetters.map((letter, index) => (
              <span
                key={letter}
                className={`h-3 w-8 rounded-full border-2 border-[#1A2F33] sm:w-11 ${index <= introIndex ? "bg-[#FFEA00]" : "bg-white/75"}`}
              />
            ))}
          </div>

          <motion.div
            key={introLetter}
            initial={{ scale: 0.45, y: 60, rotate: -8 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.55 }}
            className="flex w-full max-w-xl flex-col items-center rounded-[3rem] border-[7px] border-[#1A2F33] bg-white/95 px-6 py-7 shadow-[0_15px_0_#1A2F33] sm:px-10 sm:py-9"
          >
            <p className="mb-3 font-fredoka text-lg font-bold uppercase tracking-[0.2em] text-[#008FA6] sm:text-2xl">
              Meet the sound
            </p>
            <div className="flex h-56 w-44 items-center justify-center rounded-[2.8rem] border-[7px] border-[#1A2F33] bg-[#FFEA00] font-fredoka text-[9rem] font-black uppercase leading-none text-[#1A2F33] shadow-[0_12px_0_#1A2F33] sm:h-72 sm:w-56 sm:text-[12rem]">
              {introLetter}
            </div>
            <button
              type="button"
              onClick={replayIntroSound}
              className="mt-6 rounded-full border-4 border-[#1A2F33] bg-[#00B8D4] px-6 py-3 font-fredoka text-xl font-black text-white shadow-[0_6px_0_#1A2F33] transition-all hover:translate-y-1 hover:shadow-[0_2px_0_#1A2F33]"
            >
              🔊 HEAR IT AGAIN
            </button>
          </motion.div>

          <button
            type="button"
            onClick={moveFromIntro}
            disabled={!introReady}
            className="mt-7 rounded-full border-[5px] border-[#1A2F33] bg-[#69F0AE] px-8 py-4 font-fredoka text-xl font-black text-[#1A2F33] shadow-[0_8px_0_#1A2F33] transition-all hover:translate-y-1 hover:shadow-[0_3px_0_#1A2F33] disabled:cursor-wait disabled:opacity-55 sm:text-2xl"
          >
            {introIndex === learningLetters.length - 1 ? "START MATCHING →" : "NEXT LETTER →"}
          </button>
        </section>
      )}

      {phase === "quiz" && (
        <section className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center justify-center py-6">
          <div className="mb-6 rounded-[2rem] border-[5px] border-[#1A2F33] bg-white/95 px-6 py-4 text-center shadow-[0_8px_0_#1A2F33]">
            <p className="font-fredoka text-sm font-bold uppercase tracking-[0.18em] text-[#008FA6] sm:text-base">
              Sound Match {quizIndex + 1} / {quizOrder.length}
            </p>
            <h1 className="font-fredoka text-2xl font-black text-[#1A2F33] sm:text-4xl">Which letter did you hear?</h1>
            <button
              type="button"
              onClick={replayQuizSound}
              disabled={quizLocked}
              className="mt-3 rounded-full border-4 border-[#1A2F33] bg-[#00B8D4] px-5 py-2 font-fredoka text-lg font-black text-white shadow-[0_5px_0_#1A2F33] disabled:opacity-55"
            >
              🔊 PLAY SOUND
            </button>
          </div>

          <div className="grid w-full max-w-3xl grid-cols-3 gap-3 sm:gap-7">
            {choices.map((letter, index) => {
              const isSelected = selectedLetter === letter;
              const color = feedback === "correct" && isSelected
                ? "bg-[#69F0AE]"
                : feedback === "incorrect" && isSelected
                  ? "bg-[#FF8A80]"
                  : ["bg-[#FFEA00]", "bg-white", "bg-[#9BE7F1]"][index];

              return (
                <motion.button
                  key={letter}
                  type="button"
                  onClick={() => chooseLetter(letter)}
                  disabled={quizLocked}
                  whileHover={quizLocked ? undefined : { y: -9, rotate: index - 1 }}
                  whileTap={quizLocked ? undefined : { y: 4, scale: 0.97 }}
                  className={`flex aspect-[0.76] items-center justify-center rounded-[2rem] border-[6px] border-[#1A2F33] font-fredoka text-7xl font-black uppercase text-[#1A2F33] shadow-[0_12px_0_#1A2F33] transition-colors disabled:cursor-default sm:rounded-[3rem] sm:text-[9rem] ${color}`}
                  aria-label={`Choose letter ${letter}`}
                >
                  {letter}
                </motion.button>
              );
            })}
          </div>

          <p className="mt-7 rounded-full border-4 border-[#1A2F33] bg-white/90 px-5 py-2 text-center font-fredoka text-base font-bold text-[#1A2F33] shadow-[0_5px_0_#1A2F33] sm:text-xl">
            Listen first, then tap one letter card.
          </p>
        </section>
      )}

      <AnimatePresence>
        {phase === "complete" && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="max-w-xl rounded-[3rem] border-[7px] border-[#1A2F33] bg-[#FFEA00] p-8 text-center shadow-[0_14px_0_#1A2F33] sm:p-12"
            >
              <div className="mb-3 text-7xl sm:text-9xl">🏆</div>
              <h2 className="font-fredoka text-4xl font-black text-[#1A2F33] sm:text-6xl">Trail Complete!</h2>
              <p className="mt-3 font-fredoka text-xl font-bold text-[#1A2F33] sm:text-3xl">You matched all 8 letter sounds.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={replayLevel}
                  className="rounded-full border-[5px] border-[#1A2F33] bg-white px-7 py-3 font-fredoka text-xl font-black text-[#1A2F33] shadow-[0_7px_0_#1A2F33]"
                >
                  PLAY AGAIN
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-full border-[5px] border-[#1A2F33] bg-[#00B8D4] px-7 py-3 font-fredoka text-xl font-black text-white shadow-[0_7px_0_#1A2F33]"
                >
                  NEXT LEVEL →
                </button>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
