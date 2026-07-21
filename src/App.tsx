/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { PhonicsGame } from "./components/PhonicsGame";
import { LetterGame, type FoodSticker } from "./components/LetterGame";
import { initAudio, pickFreshLine, speakText } from "./utils/audio";

import forestBg from "./assets/images/cartoon_forest_bg_1784540338051.jpg";
import dogImg from "./assets/images/dog_closeup_holding_card_solid_1784547773486.jpg";

type PlayStage = "letters-1" | "letters-2" | "vocabulary";
type AppScreen = "landing" | "levels" | PlayStage;

const stageOneLetters = ["b", "m", "r", "f"];
const stageTwoLetters = ["h", "a", "t", "c"];

const levelWelcomeLines = [
  "Hooray, you're here! I am so excited to learn sounds with you!",
  "Yay! The forest is ready, and I can hardly wait to hear your amazing sounds!",
  "Hello, phonics superstar! Let's begin our sound adventure!",
];

function ForestBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <img
        src={forestBg}
        alt=""
        className="h-full w-full scale-105 object-cover blur-[3px]"
      />
      <div className="absolute inset-0 bg-[#153a30]/20" />
    </div>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 font-body">
      <ForestBackground />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex max-w-4xl flex-col items-center text-center"
      >
        <p className="mb-3 rounded-full border-4 border-[#1A2F33] bg-white/90 px-5 py-2 font-fredoka text-lg font-bold text-[#1A2F33] shadow-[0_5px_0_#1A2F33] sm:text-2xl">
          Listen • Learn • Play
        </p>
        <h1
          className="mb-10 w-full text-center font-display text-6xl font-bold tracking-widest text-white drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] sm:text-[80px]"
          style={{
            WebkitTextStroke: "6px #1A2F33",
            paintOrder: "stroke fill",
            textShadow: "0 6px 0 #1A2F33, 0 10px 15px rgba(0,0,0,0.5)",
          }}
        >
          Phonics Forest
        </h1>
        <button
          type="button"
          onClick={onStart}
          className="flex h-[100px] items-center justify-center rounded-[3rem] border-[6px] border-[#1A2F33] bg-[#00B8D4] px-16 py-6 font-fredoka text-3xl font-black tracking-wide text-white shadow-[0_12px_0_#1A2F33] transition-all hover:translate-y-2 hover:shadow-[0_4px_0_#1A2F33] active:translate-y-4 active:shadow-none sm:text-5xl"
        >
          START
        </button>
      </motion.div>
    </main>
  );
}

function LevelMap({
  onChoose,
  stageOneComplete,
  stageTwoComplete,
  stars,
  stickerCount,
  autoLaunching,
}: {
  onChoose: (stage: PlayStage) => void;
  stageOneComplete: boolean;
  stageTwoComplete: boolean;
  stars: number;
  stickerCount: number;
  autoLaunching: 2 | 3 | null;
}) {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden px-4 py-6 font-body sm:px-8 sm:py-8">
      <ForestBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-7 rounded-[2rem] border-[5px] border-[#1A2F33] bg-white/95 px-6 py-4 text-center shadow-[0_8px_0_#1A2F33]"
        >
          <p className="font-fredoka text-sm font-bold uppercase tracking-[0.25em] text-[#008FA6] sm:text-base">
            Choose your path
          </p>
          <h1 className="font-fredoka text-3xl font-black text-[#1A2F33] sm:text-5xl">
            Forest Stages
          </h1>
          {(stageOneComplete || stageTwoComplete) && (
            <p className="mt-2 font-fredoka text-base font-black text-[#16834B] sm:text-lg">
              ⭐ {stars} stars · 🎟️ {stickerCount} stickers collected
            </p>
          )}
        </motion.header>

        <section className="relative grid w-full gap-7 pb-8 sm:grid-cols-2 lg:grid-cols-3" aria-label="Phonics game stages">

          <motion.button
            type="button"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ y: -8, rotate: -1 }}
            whileTap={{ y: 2, scale: 0.99 }}
            onClick={() => onChoose("letters-1")}
            className="group relative overflow-hidden rounded-[2.5rem] border-[6px] border-[#1A2F33] bg-[#FFF7B8] p-4 text-left shadow-[0_12px_0_#1A2F33]"
          >
            <span className="absolute left-3 top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#1A2F33] bg-[#FFEA00] font-fredoka text-3xl font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33]">
              1
            </span>
            <div className="relative mb-4 flex h-48 items-end justify-center overflow-hidden rounded-[2rem] border-4 border-[#1A2F33] bg-[#9BE7F1] sm:h-56">
              <img src={dogImg} alt="Friendly dog holding a phonics card" className="absolute bottom-0 left-1/2 h-[95%] -translate-x-1/2 object-cover object-top opacity-45" />
              <div className="relative z-10 mb-5 grid grid-cols-4 gap-2">
                {stageOneLetters.map((letter, index) => (
                  <span
                    key={letter}
                    className={`flex h-14 w-12 items-center justify-center rounded-xl border-[3px] border-[#1A2F33] font-fredoka text-3xl font-black uppercase text-[#1A2F33] shadow-[0_4px_0_#1A2F33] ${index % 2 ? "bg-white" : "bg-[#FFEA00]"}`}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-2 pb-2">
              <p className="mb-1 font-fredoka text-sm font-bold uppercase tracking-widest text-[#008FA6]">Stage 1</p>
              <h2 className="font-fredoka text-3xl font-black text-[#1A2F33]">Letter Sound Trail</h2>
              <p className="mt-2 font-andika text-lg font-bold text-[#38545A]">Meet b, m, r and f. Collect 4 stickers and build a 4-piece puzzle.</p>
              <span className="mt-4 inline-flex rounded-full border-[3px] border-[#1A2F33] bg-[#00B8D4] px-5 py-2 font-fredoka text-lg font-black text-white transition-transform group-hover:translate-x-1">
                {stageOneComplete ? "PLAY AGAIN →" : "PLAY STAGE →"}
              </span>
            </div>
          </motion.button>

          <motion.button
            type="button"
            disabled={!stageOneComplete}
            initial={{ x: 40, y: 24, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            whileHover={stageOneComplete ? { y: -8, rotate: 1 } : undefined}
            whileTap={stageOneComplete ? { y: 2, scale: 0.99 } : undefined}
            onClick={() => onChoose("letters-2")}
            className={`group relative overflow-hidden rounded-[2.5rem] border-[6px] border-[#1A2F33] p-4 text-left shadow-[0_12px_0_#1A2F33] ${stageOneComplete ? "bg-[#E4D9FF]" : "cursor-not-allowed bg-[#D9E1E2] grayscale-[0.65]"}`}
          >
            <span className="absolute left-3 top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#1A2F33] bg-[#C9A7FF] font-fredoka text-3xl font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33]">
              2
            </span>
            <div className="relative mb-4 flex h-48 items-end justify-center overflow-hidden rounded-[2rem] border-4 border-[#1A2F33] bg-[#D5C4FF] sm:h-56">
              <img src={dogImg} alt="Friendly dog holding a phonics card" className="absolute bottom-0 left-1/2 h-[95%] -translate-x-1/2 object-cover object-top opacity-35" />
              <div className="relative z-10 mb-5 grid grid-cols-4 gap-2">
                {stageTwoLetters.map((letter, index) => (
                  <span
                    key={letter}
                    className={`flex h-14 w-12 items-center justify-center rounded-xl border-[3px] border-[#1A2F33] font-fredoka text-3xl font-black uppercase text-[#1A2F33] shadow-[0_4px_0_#1A2F33] ${index % 2 ? "bg-white" : "bg-[#C9A7FF]"}`}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-2 pb-2">
              <p className="mb-1 font-fredoka text-sm font-bold uppercase tracking-widest text-[#7A4BC4]">Stage 2</p>
              <h2 className="font-fredoka text-3xl font-black text-[#1A2F33]">More Sound Friends</h2>
              <p className="mt-2 font-andika text-lg font-bold text-[#38545A]">Meet h, a, t and c. Collect 4 new stickers and complete another puzzle.</p>
              <span className="mt-4 inline-flex rounded-full border-[3px] border-[#1A2F33] bg-[#8C5CD6] px-5 py-2 font-fredoka text-lg font-black text-white transition-transform group-hover:translate-x-1">
                {stageOneComplete ? (autoLaunching === 2 ? "OPENING STAGE 2…" : stageTwoComplete ? "PLAY AGAIN →" : "PLAY STAGE →") : "🔒 FINISH STAGE 1"}
              </span>
            </div>
            {!stageOneComplete && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#D9E1E2]/35">
                <span className="rounded-full border-[5px] border-[#1A2F33] bg-white px-6 py-4 font-fredoka text-2xl font-black text-[#1A2F33] shadow-[0_7px_0_#1A2F33]">
                  🔒 LOCKED
                </span>
              </div>
            )}
            {autoLaunching === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.45, 0.8, 0.45] }}
                transition={{ repeat: Infinity, duration: 1.1 }}
                className="pointer-events-none absolute inset-0 z-30 rounded-[2rem] border-[9px] border-[#C9A7FF]"
              />
            )}
          </motion.button>

          <motion.button
            type="button"
            disabled={!stageTwoComplete}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={stageTwoComplete ? { y: -8, rotate: -1 } : undefined}
            whileTap={stageTwoComplete ? { y: 2, scale: 0.99 } : undefined}
            onClick={() => onChoose("vocabulary")}
            className={`group relative overflow-hidden rounded-[2.5rem] border-[6px] border-[#1A2F33] p-4 text-left shadow-[0_12px_0_#1A2F33] sm:col-span-2 lg:col-span-1 ${stageTwoComplete ? "bg-[#D9FFDA]" : "cursor-not-allowed bg-[#D9E1E2] grayscale-[0.65]"}`}
          >
            <span className="absolute left-3 top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#1A2F33] bg-[#69F0AE] font-fredoka text-3xl font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33]">
              3
            </span>
            <div className="relative mb-4 flex h-48 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-[#1A2F33] bg-[#8FD3A8] sm:h-56">
              <div className="flex gap-2 sm:gap-3">
                {["?", "a", "t"].map((letter, index) => (
                  <span
                    key={`${letter}-${index}`}
                    className={`flex h-24 w-16 items-center justify-center rounded-[1.4rem] border-4 border-[#1A2F33] font-fredoka text-5xl font-black uppercase text-[#1A2F33] shadow-[0_7px_0_#1A2F33] sm:h-28 sm:w-20 ${index === 0 ? "bg-white" : "bg-[#FFEA00]"}`}
                  >
                    {letter}
                  </span>
                ))}
              </div>
              <div className="absolute bottom-2 right-3 rounded-full border-3 border-[#1A2F33] bg-white/95 px-3 py-1 font-fredoka text-sm font-black text-[#1A2F33]">
                cat • bat • hat • fat • mat • rat
              </div>
            </div>
            <div className="px-2 pb-2">
              <p className="mb-1 font-fredoka text-sm font-bold uppercase tracking-widest text-[#16834B]">Stage 3</p>
              <h2 className="font-fredoka text-3xl font-black text-[#1A2F33]">-at Word Playground</h2>
              <p className="mt-2 font-andika text-lg font-bold text-[#38545A]">Build words, listen, then find the first sound.</p>
              <span className="mt-4 inline-flex rounded-full border-[3px] border-[#1A2F33] bg-[#23B867] px-5 py-2 font-fredoka text-lg font-black text-white transition-transform group-hover:translate-x-1">
                {stageTwoComplete ? (autoLaunching === 3 ? "OPENING STAGE 3…" : "PLAY STAGE →") : "🔒 FINISH STAGE 2"}
              </span>
            </div>
            {!stageTwoComplete && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#D9E1E2]/35">
                <span className="rounded-full border-[5px] border-[#1A2F33] bg-white px-6 py-4 font-fredoka text-2xl font-black text-[#1A2F33] shadow-[0_7px_0_#1A2F33]">
                  🔒 LOCKED
                </span>
              </div>
            )}
            {autoLaunching === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.45, 0.8, 0.45] }}
                transition={{ repeat: Infinity, duration: 1.1 }}
                className="pointer-events-none absolute inset-0 z-30 rounded-[2rem] border-[9px] border-[#69F0AE]"
              />
            )}
          </motion.button>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [stageOneComplete, setStageOneComplete] = useState(false);
  const [stageTwoComplete, setStageTwoComplete] = useState(false);
  const [stageOneStars, setStageOneStars] = useState(0);
  const [stageTwoStars, setStageTwoStars] = useState(0);
  const [stageOneStickers, setStageOneStickers] = useState<FoodSticker[]>([]);
  const [stageTwoStickers, setStageTwoStickers] = useState<FoodSticker[]>([]);
  const [autoLaunching, setAutoLaunching] = useState<2 | 3 | null>(null);
  const previousWelcome = useRef<string | null>(null);
  const launchTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (launchTimer.current !== null) window.clearTimeout(launchTimer.current);
  }, []);

  const showStages = () => {
    initAudio();
    setScreen("levels");
    const line = pickFreshLine(levelWelcomeLines, previousWelcome.current);
    previousWelcome.current = line;
    void speakText(line, 0.96, 1.18);
  };

  const chooseStage = (stage: PlayStage) => {
    if (stage === "letters-2" && !stageOneComplete) return;
    if (stage === "vocabulary" && !stageTwoComplete) return;
    if (launchTimer.current !== null) {
      window.clearTimeout(launchTimer.current);
      launchTimer.current = null;
    }
    setAutoLaunching(null);
    setScreen(stage);
  };

  const completeStageOne = ({ stars, stickers }: { stars: number; stickers: FoodSticker[] }) => {
    setStageOneComplete(true);
    setStageOneStars(stars);
    setStageOneStickers(stickers);
    setScreen("levels");
    setAutoLaunching(2);
    void speakText("Stage two is unlocked! Four more sound friends are opening now.", 0.96, 1.2);
    launchTimer.current = window.setTimeout(() => {
      setAutoLaunching(null);
      setScreen("letters-2");
      launchTimer.current = null;
    }, 2600);
  };

  const completeStageTwo = ({ stars, stickers }: { stars: number; stickers: FoodSticker[] }) => {
    setStageTwoComplete(true);
    setStageTwoStars(stars);
    setStageTwoStickers(stickers);
    setScreen("levels");
    setAutoLaunching(3);
    void speakText("Stage three is unlocked! The -at Word Playground is opening now.", 0.96, 1.2);
    launchTimer.current = window.setTimeout(() => {
      setAutoLaunching(null);
      setScreen("vocabulary");
      launchTimer.current = null;
    }, 2600);
  };

  if (screen === "landing") return <Landing onStart={showStages} />;
  if (screen === "letters-1") {
    return <LetterGame stageNumber={1} letters={stageOneLetters} nextStageName="stage two" onExit={showStages} onComplete={completeStageOne} />;
  }
  if (screen === "letters-2") {
    return <LetterGame stageNumber={2} letters={stageTwoLetters} nextStageName="stage three" onExit={showStages} onComplete={completeStageTwo} />;
  }
  if (screen === "vocabulary") return <PhonicsGame onExit={showStages} />;

  return (
    <LevelMap
      onChoose={chooseStage}
      stageOneComplete={stageOneComplete}
      stageTwoComplete={stageTwoComplete}
      stars={stageOneStars + stageTwoStars}
      stickerCount={stageOneStickers.length + stageTwoStickers.length}
      autoLaunching={autoLaunching}
    />
  );
}
