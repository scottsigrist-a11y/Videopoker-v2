"use client";

import { MrbdViewport, useDpadNavigation } from "@mrbd/react";
import { useEffect, useState, useRef, createElement } from "react";

type Card = { suit: "♠" | "♥" | "♦" | "♣"; value: string; rank: number };
const SUITS: Card["suit"][] = ["♠", "♥", "♦", "♣"];
const VALUES = [
  { val: "2", rank: 2 }, { val: "3", rank: 3 }, { val: "4", rank: 4 },
  { val: "5", rank: 5 }, { val: "6", rank: 6 }, { val: "7", rank: 7 },
  { val: "8", rank: 8 }, { val: "9", rank: 9 }, { val: "10", rank: 10 },
  { val: "J", rank: 11 }, { val: "Q", rank: 12 }, { val: "K", rank: 13 },
  { val: "A", rank: 14 }
];

const LEFT_PAY = [
  { name: "ROYAL FLUSH", m: 800, c: "bg-red-600 text-white" },
  { name: "STRAIGHT FLUSH", m: 50, c: "bg-orange-500 text-black" },
  { name: "FOUR OF A KIND", m: 25, c: "bg-cyan-500 text-black" },
  { name: "FULL HOUSE", m: 9, c: "bg-blue-600 text-white" },
  { name: "FLUSH", m: 6, c: "bg-purple-600 text-white" }
];

const RIGHT_PAY = [
  { name: "STRAIGHT", m: 4, c: "bg-pink-600 text-white" },
  { name: "THREE OF A KIND", m: 3, c: "bg-amber-600 text-black" },
  { name: "TWO PAIR", m: 2, c: "bg-emerald-600 text-white" },
  { name: "JACKS OR BETTER", m: 1, c: "bg-zinc-700 text-white" }
];

export function GlassesHome() {
  useDpadNavigation();

  const [credits, setCredits] = useState(2000);
  const [cash, setCash] = useState(100.00);
  const [bet, setBet] = useState(1);
  const [hand, setHand] = useState<Card[]>([]);
  const [topHands, setTopHands] = useState<Card[][]>([[], [], [], []]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<"BET" | "DRAW" | "OVER">("BET");
  const [winStatus, setWinStatus] = useState<string>("");
  const [fIdx, setFocusedIndex] = useState(7);

  // Statistics tracker states
  const [stats, setStats] = useState({ played: 0, wins: 0, peak: 2000 });

  const getDeck = () => {
    let d: Card[] = [];
    SUITS.forEach(s => VALUES.forEach(v => d.push({ suit: s, value: v.val, rank: v.rank })));
    for (let m = d.length - 1; m > 0; m--) {
      const i = Math.floor(Math.random() * (m + 1));
      [d[m], d[i]] = [d[i], d[m]];
    }
    return d;
  };

  const clickRef = useRef<(i: number) => void>(() => {});
  useEffect(() => {
    clickRef.current = (i: number) => {
      if (i <= 4 && gameState === "DRAW") {
        setHeld(prev => prev.map((h, idx) => idx === i ? !h : h));
      } else if (i === 5 && gameState !== "DRAW") {
        setBet(1); setGameState("BET"); setWinStatus("");
      } else if (i === 6 && gameState !== "DRAW") {
        setBet(5); setGameState("BET"); setWinStatus("");
      } else if (i === 7) {
        if (gameState === "DRAW") draw();
        else if (credits >= bet) deal();
      }
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setFocusedIndex(p => p === 0 ? 7 : p - 1);
      else if (e.key === "ArrowRight") setFocusedIndex(p => p === 7 ? 0 : p + 1);
      else if (e.key === "Enter") clickRef.current(fIdx);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fIdx]);

  const deal = () => {
    const d = getDeck();
    const mainHand = [d.pop()!, d.pop()!, d.pop()!, d.pop()!, d.pop()!];
    setCredits(p => p - bet);
    setCash(c => parseFloat((c - (bet * 0.05)).toFixed(2)));
    setHand(mainHand);
    setTopHands([[], [], [], []]);
    setDeck(d);
    setHeld([false, false, false, false, false]);
    setGameState("DRAW");
    setWinStatus("HOLD CARDS");
    setStats(s => ({ ...s, played: s.played + 1 }));
  };

  const draw = () => {
    let currentDeck = [...deck];
    const finalMainHand = hand.map((c, i) => held[i] ? c : currentDeck.pop()!);
    setHand(finalMainHand);

    const newTopHands = topHands.map(() => {
      return hand.map((c, i) => held[i] ? c : currentDeck.pop()!);
    });
    setTopHands(newTopHands);

    let totalWins = 0;
    let winHandCount = 0;
    
    const processWin = (h: Card[]) => {
      const r = h.map(c => c.rank).sort((a,b)=>a-b);
      const flush = h.every(c => c.suit === h[0].suit);
      const unique = Array.from(new Set(r));
      let str = unique.length === 5 && (r[4] - r[0] === 4 || (r[4]===14 && r[0]===2 && r[1]===3 && r[2]===4 && r[3]===5));
      
      let counts: { [key: number]: number } = {};
      r.forEach(x => counts[x] = (counts[x] || 0) + 1);
      const f = Object.values(counts).sort((a,b)=>b-a);

      if (flush && str && r[0] === 10) return 800;
      if (flush && str) return 50;
      if (f[0] === 4) return 25;
      if (f[0] === 3 && f[1] === 2) return 9;
      if (flush) return 6;
      if (str) return 4;
      if (f[0] === 3) return 3;
      if (f[0] === 2 && f[1] === 2) return 2;
      if (f[0] === 2) {
        const pRank = Number(Object.keys(counts).find(k => counts[Number(k)] === 2));
        if (pRank >= 11) return 1;
      }
      return 0;
    };

    const mainPayout = processWin(finalMainHand);
    if (mainPayout > 0) winHandCount++;
    totalWins += mainPayout;

    newTopHands.forEach(th => { 
      const topPayout = processWin(th);
      if (topPayout > 0) winHandCount++;
      totalWins += topPayout; 
    });

    if (totalWins > 0) {
      const payoutCredits = totalWins * bet;
      const updatedCredits = credits + payoutCredits;
      setCredits(updatedCredits);
      setCash(c => parseFloat((c + (payoutCredits * 0.05)).toFixed(2)));
      setWinStatus("WIN: CR " + payoutCredits);
      setStats(s => ({
        ...s,
        wins: s.wins + winHandCount,
        peak: updatedCredits > s.peak ? updatedCredits : s.peak
      }));
    } else {
      setWinStatus("GAME OVER");
    }
    setGameState("OVER");
  };

  const displayCash = "$" + cash.toFixed(2);
  const displayBtnLabel = gameState === "DRAW" ? "Draw" : "Deal";

  return createElement(
    MrbdViewport,
    { className: "text-white selection:bg-transparent" },
    createElement(
      "main",
      { className: "flex h-full flex-col justify-between rounded-[28px] bg-black p-3 select-none font-sans overflow-hidden border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" },
      
      // Cyberpunk Tracker Box Panel Element
      createElement(
        "section",
        { className: "grid grid-cols-3 text-center text-[9px] font-mono font-bold bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-1 text-emerald-400 leading-tight mb-1" },
        createElement("div", null, "ROUNDS: " + stats.played),
        createElement("div", { className: "border-x border-emerald-500/20" }, "HAND WINS: " + stats.wins),
        createElement("div", null, "PEAK CR: " + stats.peak)
      ),

      // Top multi-play frame array mirroring panel element
      createElement(
        "section",
        { className: "grid grid-cols-2 gap-2 bg-zinc-950/50 p-1.5 rounded-xl border border-emerald-500/20" },
        topHands.map((th, thIdx) => {
          // Sync held cards visibility in auxiliary rows during game phases
          const visibleHand = (gameState === "DRAW" && th.length === 0) 
            ? hand.map((c, idx) => held[idx] ? c : null) 
            : th;

          return createElement(
            "div",
            { key: thIdx, className: "bg-emerald-950/10 rounded-lg p-1 border border-emerald-500/10 flex gap-0.5 justify-center h-11 items-center" },
            visibleHand.some(c => c !== null) ? visibleHand.map((c, cIdx) => {
              if (!c) return createElement("div", { key: cIdx, className: "w-6 h-9 rounded bg-emerald-950/30 border border-emerald-500/10 opacity-20" });
              const isRed = c.suit === "♥" || c.suit === "♦";
              return createElement(
                "div",
                {
                  key: cIdx,
                  className: "w-6 h-9 rounded bg-white text-center flex flex-col justify-center text-[11px] font-black leading-none",
                  style: { color: isRed ? "#dc2626" : "#000000" }
                },
                createElement("div", null, c.value),
                createElement("div", { className: "text-[9px]" }, c.suit)
              );
            }) : createElement("div", { className: "text-[10px] font-bold text-emerald-500/40 font-mono" }, "HAND 0" + (thIdx + 1))
          );
        })
      ),

      // Lower interactive hand card selection field array element
      createElement(
        "section",
        { className: "grid grid-cols-5 gap-1 my-1 justify-center" },
        Array.from({ length: 5 }).map((_, i) => {
          const c = hand[i];
          const isRed = c?.suit === "♥" || c?.suit === "♦";
          return createElement(
            "div",
            {
              key: i,
              onClick: () => clickRef.current(i),
              className: "relative h-24 rounded-lg border-2 flex flex-col justify-between p-1 transition-all",
              style: {
                backgroundColor: c ? "#ffffff" : "rgba(6,78,59,0.2)",
                color: c ? "#000000" : "#34d399",
                borderColor: fIdx === i ? "#34d399" : "rgba(16,185,129,0.2)",
                transform: fIdx === i ? "scale(1.02)" : "scale(1)",
                boxShadow: fIdx === i ? "0 0 8px rgba(52,211,153,0.4)" : "none"
              }
            },
            createElement(
              "div",
              {
                className: "absolute -top-3 left-0 right-0 text-center",
                style: { display: held[i] && gameState === "DRAW" ? "block" : "none" }
              },
              createElement("span", { className: "text-[8px] font-black px-1 bg-emerald-600 text-white rounded-sm border border-emerald-400 tracking-tighter shadow-md" }, "HELD")
            ),
            c ? createElement("div", { className: "text-sm font-black flex justify-between leading-none", style: { color: isRed ? "#dc2626" : "" } }, createElement("span", null, c.value), createElement("span", { className: "text-xs" }, c.suit)) : null,
            c ? createElement("div", { className: "text-center text-2xl my-auto", style: { color: isRed ? "#dc2626" : "" } }, c.suit) : null,
            c ? createElement("div", { className: "text-sm font-black flex justify-between leading-none transform rotate-180", style: { color: isRed ? "#dc2626" : "" } }, createElement("span", null, c.value), createElement("span", { className: "text-xs" }, c.suit)) : createElement("div", { className: "m-auto opacity-20 text-lg font-mono" }, "?")
          );
        })
      ),

      // Neon styled left and right paytable matrices elements
      createElement(
        "section",
        { className: "grid grid-cols-2 gap-1 text-[8px] font-mono font-bold" },
        createElement(
          "div",
          { className: "space-y-0.5 bg-zinc-950/60 p-1 rounded-md border border-emerald-500/10" },
          LEFT_PAY.map(p => createElement("div", { key: p.name, className: "flex justify-between px-1 rounded-sm " + p.c }, createElement("span", null, p.name), createElement("span", null, p.m * bet)))
        ),
        createElement(
          "div",
          { className: "space-y-0.5 bg-zinc-950/60 p-1 rounded-md border border-emerald-500/10" },
          RIGHT_PAY.map(p => createElement("div", { key: p.name, className: "flex justify-between px-1 rounded-sm " + p.c }, createElement("span", null, p.name), createElement("span", null, p.m * bet)))
        )
      ),

      // Round results overlay feedback ribbon banner layer element
      winStatus ? createElement("div", { className: "text-center bg-emerald-500 text-black py-0.5 text-xs font-black tracking-widest uppercase rounded shadow-[0_0_10px_rgba(16,185,129,0.5)]" }, winStatus) : null,

      // Main lower metrics dashboard financial audit counters row element
      createElement(
        "footer",
        { className: "space-y-1.5" },
        createElement(
          "div",
          { className: "grid grid-cols-3 text-center text-[10px] font-bold tracking-tight bg-zinc-950/80 p-1 rounded-md leading-tight text-emerald-400 font-mono border border-emerald-500/20" },
          createElement("div", null, "CASH ", createElement("span", { className: "text-white block text-xs font-black" }, displayCash)),
          createElement("div", { className: "border-x border-emerald-500/20 text-cyan-400" }, "BET ", createElement("span", { className: "text-white block text-xs font-black" }, bet)),
          createElement("div", null, "CREDIT ", createElement("span", { className: "text-emerald-400 block text-xs font-black" }, credits))
        ),

        // Control click input row action grids elements
        createElement(
          "div",
          { className: "grid grid-cols-3 gap-1" },
          createElement(
            "button",
            {
              onClick: () => clickRef.current(5),
              className: "py-2 rounded-lg text-xs font-black border",
              style: { backgroundColor: fIdx === 5 ? "#ffffff" : "#064e3b", borderColor: "#10b981", color: fIdx === 5 ? "#000000" : "#34d399" }
            },
            "Bet 1"
          ),
          createElement(
            "button",
            {
              onClick: () => clickRef.current(6),
              className: "py-2 rounded-lg text-xs font-black border",
              style: { backgroundColor: fIdx === 6 ? "#ffffff" : "#064e3b", borderColor: "#10b981", color: fIdx === 6 ? "#000000" : "#34d399" }
            },
            "Bet 5"
          ),
          createElement(
            "button",
            {
              onClick: () => clickRef.current(7),
              className: "py-2 rounded-lg text-xs font-black border",
              style: { backgroundColor: fIdx === 7 ? "#34d399" : "#065f46", borderColor: "#10b981", color: fIdx === 7 ? "#000000" : "#ffffff", transform: fIdx === 7 ? "scale(1.02)" : "scale(1)" }
            },
            displayBtnLabel
          )
        )
      )

    )
  );
}
