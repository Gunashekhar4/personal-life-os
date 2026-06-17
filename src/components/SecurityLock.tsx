import { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Unlock, Key, RefreshCw } from 'lucide-react';
import { AppLockConfig } from '../types';

interface SecurityLockProps {
  onUnlock: () => void;
  isUnlocked: boolean;
  onLockStateChange: (locked: boolean) => void;
}

export default function SecurityLock({ onUnlock, isUnlocked, onLockStateChange }: SecurityLockProps) {
  const [config, setConfig] = useState<AppLockConfig>({
    pin: '',
    isLocked: true,
    enabled: false,
    lastActivity: Date.now()
  });
  
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupPin1, setSetupPin1] = useState('');
  const [setupPin2, setSetupPin2] = useState('');
  
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Lock Configuration from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('life_os_lock_cfg');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(prev => ({
          ...prev,
          pin: parsed.pin || '',
          enabled: !!parsed.pin,
          isLocked: !!parsed.pin // Lock if PIN is set
        }));
        
        if (parsed.pin) {
          onLockStateChange(true);
        } else {
          onLockStateChange(false);
        }
      } catch (e) {
        console.error('Lock config load error', e);
      }
    } else {
      setIsSettingUp(true); // Direct to set master PIN if clean DB
      onLockStateChange(false);
    }

    // Add event listener to dynamically reload lock configurations when changed from settings tab
    const handleUpdate = () => {
      const cfg = localStorage.getItem('life_os_lock_cfg');
      if (cfg) {
        try {
          const parsed = JSON.parse(cfg);
          setConfig(prev => ({
            ...prev,
            pin: parsed.pin || '',
            enabled: !!parsed.pin,
          }));
          if (!parsed.pin) {
            onLockStateChange(false);
            onUnlock();
          }
        } catch (e) {}
      }
    };
    window.addEventListener('life_os_lock_update', handleUpdate);
    return () => window.removeEventListener('life_os_lock_update', handleUpdate);
  }, []);

  // Sync state to LocalStorage
  const saveConfig = (newCfg: Partial<AppLockConfig>) => {
    const updated = { ...config, ...newCfg };
    setConfig(updated);
    
    let existingTimeout = 5;
    const existing = localStorage.getItem('life_os_lock_cfg');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed.timeoutMinutes !== undefined) {
          existingTimeout = parsed.timeoutMinutes;
        }
      } catch (e) {}
    }

    localStorage.setItem('life_os_lock_cfg', JSON.stringify({ 
      pin: updated.pin,
      timeoutMinutes: existingTimeout
    }));
  };

  // Inactivity auto-lock monitor (customizable timeout)
  const resetInactivityTimer = () => {
    if (!config.pin) return; // No PIN set, no need to track inactivity
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    let mins = 5;
    const saved = localStorage.getItem('life_os_lock_cfg');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.timeoutMinutes !== undefined) {
          mins = parseInt(parsed.timeoutMinutes, 10);
        }
      } catch (e) {}
    }

    if (mins <= 0) {
      // Inactivity timeout lock is disabled
      return;
    }

    activityTimeoutRef.current = setTimeout(() => {
      console.log(`[Lock System] Inactivity threshold reached (${mins}m). Locking application.`);
      setConfig(prev => ({ ...prev, isLocked: true }));
      setInputPin('');
      onLockStateChange(true);
    }, mins * 60 * 1000); 
  };

  useEffect(() => {
    if (isUnlocked && config.pin) {
      // Activity listeners when unlocked
      const handleActivity = () => resetInactivityTimer();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      
      resetInactivityTimer();

      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('touchstart', handleActivity);
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      };
    }
  }, [isUnlocked, config.pin]);

  // Unlock Verification
  const handleVerify = () => {
    if (inputPin === config.pin) {
      setError('');
      setConfig(prev => ({ ...prev, isLocked: false }));
      setInputPin('');
      onLockStateChange(false);
      onUnlock();
    } else {
      setError('Invalid master PIN. Please try again.');
      setInputPin('');
    }
  };

  // Keypad Actions
  const handleKeyPress = (num: string) => {
    setError('');
    if (inputPin.length < 4) {
      const newVal = inputPin + num;
      setInputPin(newVal);
      // Auto verify on 4 digits
      if (newVal.length === 4 && config.pin) {
        setTimeout(() => {
          if (newVal === config.pin) {
            setConfig(prev => ({ ...prev, isLocked: false }));
            setInputPin('');
            onLockStateChange(false);
            onUnlock();
          } else {
            setError('Invalid master PIN.');
            setInputPin('');
          }
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setInputPin(prev => prev.slice(0, -1));
  };

  // Setup PIN Flow
  const handleSetupPIN = () => {
    if (setupPin1.length !== 4) {
      setError('PIN must be exactly 4 digits.');
      return;
    }
    if (setupPin1 !== setupPin2) {
      setError('PIN entered does not match. Please re-enter.');
      setSetupPin2('');
      return;
    }

    saveConfig({
      pin: setupPin1,
      enabled: true,
      isLocked: false
    });
    setError('');
    setIsSettingUp(false);
    onUnlock();
    onLockStateChange(false);
  };

  // Reset Lock config for debugging / reset PIN
  const handleResetLock = () => {
    if (window.confirm('Are you sure you want to disable Master PIN lock protection?')) {
      saveConfig({ pin: '', enabled: false, isLocked: false });
      setIsSettingUp(true);
      setSetupPin1('');
      setSetupPin2('');
      onLockStateChange(false);
    }
  };

  // PIN setup component rendering
  if (isSettingUp) {
    return (
      <div id="security-setup-panel" className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b] p-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#0c0c0e] w-11/12 p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-md">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-white mb-2">Configure Master PIN</h1>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Establish a 4-digit security PIN to restrict local access to your Personal AI Life OS.
            </p>

            {error && (
              <div className="w-full rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200 p-3 mb-4 text-center">
                {error}
              </div>
            )}

            <div className="w-full space-y-4">
              <div>
                <label className="block text-left text-3xs font-mono text-zinc-500 mb-1.5 uppercase tracking-wider font-bold">
                  Enter 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={setupPin1}
                  onChange={(e) => setSetupPin1(e.target.value.replace(/\D/g, ''))}
                  className="w-full tracking-widest text-center text-2xl font-mono p-3 rounded-lg border border-zinc-800 bg-[#09090b] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-505 text-white"
                />
              </div>

              <div>
                <label className="block text-left text-3xs font-mono text-zinc-500 mb-1.5 uppercase tracking-wider font-bold">
                  Confirm 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={setupPin2}
                  onChange={(e) => setSetupPin2(e.target.value.replace(/\D/g, ''))}
                  className="w-full tracking-widest text-center text-2xl font-mono p-3 rounded-lg border border-zinc-800 bg-[#09090b] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-505 text-white"
                />
              </div>

              <button
                id="btn-confirm-pin-setup"
                onClick={handleSetupPIN}
                className="w-full py-3 mt-4 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Key className="h-4 w-4" /> Save App Master PIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active locked screen rendering
  if (config.isLocked) {
    return (
      <div id="security-active-lock-panel" className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b] p-4">
        <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-[#0c0c0e] p-6 md:p-8 shadow-2xl text-center flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-md">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-white mb-1">Life OS Locked</h2>
          <p className="text-xs text-zinc-500 mb-6 font-mono font-bold tracking-widest">AUTHORIZED PERSONAL USE ONLY</p>

          {error && (
            <div className="w-full rounded-lg bg-red-950/30 border border-red-500/20 text-xs text-red-300 p-2.5 mb-4 max-w-[280px]">
              {error}
            </div>
          )}

          {/* Dots Indicator */}
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`h-3.5 w-3.5 rounded-full border border-zinc-700 transition-all duration-150 ${
                  inputPin.length > idx ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-md shadow-indigo-500/30' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* Master Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                id={`btn-keypad-${num}`}
                key={num}
                onClick={() => handleKeyPress(num)}
                className="h-14 rounded-xl border border-zinc-800 bg-[#09090b] hover:bg-zinc-800 text-lg font-mono font-bold text-zinc-200 transition-all focus:outline-none cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              id="btn-keypad-clear"
              onClick={() => { setInputPin(''); setError(''); }}
              className="h-14 rounded-xl text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
            >
              CLEAR
            </button>
            <button
              id="btn-keypad-0"
              onClick={() => handleKeyPress('0')}
              className="h-14 rounded-xl border border-zinc-800 bg-[#09090b] hover:bg-zinc-800 text-lg font-mono font-bold text-zinc-200 transition-all focus:outline-none cursor-pointer"
            >
              0
            </button>
            <button
              id="btn-keypad-back"
              onClick={handleBackspace}
              className="h-14 rounded-xl text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Header lock management utility (unlocked state option to relock / disable)
  return (
    <div id="security-unlocked-status-strip" className="bg-[#0c0c0e] border-b border-zinc-850 px-4 py-2 flex items-center justify-between text-xs text-zinc-400">
      <div className="flex items-center gap-2 font-medium">
        <Unlock className="h-3.5 w-3.5 text-indigo-400" />
        <span>Master Lock Shield: <span className="text-zinc-350">Active (5m Idle Lock)</span></span>
      </div>
      <div className="flex items-center gap-3">
        <button
          id="btn-relock-now"
          onClick={() => {
            setConfig(prev => ({ ...prev, isLocked: true }));
            onLockStateChange(true);
          }}
          className="hover:text-indigo-400 hover:border-indigo-500/40 transition-all font-mono uppercase bg-[#09090b] px-3 py-1 rounded border border-zinc-800 cursor-pointer"
        >
          Relock App
        </button>
        <button
          id="btn-disable-lock"
          onClick={handleResetLock}
          className="hover:text-red-400 hover:border-red-500/20 transition-all font-mono uppercase bg-[#09090b] px-3 py-1 rounded border border-zinc-800 text-zinc-500 cursor-pointer"
        >
          Disable Master PIN
        </button>
      </div>
    </div>
  );
}
