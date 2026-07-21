/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { PhonicsGame } from "./components/PhonicsGame";
import { LetterGame } from "./components/LetterGame";
import { initAudio, pickFreshLine, speakText } from "./utils/audio";

import forestBg from "./assets/images/cartoon_forest_bg_1784540338051.jpg";
import dogImg from "./assets/images/dog_closeup_holding_card_solid_1784547773486.jpg";

type AppScreen = "landing" | "levels" | "letters" | "vocabulary";

const levelWelcomeLines = [
  "Welcome, sound explorer! Pick a trail and let's play.",
  "The forest is ready for you. Which sound adventure should we try?",
  "Hello, phonics friend! Choose a level and we'll explore it together.",
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
}: {
  onChoose: (level: "letters" | "vocabulary") => void;
}) {
  const letters = ["b", "m", "r", "f", "h", "a", "t", "c"];

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
            Forest Levels
          </h1>
        </motion.header>

        <section className="relative grid w-full gap-10 pb-8 sm:grid-cols-2 sm:gap-16" aria-label="Phonics game levels">
          <div className="pointer-events-none absolute left-1/2 top-[45%] hidden h-3 w-28 -translate-x-1/2 -rotate-12 rounded-full border-y-4 border-dashed border-white/90 sm:block" />

          <motion.button
            type="button"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ y: -8, rotate: -1 }}
            whileTap={{ y: 2, scale: 0.99 }}
            onClick={() => onChoose("letters")}
            className="group relative overflow-hidden rounded-[2.5rem] border-[6px] border-[#1A2F33] bg-[#FFF7B8] p-4 text-left shadow-[0_12px_0_#1A2F33]"
          >
            <span className="absolute left-3 top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#1A2F33] bg-[#FFEA00] font-fredoka text-3xl font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33]">
              1
            </span>
            <div className="relative mb-4 flex h-48 items-end justify-center overflow-hidden rounded-[2rem] border-4 border-[#1A2F33] bg-[#9BE7F1] sm:h-56">
              <img src={dogImg} alt="Friendly dog holding a phonics card" className="absolute bottom-0 left-1/2 h-[95%] -translate-x-1/2 object-cover object-top opacity-45" />
              <div className="relative z-10 mb-5 grid grid-cols-4 gap-2">
                {letters.map((letter, index) => (
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
              <p className="mb-1 font-fredoka text-sm font-bold uppercase tracking-widest text-[#008FA6]">Level 1</p>
              <h2 className="font-fredoka text-3xl font-black text-[#1A2F33]">Letter Sound Trail</h2>
              <p className="mt-2 font-andika text-lg font-bold text-[#38545A]">Meet 8 sounds, then play 3-choose-1.</p>
              <span className="mt-4 inline-flex rounded-full border-[3px] border-[#1A2F33] bg-[#00B8D4] px-5 py-2 font-fredoka text-lg font-black text-white transition-transform group-hover:translate-x-1">
                PLAY LEVEL →
              </span>
            </div>
          </motion.button>

          <motion.button
            type="button"
            initial={{ x: 40, y: 24, opacity: 0 }}
            animate={{ x: 0, y: 24, opacity: 1 }}
            whileHover={{ y: 16, rotate: 1 }}
            whileTap={{ y: 26, scale: 0.99 }}
            onClick={() => onChoose("vocabulary")}
            className="group relative overflow-hidden rounded-[2.5rem] border-[6px] border-[#1A2F33] bg-[#D9FFDA] p-4 text-left shadow-[0_12px_0_#1A2F33] sm:mt-12"
          >
            <span className="absolute left-3 top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#1A2F33] bg-[#69F0AE] font-fredoka text-3xl font-black text-[#1A2F33] shadow-[0_5px_0_#1A2F33]">
              2
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
              <div className="absolute bottom-2 right-3 rounded-full border-3 border-[#1A2F33] bg-white/95 px-3 py-1 font-fredoka text-base font-black text-[#1A2F33]">
                cat • bat • hat • fat • mat • rat
              </div>
            </div>
            <div className="px-2 pb-2">
              <p className="mb-1 font-fredoka text-sm font-bold uppercase tracking-widest text-[#16834B]">Level 2</p>
              <h2 className="font-fredoka text-3xl font-black text-[#1A2F33]">-at Word Playground</h2>
              <p className="mt-2 font-andika text-lg font-bold text-[#38545A]">Build words, listen, then find the first sound.</p>
              <span className="mt-4 inline-flex rounded-full border-[3px] border-[#1A2F33] bg-[#23B867] px-5 py-2 font-fredoka text-lg font-black text-white transition-transform group-hover:translate-x-1">
                PLAY LEVEL →
              </span>
            </div>
          </motion.button>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const previousWelcome = useRef<string | null>(null);

  const showLevels = () => {
    initAudio();
    setScreen("levels");
    const line = pickFreshLine(levelWelcomeLines, previousWelcome.current);
    previousWelcome.current = line;
    void speakText(line, 0.96, 1.18);
  };

  if (screen === "landing") return <Landing onStart={showLevels} />;
  if (screen === "letters") return <LetterGame onExit={showLevels} />;
  if (screen === "vocabulary") return <PhonicsGame onExit={showLevels} />;

  return <LevelMap onChoose={setScreen} />;
}
