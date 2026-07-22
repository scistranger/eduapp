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

import forestBg from "../assets/images/cartoon_forest_bg_1784540338051.jpg";

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
  { id: "pineapple-bun", emoji: "🍞", name: "Pineapple Bun", color: "bg-[#FFE69A]" },
  { id: "mushroom", emoji: "🍄", name: "Mushroom", color: "bg-[#E8D8C9]" },
  { id: "peach", emoji: "🍑", name: "Peach", color: "bg-[#FFC9A9]" },
];

const introPrompts = [
  (letter: string) => `Ooh, here comes letter ${letter.toUpperCase()}! Listen carefully, then repeat its sound out loud!`,
  (letter: string) => `Yay, it's ${letter.toUpperCase()}! Hear the sound, then show me how brilliantly you can say it!`,
  (letter: string) => `Look, our next sound friend is ${letter.toUpperCase()}! Listen, then repeat it with your strongest phonics voice!`,
  (letter: string) => `Wonderful, it's ${letter.toUpperCase()}! Hear the sound and say it back out loud!`,
];

const stickerLines = [
  (name: string) => `WOW! You cracked it open and found a ${name} sticker! That's fantastic!`,
  (name: string) => `Hooray! A ${name} sticker popped out! I am so happy for you!`,
  (name: string) => `Amazing! You discovered ${name}! What a brilliant surprise!`,
  (name: string) => `Yes! Your super sound unlocked a ${name} sticker! Wonderful job!`,
];

const repeatPrompts = [
  "Your turn! Say the sound, then tap the orange button.",
  "Say the sound, then tap the orange button.",
  "Now repeat the sound and tap orange.",
  "Your turn—say it, then tap orange!",
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
  "Exactly right! I'm doing a happy dance for you!",
];

const tryAgainLines = [
  "Good try. Let's hear the sound once more.",
  "Almost! Listen again and take another look.",
  "Not this one yet. Your ears get another chance.",
  "Let's try that sound again. You can do it.",
];

type Phase = "intro" | "favorite" | "quiz" | "puzzle" | "complete";

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const buildChoices = (target: string, letterPool: string[]) =>
  shuffle([
    target,
    ...shuffle(letterPool.filter((letter) => letter !== target)).slice(0, 2),
  ]);

function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <img src={forestBg} alt="" className="h-full w-full scale-105 object-cover blur-[3px]" />
      <div className="absolute inset-0 bg-[#113e39]/25" />
    </div>
  );
}

function CollectionRail({
  stickers,
  stars,
  favorite,
  earnedPieces,
  totalRewards,
}: {
  stickers: FoodSticker[];
  stars: number;
  favorite: FoodSticker | null;
  earnedPieces: number[];
  totalRewards: number;
}) {
  return (
    <aside className="flex min-h-0 flex-col rounded-[2rem] border-[5px] border-[#1A2F33] bg-white/95 p-3 shadow-[0_8px_0_#1A2F33] sm:h-full sm:p-4" aria-label="Reward collection">
      <div className="mb-3 flex items-center justify-between gap-2 border-b-4 border-dashed border-[#AAC1C4] pb-3 sm:block sm:text-center">
        <div>
          <p className="font-fredoka text-xs font-bold uppercase tracking-[0.16em] text-[#008FA6] sm:text-sm">My stickers</p>
          <p className="font-fredoka text-lg font-black text-[#1A2F33] sm:text-xl">{stickers.length}/{totalRewards} collected</p>
        </div>
        <div className="rounded-full border-[3px] border-[#1A2F33] bg-[#FFEA00] px-3 py-1 font-fredoka text-lg font-black text-[#1A2F33] shadow-[0_3px_0_#1A2F33] sm:mt-2 sm:inline-flex">
          ⭐ {stars}
        </div>
      </div>

      {favorite && (
        <div className={`mb-3 rounded-2xl border-[3px] border-[#1A2F33] p-2 text-center shadow-[0_3px_0_#1A2F33] ${favorite.color}`}>
          <p className="font-fredoka text-[10px] font-bold uppercase tracking-widest text-[#38545A]">Favorite puzzle</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-4xl">{favorite.emoji}</span>
            <div className="text-left">
              <p className="font-fredoka text-sm font-black text-[#1A2F33]">{favorite.name}</p>
              <p className="font-fredoka text-xs font-bold text-[#38545A]">🧩 {earnedPieces.length}/{totalRewards} pieces</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {Array.from({ length: totalRewards }, (_, index) => (
              <motion.span
                key={index}
                animate={earnedPieces.includes(index) ? { scale: [0.7, 1.15, 1], rotate: [0, -8, 0] } : {}}
                className={`flex aspect-square items-center justify-center rounded-md border-2 border-[#1A2F33] text-sm ${earnedPieces.includes(index) ? "bg-[#69F0AE]" : "bg-white/70 text-[#8DA0A5]"}`}
              >
                {earnedPieces.includes(index) ? "🧩" : "?"}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-2 sm:content-start">
        {Array.from({ length: totalRewards }, (_, index) => {
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

function PuzzleSlice({ sticker, pieceIndex }: { sticker: FoodSticker; pieceIndex: number }) {
  const column = pieceIndex % 2;
  const row = Math.floor(pieceIndex / 2);

  return (
    <div className={`absolute inset-0 overflow-hidden rounded-xl ${sticker.color}`}>
      <span
        className="absolute flex items-center justify-center leading-none"
        style={{
          width: "200%",
          height: "200%",
          left: `-${column * 100}%`,
          top: `-${row * 100}%`,
          fontSize: "clamp(12rem, 38vw, 22rem)",
        }}
        aria-hidden="true"
      >
        {sticker.emoji}
      </span>
      <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1A2F33] bg-white/90 font-fredoka text-[10px] font-black text-[#1A2F33]">
        {pieceIndex + 1}
      </span>
    </div>
  );
}

export function LetterGame({
  onExit,
  onComplete,
  stageNumber,
  letters,
  nextStageName,
}: {
  onExit: () => void;
  onComplete: (result: { stars: number; stickers: FoodSticker[] }) => void;
  stageNumber: 1 | 2;
  letters: string[];
  nextStageName: string;
}) {
  const puzzlePieceCount = letters.length;
  const [phase, setPhase] = useState<Phase>("intro");
  const [introIndex, setIntroIndex] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const [hasRepeated, setHasRepeated] = useState(false);
  const [isCracked, setIsCracked] = useState(false);
  const [stickerDeck] = useState(() => shuffle(foodStickers));
  const [stickers, setStickers] = useState<FoodSticker[]>([]);
  const [newSticker, setNewSticker] = useState<FoodSticker | null>(null);
  const [favoriteSticker, setFavoriteSticker] = useState<FoodSticker | null>(null);
  const [favoriteLocked, setFavoriteLocked] = useState(false);
  const [stars, setStars] = useState(0);
  const [earnedPieces, setEarnedPieces] = useState<number[]>([]);
  const [pieceOrder] = useState(() => shuffle(Array.from({ length: puzzlePieceCount }, (_, index) => index)));
  const [placedPieces, setPlacedPieces] = useState<number[]>([]);
  const [activePiece, setActivePiece] = useState<number | null>(null);
  const [puzzleLocked, setPuzzleLocked] = useState(false);
  const [quizOrder] = useState(() => shuffle(letters));
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizLocked, setQuizLocked] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [rewardPieceIndex, setRewardPieceIndex] = useState<number | null>(null);
  const previousPrompt = useRef<string | null>(null);
  const previousPraise = useRef<string | null>(null);
  const previousTryAgain = useRef<string | null>(null);
  const slotRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const introLetter = letters[introIndex];
  const quizTarget = quizOrder[quizIndex];
  const choices = useMemo(() => buildChoices(quizTarget, letters), [letters, quizTarget]);

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

    if (introIndex < letters.length - 1) {
      setIsCracked(false);
      setHasRepeated(false);
      setNewSticker(null);
      setIntroIndex((index) => index + 1);
      return;
    }

    await speakText("WOW! You collected all four stickers! Now choose your favorite one. It will become your special quiz puzzle!", 0.98, 1.22);
    setPhase("favorite");
  };

  const chooseFavoriteSticker = async (sticker: FoodSticker) => {
    if (favoriteLocked) return;
    setFavoriteLocked(true);
    setFavoriteSticker(sticker);
    await playRewardSound();
    const spokenName = sticker.id === "pineapple-bun" ? "pineapple bun" : sticker.name;
    await speakText(`Excellent choice! Your ${spokenName} sticker is now a four-piece puzzle. Earn one piece for every correct sound!`, 0.98, 1.22);
    setPhase("quiz");
    setFavoriteLocked(false);
  };

  const confirmRepeatedSound = async () => {
    if (!introReady || hasRepeated || isCracked) return;
    setIntroReady(false);
    setHasRepeated(true);
    await speakText("YES! I heard your super phonics voice! Now tap the card and crack it right down the middle!", 1.02, 1.26);
    setIntroReady(true);
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
      const nextPieces = [...earnedPieces, quizIndex];
      setStars(nextStars);
      setEarnedPieces(nextPieces);
      setFeedback("correct");
      setRewardPieceIndex(quizIndex);
      await playRewardSound();
      const line = pickFreshLine(correctLines, previousPraise.current);
      previousPraise.current = line;
      await speakText(`${line} You also earned piece ${quizIndex + 1} of your ${favoriteSticker?.name || "favorite sticker"} puzzle!`, 0.98, 1.22);
      await new Promise((resolve) => setTimeout(resolve, 650));

      if (quizIndex === quizOrder.length - 1) {
        setRewardPieceIndex(null);
        await playRewardSound();
        await speakText("You earned all four puzzle pieces! Now drag each piece into the empty frame to rebuild your favorite sticker!", 0.96, 1.2);
        setPhase("puzzle");
        return;
      }

      setRewardPieceIndex(null);
      setFeedback(null);
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

  const placePuzzlePiece = async (pieceIndex: number) => {
    if (puzzleLocked || placedPieces.includes(pieceIndex)) return;
    setPuzzleLocked(true);
    const nextPlaced = [...placedPieces, pieceIndex];
    setPlacedPieces(nextPlaced);
    setActivePiece(null);
    await playRewardSound();

    if (nextPlaced.length === puzzlePieceCount) {
      setPhase("complete");
      await speakText(`You completed the ${favoriteSticker?.name || "sticker"} puzzle! Stage ${stageNumber} is complete, and ${nextStageName} is ready for you!`, 0.98, 1.22);
      await new Promise((resolve) => setTimeout(resolve, 1400));
      onComplete({ stars, stickers });
      return;
    }

    await speakText(`Perfect fit! ${puzzlePieceCount - nextPlaced.length} puzzle pieces to go.`, 1.0, 1.2);
    setPuzzleLocked(false);
  };

  const handlePieceDrop = (pieceIndex: number, x: number, y: number) => {
    const targetIndex = slotRefs.current.findIndex((slot) => {
      if (!slot) return false;
      const rect = slot.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });

    if (targetIndex === pieceIndex) {
      void placePuzzlePiece(pieceIndex);
    }
  };

  const handleSlotTap = (slotIndex: number) => {
    if (activePiece === slotIndex) void placePuzzlePiece(slotIndex);
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
          ← STAGES
        </button>
        <div className="rounded-full border-4 border-[#1A2F33] bg-[#FFEA00] px-4 py-2 text-center font-fredoka text-base font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33] sm:px-7 sm:text-xl">
          STAGE {stageNumber} · {phase === "intro" ? "LETTER SOUND TRAIL" : phase === "favorite" ? "CHOOSE A FAVORITE" : phase === "quiz" ? "PUZZLE PIECE QUIZ" : phase === "puzzle" ? "BUILD YOUR PUZZLE" : "COMPLETE"}
        </div>
      </header>

      <div className="relative z-10 mx-auto mt-3 grid min-h-0 w-full max-w-7xl flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        {phase === "intro" && (
          <section className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-[5px] border-[#1A2F33] bg-white/80 p-3 shadow-[0_8px_0_#1A2F33] sm:p-5">
            <div className="mb-3 flex gap-1.5" aria-label={`Letter ${introIndex + 1} of ${letters.length}`}>
              {letters.map((letter, index) => (
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
                  : "Listen. Say the sound. Tap orange."}
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
              {!isCracked ? (
                <motion.span
                  initial={{ scale: 0.96 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center rounded-[2.8rem] border-[7px] border-[#1A2F33] bg-[#FFEA00] font-fredoka text-[9rem] font-black uppercase leading-none text-[#1A2F33] shadow-[0_12px_0_#1A2F33] sm:text-[11rem]"
                  aria-hidden="true"
                >
                  {introLetter}
                </motion.span>
              ) : (
                <>
                  <motion.span
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    animate={{ x: -112, y: 12, rotate: -11 }}
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
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    animate={{ x: 112, y: 12, rotate: 11 }}
                    transition={{ type: "spring", stiffness: 180, damping: 14 }}
                    className="absolute inset-y-0 right-0 block w-[53%] overflow-hidden border-[7px] border-[#1A2F33] bg-[#FFEA00] shadow-[0_12px_0_#1A2F33]"
                    style={{ clipPath: "polygon(11% 0, 100% 0, 100% 100%, 10% 100%, 0 86%, 15% 72%, 0 57%, 16% 42%, 0 27%, 14% 13%)", borderRadius: "0.5rem 2.8rem 2.8rem 0.5rem" }}
                    aria-hidden="true"
                  >
                    <span className="absolute inset-y-0 right-0 flex w-[188%] items-center justify-center font-fredoka text-[9rem] font-black uppercase leading-none text-[#1A2F33] sm:text-[11rem]">
                      {introLetter}
                    </span>
                  </motion.span>
                </>
              )}

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
              {!hasRepeated && !isCracked && (
                <>
                  <button
                    type="button"
                    onClick={replayIntroSound}
                    className="rounded-full border-4 border-[#1A2F33] bg-[#00B8D4] px-5 py-3 font-fredoka text-lg font-black text-white shadow-[0_5px_0_#1A2F33]"
                  >
                    🔊 HEAR AGAIN
                  </button>
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
                </>
              )}
            </div>
          </section>
        )}

        {phase === "favorite" && (
          <section className="flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-[5px] border-[#1A2F33] bg-white/90 p-4 shadow-[0_8px_0_#1A2F33] sm:p-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-2 text-6xl">💖</motion.div>
            <h1 className="text-center font-fredoka text-3xl font-black text-[#1A2F33] sm:text-4xl">Which sticker is your favorite?</h1>
            <p className="mb-5 mt-2 text-center font-andika text-base font-bold text-[#38545A] sm:text-xl">Tap one sticker. It will become the puzzle you earn during the quiz!</p>
            <div className="grid w-full max-w-3xl grid-cols-4 gap-3 sm:gap-4">
              {stickers.map((sticker) => (
                <motion.button
                  key={sticker.id}
                  type="button"
                  onClick={() => void chooseFavoriteSticker(sticker)}
                  disabled={favoriteLocked}
                  whileHover={favoriteLocked ? undefined : { y: -7, rotate: -2 }}
                  whileTap={favoriteLocked ? undefined : { scale: 0.94 }}
                  className={`flex min-h-28 touch-manipulation flex-col items-center justify-center rounded-[1.8rem] border-[5px] border-[#1A2F33] p-2 shadow-[0_7px_0_#1A2F33] sm:min-h-36 ${sticker.color} ${favoriteSticker?.id === sticker.id ? "ring-8 ring-[#69F0AE]" : ""}`}
                  aria-label={`Choose ${sticker.name} as favorite`}
                >
                  <span className="text-5xl sm:text-7xl">{sticker.emoji}</span>
                  <span className="mt-2 max-w-full truncate font-fredoka text-xs font-black text-[#1A2F33] sm:text-base">{sticker.name}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {phase === "quiz" && (
          <section className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-[5px] border-[#1A2F33] bg-white/80 p-3 shadow-[0_8px_0_#1A2F33] sm:p-5">
            <div className="mb-4 rounded-[2rem] border-4 border-[#1A2F33] bg-white px-5 py-3 text-center shadow-[0_5px_0_#1A2F33]">
              <p className="font-fredoka text-sm font-bold uppercase tracking-[0.16em] text-[#008FA6]">Star Challenge {quizIndex + 1}/{quizOrder.length}</p>
              <h1 className="font-fredoka text-2xl font-black text-[#1A2F33] sm:text-3xl">Which letter did you hear?</h1>
              {favoriteSticker && (
                <p className="mt-1 font-fredoka text-sm font-black text-[#16834B] sm:text-base">
                  {favoriteSticker.emoji} Puzzle pieces: {earnedPieces.length}/{puzzlePieceCount}
                </p>
              )}
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
            <AnimatePresence>
              {rewardPieceIndex !== null && favoriteSticker && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 flex items-center justify-center bg-[#173D3A]/50 p-4 backdrop-blur-[2px]"
                >
                  <motion.div
                    initial={{ scale: 0.45, y: 80, rotate: -8 }}
                    animate={{ scale: 1, y: 0, rotate: 0 }}
                    exit={{ scale: 0.65, y: -50, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.55 }}
                    className="relative flex w-full max-w-md flex-col items-center rounded-[2.5rem] border-[6px] border-[#1A2F33] bg-white px-6 py-5 text-center shadow-[0_12px_0_#1A2F33]"
                  >
                    <motion.span animate={{ scale: [1, 1.35, 1], rotate: [0, 12, -8, 0] }} transition={{ duration: 0.9 }} className="text-6xl" aria-hidden="true">⭐</motion.span>
                    <h2 className="mt-1 font-fredoka text-4xl font-black text-[#16834B] sm:text-5xl">CORRECT!</h2>
                    <p className="mt-1 font-fredoka text-lg font-black text-[#1A2F33] sm:text-xl">Correct answer → puzzle reward</p>
                    <motion.div
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: 1, rotate: [0, 7, 0] }}
                      transition={{ delay: 0.2, type: "spring", bounce: 0.65 }}
                      className="relative mt-4 h-32 w-32 overflow-hidden rounded-2xl border-[5px] border-[#1A2F33] shadow-[0_7px_0_#1A2F33] sm:h-40 sm:w-40"
                    >
                      <PuzzleSlice sticker={favoriteSticker} pieceIndex={rewardPieceIndex} />
                    </motion.div>
                    <p className="mt-4 rounded-full border-[3px] border-[#1A2F33] bg-[#FFEA00] px-5 py-2 font-fredoka text-xl font-black text-[#1A2F33] shadow-[0_4px_0_#1A2F33]">
                      Puzzle piece {rewardPieceIndex + 1} of {puzzlePieceCount} earned!
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {phase === "puzzle" && favoriteSticker && (
          <section className="flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-[5px] border-[#1A2F33] bg-white/90 p-3 shadow-[0_8px_0_#1A2F33] sm:p-5">
            <div className="mb-3 text-center">
              <h1 className="font-fredoka text-2xl font-black text-[#1A2F33] sm:text-4xl">Build Your {favoriteSticker.name} Puzzle!</h1>
              <p className="mt-1 font-andika text-sm font-bold text-[#38545A] sm:text-lg">Drag each piece into its matching space. You can also tap a piece, then tap its space.</p>
            </div>

            <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="w-full rounded-[2rem] border-[7px] border-[#1A2F33] bg-[#DDEBED] p-2 shadow-[0_10px_0_#1A2F33] sm:p-3">
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2" aria-label="Empty puzzle frame">
                {Array.from({ length: puzzlePieceCount }, (_, pieceIndex) => {
                  const isPlaced = placedPieces.includes(pieceIndex);
                  const isTargeted = activePiece === pieceIndex;
                  return (
                    <button
                      key={pieceIndex}
                      ref={(element) => { slotRefs.current[pieceIndex] = element; }}
                      type="button"
                      onClick={() => handleSlotTap(pieceIndex)}
                      className={`relative aspect-square overflow-hidden rounded-xl border-[3px] border-[#1A2F33] ${isPlaced ? "bg-white" : isTargeted ? "bg-[#FFF3A5] ring-4 ring-[#FF9F68]" : "border-dashed bg-white/70"}`}
                      aria-label={isPlaced ? `Puzzle space ${pieceIndex + 1}, filled` : `Puzzle space ${pieceIndex + 1}, empty`}
                    >
                      {isPlaced ? (
                        <motion.div initial={{ scale: 0.65 }} animate={{ scale: 1 }} className="absolute inset-0">
                          <PuzzleSlice sticker={favoriteSticker} pieceIndex={pieceIndex} />
                        </motion.div>
                      ) : (
                        <span className="font-fredoka text-xl font-black text-[#8DA0A5] sm:text-3xl">{pieceIndex + 1}</span>
                      )}
                    </button>
                  );
                })}
                </div>
              </div>

              <div className="w-full rounded-[2rem] border-[7px] border-dashed border-[#1A2F33] bg-white/75 p-2 shadow-[0_10px_0_#1A2F33] sm:p-3" aria-label="Puzzle pieces tray">
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {pieceOrder.map((pieceIndex) => {
                  const isAvailable = earnedPieces.includes(pieceIndex) && !placedPieces.includes(pieceIndex);

                  return isAvailable ? (
                    <motion.button
                      key={pieceIndex}
                      type="button"
                      drag={!puzzleLocked}
                      dragMomentum={false}
                      dragSnapToOrigin
                      whileDrag={{ scale: 1.12, zIndex: 50 }}
                      onClick={() => setActivePiece(pieceIndex)}
                      onDragEnd={(_, info) => handlePieceDrop(pieceIndex, info.point.x, info.point.y)}
                      disabled={puzzleLocked}
                      className={`relative aspect-square w-full touch-none overflow-hidden rounded-xl border-[3px] border-[#1A2F33] ${activePiece === pieceIndex ? "ring-4 ring-[#FF9F68]" : ""}`}
                      aria-label={`Puzzle piece ${pieceIndex + 1}. Drag it to space ${pieceIndex + 1}`}
                    >
                      <PuzzleSlice sticker={favoriteSticker} pieceIndex={pieceIndex} />
                    </motion.button>
                  ) : (
                    <div key={pieceIndex} className="aspect-square w-full rounded-xl border-[3px] border-dashed border-[#AAC1C4] bg-white/30" aria-hidden="true" />
                  );
                })}
                </div>
                {placedPieces.length === puzzlePieceCount && <span className="mt-3 block text-center font-fredoka text-2xl font-black text-[#16834B]">Puzzle complete!</span>}
              </div>
            </div>
          </section>
        )}

        {phase === "complete" && (
          <section className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-[6px] border-[#1A2F33] bg-[#FFEA00] p-6 text-center shadow-[0_10px_0_#1A2F33]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">🧩</motion.div>
            <h2 className="mt-2 font-fredoka text-4xl font-black text-[#1A2F33] sm:text-5xl">Puzzle Complete!</h2>
            <p className="mt-3 font-fredoka text-xl font-bold text-[#1A2F33]">You rebuilt your {favoriteSticker?.name} sticker and earned {stars} stars. Returning to the map…</p>
          </section>
        )}

        <CollectionRail stickers={stickers} stars={stars} favorite={favoriteSticker} earnedPieces={earnedPieces} totalRewards={puzzlePieceCount} />
      </div>
    </main>
  );
}
