// filename: src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Bell, BellOff, Maximize } from 'lucide-react';

export default function App() {
  const [timeLeft, setTimeLeft] = useState(1500); // 預設 25 分鐘
  const [isActive, setIsActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialTime, setInitialTime] = useState(1500);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertType, setAlertType] = useState(null); // 'warning' (15), 'critical' (5), 'end' (0)

  const timerRef = useRef(null);
  const audioCtx = useRef(null);

  const playSound = (freq, type) => {
    if (!alertsEnabled) return;
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.connect(gain); gain.connect(audioCtx.current.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.current.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.current.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.current.currentTime + (type === 'end' ? 1.5 : 0.5));
    osc.start(); osc.stop(audioCtx.current.currentTime + (type === 'end' ? 1.5 : 0.5));
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const current = prev - 1;
          // 邏輯判斷
          if (current === 900) { setAlertType('warning'); playSound(660, 'w'); setTimeout(() => setAlertType(null), 5000); }
          else if (current === 300) { setAlertType('critical'); playSound(880, 'c'); setTimeout(() => setAlertType(null), 5000); }
          else if (current === 0) { setAlertType('end'); playSound(440, 'end'); setIsActive(false); }
          return current;
        });
      }, 1000);
    } else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, alertsEnabled]);

  const format = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return { hrs, m: mins.toString().padStart(2, '0'), s: secs.toString().padStart(2, '0') };
  };

  const t = format(timeLeft);
  const bgColor = alertType === 'warning' ? 'bg-amber-600' : alertType === 'critical' ? 'bg-orange-700' : alertType === 'end' ? 'bg-red-700' : 'bg-black';

  return (
    <div className={`h-screen w-screen flex flex-col items-center justify-center transition-colors duration-1000 ${bgColor}`}>
      {/* Top Bar */}
      <div className="absolute top-6 flex gap-6 opacity-30 hover:opacity-100 transition-opacity">
        <button onClick={() => setAlertsEnabled(!alertsEnabled)} className="flex items-center gap-2">
          {alertsEnabled ? <Bell size={20}/> : <BellOff size={20}/>}
          <span className="text-xs font-bold tracking-widest">{alertsEnabled ? 'ALERTS ON' : 'MUTED'}</span>
        </button>
      </div>

      {/* Main UI */}
      <div className="text-center select-none">
        {alertType && <div className="text-2xl font-black mb-4 animate-pulse uppercase tracking-[0.5em]">{alertType === 'end' ? 'Time Up!' : `Only ${timeLeft/60} Mins Left`}</div>}
        <div className={`font-mono font-bold tracking-tighter tabular-nums leading-none ${t.hrs > 0 ? 'text-[15vw]' : 'text-[25vw]'}`}>
          {t.hrs > 0 && <span>{t.hrs}:</span>}<span>{t.m}</span><span className={timeLeft <= 10 && timeLeft > 0 ? 'text-red-500' : ''}>:{t.s}</span>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 opacity-20 hover:opacity-100 transition-all">
          <button onClick={() => { setIsActive(false); setTimeLeft(initialTime); setAlertType(null); }} className="p-4 rounded-full bg-white/10 hover:bg-white/20"><RotateCcw size={32}/></button>
          <button onClick={() => { if(!isActive && audioCtx.current?.state === 'suspended') audioCtx.current.resume(); setIsActive(!isActive); }} className={`p-8 rounded-full ${isActive ? 'bg-white text-black' : 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)]'}`}>
            {isActive ? <Pause size={40} fill="currentColor"/> : <Play size={40} fill="currentColor" className="ml-1"/>}
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-4 rounded-full bg-white/10 hover:bg-white/20"><Settings size={32}/></button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="flex justify-between mb-8"><h2 className="text-xl font-bold tracking-widest uppercase">Set Duration</h2><button onClick={() => setIsSettingsOpen(false)}><X/></button></div>
            <div className="grid grid-cols-2 gap-4 mb-8 text-center">
              <div><label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase">Minutes</label><input type="number" id="mI" defaultValue={Math.floor(initialTime/60)} className="w-full bg-zinc-800 p-4 rounded-2xl text-2xl text-center outline-none border border-white/5 focus:border-green-500"/></div>
              <div><label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase">Seconds</label><input type="number" id="sI" defaultValue={initialTime%60} className="w-full bg-zinc-800 p-4 rounded-2xl text-2xl text-center outline-none border border-white/5 focus:border-green-500"/></div>
            </div>
            <button onClick={() => {
              const total = (parseInt(document.getElementById('mI').value)||0)*60 + (parseInt(document.getElementById('sI').value)||0);
              setInitialTime(total); setTimeLeft(total); setIsSettingsOpen(false); setIsActive(false);
            }} className="w-full py-5 bg-white text-black font-black rounded-2xl text-lg hover:bg-zinc-200">APPLY CHANGES</button>
          </div>
        </div>
      )}
    </div>
  );
}
