import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  initAudio,
  pickFreshLine,
  playCrackRewardSound,
  playPhoneme,
  playRewardSound,
  speakText,
} from "../utils/audio";
import { BearHost } from "./BearHost";

import forestBg from "../assets/images/cartoon_forest_bg_1784540338051.jpg";

const learningLetters = ["b", "m", "r", "f", "h", "a", "t", "c"];

export type FoodSticker = {
  id: string;
  emoji: string;
  name: string;
  color: string;
};

const foodStickers: FoodSticker[] = [
  { id: "popcorn", emoji: "🍿", name: "Popcorn", color: "bg-[#FFF3A5]" },
  { id: "candy", emoji: "🍬", name: "Candy", color: "bg-[#FFC1E3]" },
  { id: "biscuit", emoji: "🍪", name: "Biscuit", color: "bg-[#FFD29D]" },
  { id: "chocolate", emoji: "🍫", name: "Chocolate", color: "bg-[#D6B08B]" },
  { id: "cookie", emoji: "🍪", name: "Cookie", color: "bg-[#F6C77E]" },
  { id: "strawberry", emoji: "🍓", name: "Strawberry", color: "bg-[#FFB4AE]" },
  { id: "pineapple-bun", emoji: "🍞", name: "菠蘿包", color: "bg-[#FFE69A]" },
  { id: "mushroom", emoji: "🍄", name: "Mushroom", color: "bg-[#E8D8C9]" },
  { id: "peach", emoji: "🍑", name: "Peach", color: "bg-[#FFC9A9]" },
];

const introPrompts = [
  (letter: string) => `Ooh, here comes letter ${letter.toUpperCase()}! Listen carefully, then repeat its sound out loud!`,
  (letter: string) => `Yay, it's ${letter.toUpperCase()}! Hear the sound, then show Benny Bear how brilliantly you can say it!`,
  (letter: string) => `Look, our next sound friend is ${letter.toUpperCase()}! Listen, then repeat it with your strongest phonics voice!`,
  (letter: string) => `Wonderful, it's ${letter.toUpperCase()}! Hear the sound and say it back out loud for Benny Bear!`,
];

const stickerLines = [
  (name: string) => `WOW! You cracked it open and found a ${name} sticker! That's fantastic!`,
  (name: string) => `Hooray! A ${name} sticker popped out! I am so happy for you!`,
  (name: string) => `Amazing! You discovered ${name}! What a brilliant surprise!`,
  (name: string) => `Yes! Your super sound unlocked a ${name} sticker! Wonderful job!`,
];

const repeatPrompts = [
  "Your turn! Say that sound out loud, then tap the orange button. I can't wait to hear you!",
  "Now you try! Repeat the sound with your best phonics voice, then tell me you said it!",
  "Let's hear your amazing voice! Say the sound out loud, then tap “I said the sound!”",
  "Benny Bear is listening! Repeat that sound proudly, then tap the orange button!",
];

const quizPrompts = [
  "Listen closely. Which card matches this sound?",
  "Can your ears find this sound? Choose one card.",
  "Here comes a sound. Tap the letter that belongs to it.",
  "Sound detective, which letter did you hear?",
];

const correctLines = [
  "YES! You found it! I am so proud of you—here comes a bright star!",
  "Hooray, that's the one! Your wonderful listening earned another star!",
  "You got it! That was absolutely brilliant—your star trail is sparkling!",
  "WOW! You caught that sound perfectly and won a beautiful star!",
  "Exactly right! Benny Bear is doing a happy dance for you!",
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

function CollectionRail({ stickers, stars }: { stickers: FoodSticker[]; stars: number }) {
  return (
    <aside className="flex min-h-0 flex-col rounded-[2rem] border-[5px] border-[#1A2F33] bg-white/95 p-3 shadow-[0_8px_0_#1A2F33] sm:h-full sm:p-4" aria-label="Reward collection">
      <div className="mb-3 flex items-center justify-between gap-2 border-b-4 border-dashed border-[#AAC1C4] pb-3 sm:block sm:text-center">
        <div>
          <p className="font-fredoka text-xs font-bold uppercase tracking-[0.16em] text-[#008FA6] sm:text-sm">My stickers</p>
          <p className="font-fredoka text-lg font-black text-[#1A2F33] sm:text-xl">{stickers.length}/{learningLetters.length} collected</p>
        </div>
        <div className="rounded-full border-[3px] border-[#1A2F33] bg-[#FFEA00] px-3 py-1 font-fredoka text-lg font-black text-[#1A2F33] shadow-[0_3px_0_#1A2F33] sm:mt-2 sm:inline-flex">
          ⭐ {stars}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-2 sm:content-start">
        {Array.from({ length: learningLetters.length }, (_, index) => {
          const sticker = stickers[index];
          return sticker ? (
            <motion.div
              key={sticker.id}
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border-[3px] border-[#1A2F33] p-1 text-center shadow-[0_3px_0_#1A2F33] ${sticker.color}`}
              title={sticker.name}
            >
              <span className="text-3xl leading-none sm:text-4xl">{sticker.emoji}</span>
              <span className="mt-1 max-w-full truncate font-fredoka text-[9px] font-bold text-[#1A2F33] sm:text-[11px]">{sticker.name}</span>
            </motion.div>
          ) : (
            <div key={`empty-${index}`} className="flex min-h-16 items-center justify-center rounded-2xl border-[3px] border-dashed border-[#8DA0A5] bg-[#EAF0F1] font-fredoka text-2xl font-black text-[#8DA0A5]">
              ?
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function LetterGame({
  onExit,
  onComplete,
}: {
  onExit: () => void;
  onComplete: (result: { stars: number; stickers: FoodSticker[] }) => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [introIndex, setIntroIndex] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const [hasRepeated, setHasRepeated] = useState(false);
  const [isCracked, setIsCracked] = useState(false);
  const [stickerDeck] = useState(() => shuffle(foodStickers));
  const [stickers, setStickers] = useState<FoodSticker[]>([]);
  const [newSticker, setNewSticker] = useState<FoodSticker | null>(null);
  const [stars, setStars] = useState(0);
  const [quizOrder] = useState(() => shuffle(learningLetters));
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
      await speakText(repeatPrompts[introIndex % repeatPrompts.length], 1.0, 1.23);
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

  const crackCard = async () => {
    if (!introReady || !hasRepeated || isCracked) return;
    initAudio();
    setIntroReady(false);
    setIsCracked(true);
    const sticker = stickerDeck[introIndex];
    setNewSticker(sticker);
    setStickers((current) => [...current, sticker]);
    await playCrackRewardSound();
    const line = pickFreshLine(stickerLines.map((builder) => builder(sticker.name)));
    await speakText(line, 0.98, 1.2);
  };

  const confirmRepeatedSound = async () => {
    if (!introReady || hasRepeated || isCracked) return;
    setIntroReady(false);
    setHasRepeated(true);
    await speakText("YES! I heard your super phonics voice! Now tap the card and crack it right down the middle!", 1.02, 1.26);
    setIntroReady(true);
  };

  const moveFromIntro = async () => {
    if (!isCracked) return;

    if (introIndex < learningLetters.length - 1) {
      setIsCracked(false);
      setHasRepeated(false);
      setNewSticker(null);
      setIntroIndex((index) => index + 1);
      return;
    }

    await speakText("Your sticker bar is full! Now every correct sound match earns a star.", 0.96, 1.18);
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
      const nextStars = stars + 1;
      setStars(nextStars);
      setFeedback("correct");
      await playRewardSound();
      const line = pickFreshLine(correctLines, previousPraise.current);
      previousPraise.current = line;
      await speakText(line, 0.98, 1.22);

      if (quizIndex === quizOrder.length - 1) {
        setPhase("complete");
        await playRewardSound();
        await speakText(`Level one complete! You collected ${nextStars} stars. Let's return to the map and open level two.`, 0.96, 1.2);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        onComplete({ stars: nextStars, stickers });
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

  return (
    <main className="relative flex h-screen min-h-[680px] w-full flex-col overflow-hidden px-3 py-3 font-body sm:px-6 sm:py-5">
      <Background />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
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

      <div className="relative z-10 mx-auto mt-3 grid min-h-0 w-full max-w-7xl flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        {phase === "intro" && (
          <section className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-[5px] border-[#1A2F33] bg-white/80 p-3 shadow-[0_8px_0_#1A2F33] sm:p-5">
            <div className="mb-3 flex gap-1.5" aria-label={`Letter ${introIndex + 1} of ${learningLetters.length}`}>
              {learningLetters.map((letter, index) => (
                <span
                  key={letter}
                  className={`h-3 w-7 rounded-full border-2 border-[#1A2F33] sm:w-10 ${index <= introIndex ? "bg-[#FFEA00]" : "bg-white"}`}
                />
              ))}
            </div>

            <p className="mb-2 text-center font-fredoka text-lg font-black text-[#1A2F33] sm:text-2xl">
              {isCracked
                ? "Sticker collected—amazing!"
                : hasRepeated
                  ? "Great speaking! Now tap the card to crack it!"
                  : "1. Listen  2. Repeat the sound out loud  3. Crack the card"}
            </p>

            <motion.button
              key={introLetter}
              type="button"
              onClick={crackCard}
              disabled={!introReady || !hasRepeated || isCracked}
              initial={{ scale: 0.55, y: 40, rotate: -7 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.55 }}
              whileTap={!introReady || !hasRepeated || isCracked ? undefined : { scale: 0.92 }}
              className="relative h-56 w-44 touch-manipulation overflow-visible disabled:cursor-default sm:h-64 sm:w-52"
              aria-label={isCracked ? `Letter ${introLetter}, split open` : `Tap letter ${introLetter} to split the card open`}
            >
              <motion.span
                animate={isCracked ? { x: -112, y: 12, rotate: -11 } : { x: 0, y: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
                className="absolute inset-y-0 left-0 block w-[53%] overflow-hidden border-[7px] border-[#1A2F33] bg-[#FFEA00] shadow-[0_12px_0_#1A2F33]"
                style={{ clipPath: "polygon(0 0, 100% 0, 86% 13%, 100% 27%, 84% 42%, 100% 57%, 85% 72%, 100% 86%, 89% 100%, 0 100%)", borderRadius: "2.8rem 0.5rem 0.5rem 2.8rem" }}
                aria-hidden="true"
              >
                <span className="absolute inset-y-0 left-0 flex w-[188%] items-center justify-center font-fredoka text-[9rem] font-black uppercase leading-none text-[#1A2F33] sm:text-[11rem]">
                  {introLetter}
                </span>
              </motion.span>
              <motion.span
                animate={isCracked ? { x: 112, y: 12, rotate: 11 } : { x: 0, y: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
                className="absolute inset-y-0 right-0 block w-[53%] overflow-hidden border-[7px] border-[#1A2F33] bg-[#FFEA00] shadow-[0_12px_0_#1A2F33]"
                style={{ clipPath: "polygon(11% 0, 100% 0, 100% 100%, 10% 100%, 0 86%, 15% 72%, 0 57%, 16% 42%, 0 27%, 14% 13%)", borderRadius: "0.5rem 2.8rem 2.8rem 0.5rem" }}
                aria-hidden="true"
              >
                <span className="absolute inset-y-0 right-0 flex w-[188%] items-center justify-center font-fredoka text-[9rem] font-black uppercase leading-none text-[#1A2F33] sm:text-[11rem]">
                  {introLetter}
                </span>
              </motion.span>

              <AnimatePresence>
                {newSticker && (
                  <motion.span
                    initial={{ scale: 0, rotate: -35 }}
                    animate={{ scale: 1, rotate: 8 }}
                    transition={{ delay: 0.14, type: "spring", bounce: 0.72 }}
                    className={`absolute inset-0 z-20 m-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border-[5px] border-[#1A2F33] text-7xl shadow-[0_8px_0_#1A2F33] sm:h-36 sm:w-36 sm:text-8xl ${newSticker.color}`}
                  >
                    {newSticker.emoji}
                    <span className="mt-1 max-w-[90%] truncate font-fredoka text-xs font-black normal-case text-[#1A2F33]">{newSticker.name}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={replayIntroSound}
                className="rounded-full border-4 border-[#1A2F33] bg-[#00B8D4] px-5 py-3 font-fredoka text-lg font-black text-white shadow-[0_5px_0_#1A2F33]"
              >
                🔊 HEAR AGAIN
              </button>
              {!hasRepeated && !isCracked && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  type="button"
                  onClick={confirmRepeatedSound}
                  disabled={!introReady}
                  className="rounded-full border-4 border-[#1A2F33] bg-[#FF9F68] px-6 py-3 font-fredoka text-lg font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33] disabled:opacity-50"
                >
                  🗣️ I SAID THE SOUND!
                </motion.button>
              )}
              {isCracked && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  type="button"
                  onClick={moveFromIntro}
                  className="rounded-full border-4 border-[#1A2F33] bg-[#69F0AE] px-6 py-3 font-fredoka text-lg font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33]"
                >
                  {introIndex === learningLetters.length - 1 ? "START STAR QUIZ →" : "NEXT LETTER →"}
                </motion.button>
              )}
            </div>
            <BearHost
              compact
              className="bottom-0"
              message={isCracked ? "WOW! A sticker! You were amazing!" : hasRepeated ? "Fantastic voice! Tap the card and split it open!" : "Say the sound out loud, then tap “I SAID THE SOUND!”"}
            />
          </section>
        )}

        {phase === "quiz" && (
          <section className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-[5px] border-[#1A2F33] bg-white/80 p-3 shadow-[0_8px_0_#1A2F33] sm:p-5">
            <div className="mb-4 rounded-[2rem] border-4 border-[#1A2F33] bg-white px-5 py-3 text-center shadow-[0_5px_0_#1A2F33]">
              <p className="font-fredoka text-sm font-bold uppercase tracking-[0.16em] text-[#008FA6]">Star Challenge {quizIndex + 1}/{quizOrder.length}</p>
              <h1 className="font-fredoka text-2xl font-black text-[#1A2F33] sm:text-3xl">Which letter did you hear?</h1>
              <button
                type="button"
                onClick={replayQuizSound}
                disabled={quizLocked}
                className="mt-2 rounded-full border-[3px] border-[#1A2F33] bg-[#00B8D4] px-5 py-2 font-fredoka text-base font-black text-white shadow-[0_3px_0_#1A2F33] disabled:opacity-55"
              >
                🔊 PLAY SOUND
              </button>
            </div>

            <div className="grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-5">
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
                    whileHover={quizLocked ? undefined : { y: -7, rotate: index - 1 }}
                    whileTap={quizLocked ? undefined : { y: 4, scale: 0.97 }}
                    className={`flex aspect-[0.8] touch-manipulation items-center justify-center rounded-[2rem] border-[6px] border-[#1A2F33] font-fredoka text-7xl font-black uppercase text-[#1A2F33] shadow-[0_10px_0_#1A2F33] transition-colors disabled:cursor-default sm:text-[8rem] ${color}`}
                    aria-label={`Choose letter ${letter}`}
                  >
                    {letter}
                  </motion.button>
                );
              })}
            </div>
            <BearHost
              compact
              className="bottom-0"
              message={feedback === "correct" ? "YES! You got it! I'm doing my happy dance!" : `You're doing brilliantly—${stars} star${stars === 1 ? "" : "s"} already!`}
            />
          </section>
        )}

        {phase === "complete" && (
          <section className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-[6px] border-[#1A2F33] bg-[#FFEA00] p-6 text-center shadow-[0_10px_0_#1A2F33]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">⭐</motion.div>
            <h2 className="mt-2 font-fredoka text-4xl font-black text-[#1A2F33] sm:text-5xl">Level 1 Complete!</h2>
            <p className="mt-3 font-fredoka text-xl font-bold text-[#1A2F33]">You earned {stars} stars. Returning to the map…</p>
            <BearHost compact className="bottom-0" message="You did it! I am SO happy for you!" />
          </section>
        )}

        <CollectionRail stickers={stickers} stars={stars} />
      </div>
    </main>
  );
}
