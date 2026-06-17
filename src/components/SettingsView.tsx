import React, { useState, useEffect } from 'react';
import { 
  Database, Copy, Check, RefreshCw, AlertTriangle, 
  Server, Key, Shield, Lock, Unlock, Clock, Download, Upload, HelpCircle, Save 
} from 'lucide-react';
import { SyncConfig } from '../types';
import { APPS_SCRIPT_TEMPLATE } from '../lib/appsScriptTemplate';
import { getAllFromIDB, putIntoIDB, clearIDBStore } from '../lib/db';

interface SettingsViewProps {
  syncConfig: SyncConfig;
  onUpdateConfig: (config: SyncConfig) => void;
  onPush: () => Promise<void>;
  onPull: () => Promise<void>;
}

export default function SettingsView({ syncConfig, onUpdateConfig, onPush, onPull }: SettingsViewProps) {
  // Cloud Sync properties
  const [url, setUrl] = useState(syncConfig.appsScriptUrl);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'error' | 'success'>('idle');
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // Security config properties
  const [pin, setPin] = useState('');
  const [reenteredPin, setReenteredPin] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(5);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [hasPasscodeSet, setHasPasscodeSet] = useState(false);

  // Loading security lock config on mount
  useEffect(() => {
    const saved = localStorage.getItem('life_os_lock_cfg');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHasPasscodeSet(!!parsed.pin);
        if (parsed.timeoutMinutes !== undefined) {
          setTimeoutMinutes(parseInt(parsed.timeoutMinutes, 10));
        }
      } catch (e) {
        console.error('Failed reading lock config', e);
      }
    }
  }, []);

  useEffect(() => {
    setUrl(syncConfig.appsScriptUrl);
  }, [syncConfig.appsScriptUrl]);

  // Copy code utility
  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Saved Sync script url
  const saveUrl = () => {
    onUpdateConfig({
      ...syncConfig,
      appsScriptUrl: url.trim(),
      status: 'idle'
    });
    setTestResult(null);
    setTestStatus('idle');
  };

  // Google Apps Script Connection tester
  const handleTestConnection = async () => {
    if (!url) {
      setTestStatus('error');
      setTestResult('Apps Script URL is required to test.');
      return;
    }
    setTestStatus('testing');
    try {
      const res = await fetch(url.trim(), {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'test' })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setTestStatus('success');
        setTestResult(data.message || 'Authenticated successfully!');
      } else {
        setTestStatus('error');
        setTestResult(data.message || 'Server returned an error.');
      }
    } catch (err: any) {
      console.error('GAS connection test error', err);
      setTestStatus('error');
      setTestResult('Could not establish connection to Google Apps Script. Is the web app correctly deployed and set to "Execute as: Me" and "Access: Anyone"?');
    }
  };

  // Bidirectional push/pull syncs
  const triggerPush = async () => {
    if (!syncConfig.appsScriptUrl) {
      alert('Configure your Apps Script URL before backing up.');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to OVERWRITE all Google Sheet content with your current local IndexedDB data? This represents a manual upload backup.');
    if (!confirmed) return;
    
    setIsPushing(true);
    try {
      await onPush();
      alert('Backup to Google Sheets successfully complete!');
    } catch (err: any) {
      alert('Backup failed: ' + err.message);
    } finally {
      setIsPushing(false);
    }
  };

  const triggerPull = async () => {
    if (!syncConfig.appsScriptUrl) {
      alert('Configure your Apps Script URL before pulling.');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to Overwrite your local IndexedDB with spreadsheet data from Google Sheets? This process cannot be undone locally.');
    if (!confirmed) return;
    
    setIsPulling(true);
    try {
      await onPull();
      alert('Database pull & local overwrite complete! All modules synched.');
    } catch (err: any) {
      alert('Pull synchronization failed: ' + err.message);
    } finally {
      setIsPulling(false);
    }
  };

  // DOWNLOADING entire IndexedDB + localStorage untimed todos as JSON backup
  const handleDownloadBackup = async () => {
    try {
      const dbData: Record<string, any> = {};
      const stores = ['goals', 'habits', 'timebox', 'inbox', 'vault', 'learning', 'projects', 'jobs'];
      
      for (const store of stores) {
        dbData[store] = await getAllFromIDB(store);
      }
      
      // Also grab the untimed todos state from localStorage
      const untimed = localStorage.getItem('life_os_untimed_todos');
      dbData['untimed_todos'] = untimed ? JSON.parse(untimed) : [];
      
      // Create element and click trigger download
      const jsonString = JSON.stringify(dbData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(jsonString);
      
      const downloadAnchor = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadAnchor.setAttribute("href", dataUri);
      downloadAnchor.setAttribute("download", `life_os_full_backup_${stamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      alert("Local backup download successfully created and triggered!");
    } catch (err: any) {
      console.error(err);
      alert("Failed creating local JSON download backup: " + err.message);
    }
  };

  // RESTORING uploaded JSON file to IndexedDB + localStorage
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm("WARNING: Restoring a local backup replaces all your current data columns. This cannot be undone. Are you sure you want to continue?");
    if (!confirmed) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const backupData = JSON.parse(fileContent);

        const stores = ['goals', 'habits', 'timebox', 'inbox', 'vault', 'learning', 'projects', 'jobs'];
        
        // Loop and write to tables
        for (const store of stores) {
          if (backupData[store]) {
            await clearIDBStore(store);
            const dataList = backupData[store];
            for (const item of dataList) {
              await putIntoIDB(store, item);
            }
          }
        }

        // Write the untimed todos if present
        if (backupData['untimed_todos']) {
          localStorage.setItem('life_os_untimed_todos', JSON.stringify(backupData['untimed_todos']));
        }

        alert("Database successfully restored! Relocking and reloading workspace now...");
        window.location.reload();
      } catch (err: any) {
        alert("Restoring fault: Could not validate or unpack backup file. Error: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Save Lock Configuration (PIN and/or Timeout minutes)
  const handleUpdateSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    // Load active settings
    let savedPin = '';
    const saved = localStorage.getItem('life_os_lock_cfg');
    if (saved) {
      try {
        savedPin = JSON.parse(saved).pin || '';
      } catch (e) {}
    }

    let finalPin = savedPin;

    if (pin.trim()) {
      // Setup pin validity checks
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        setSecurityError('PIN must be exactly 4 digits.');
        return;
      }
      if (pin !== reenteredPin) {
        setSecurityError('PIN confirmation does not match.');
        return;
      }
      finalPin = pin.trim();
    }

    // Save final state
    localStorage.setItem('life_os_lock_cfg', JSON.stringify({
      pin: finalPin,
      timeoutMinutes: timeoutMinutes
    }));

    setHasPasscodeSet(!!finalPin);
    setPin('');
    setReenteredPin('');
    setSecuritySuccess('Security lock settings applied successfully!');

    // Dispatch reload event for SecurityLock component to respond immediately
    window.dispatchEvent(new Event('life_os_lock_update'));
  };

  // Disable lock
  const handleDisableLock = () => {
    const confirmed = window.confirm('Are you sure you want to disable Master PIN lock protection completely?');
    if (!confirmed) return;

    localStorage.setItem('life_os_lock_cfg', JSON.stringify({
      pin: '',
      timeoutMinutes: timeoutMinutes
    }));

    setHasPasscodeSet(false);
    setSecuritySuccess('Master PIN lock protection has been disabled.');
    window.dispatchEvent(new Event('life_os_lock_update'));
  };

  return (
    <div id="system-settings-view" className="space-y-6">
      
      {/* 1. Page Header Summary */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div className="h-10 w-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <Key className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-base text-zinc-100">System Customization & Control Centre</h2>
          <p className="text-3xs text-zinc-500 font-mono tracking-wide mt-0.5 uppercase">
            CONFIG LOCK CODES, LOCAL DATABASE BACKUPS & CLOUD SYNC PORTAL
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns (Security & Backups) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* SECURITY: Master Lock Panel */}
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="font-display font-semibold text-sm text-zinc-250">Master Lock Shield</h3>
              </div>
              <span className={`text-4xs font-mono px-2 py-0.5 rounded-full border ${
                hasPasscodeSet 
                  ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' 
                  : 'bg-yellow-950/20 border-yellow-800 text-yellow-400 animate-pulse'
              }`}>
                {hasPasscodeSet ? 'SHIELD ENABLED' : 'NO LOCK SET'}
              </span>
            </div>

            {securityError && (
              <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg">{securityError}</p>
            )}
            {securitySuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg">{securitySuccess}</p>
            )}

            <form onSubmit={handleUpdateSecuritySettings} className="space-y-4">
              
              {/* Optional Code configuration */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-4xs font-mono text-zinc-500 uppercase font-bold mb-1">
                    {hasPasscodeSet ? 'Change 4-Digit PIN' : 'New 4-Digit PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full tracking-widest text-center font-mono p-2 bg-[#09090b] border border-zinc-800 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-4xs font-mono text-zinc-500 uppercase font-bold mb-1">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={reenteredPin}
                    onChange={(e) => setReenteredPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full tracking-widest text-center font-mono p-2 bg-[#09090b] border border-zinc-800 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Inactivity timeout configuration */}
              <div>
                <label className="block text-4xs font-mono text-zinc-500 uppercase font-bold mb-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Auto-Lock Inactivity Timeout
                </label>
                <select
                  value={timeoutMinutes}
                  onChange={(e) => setTimeoutMinutes(parseInt(e.target.value, 10))}
                  className="w-full text-xs bg-[#09090b] border border-zinc-805 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-250 cursor-pointer"
                >
                  <option value={1}>1 Minute</option>
                  <option value={2}>2 Minutes</option>
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={-1}>Never Lock (Deactivate Inactivity Timer)</option>
                </select>
                <p className="text-4xs font-mono text-zinc-600 mt-1">
                  Locks the application after choice elapsed time. Keeps code columns protected during active sprints.
                </p>
              </div>

              <div className="flex gap-2.5 pt-1.5">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-3xs font-mono uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" /> Apply Lock Controls
                </button>
                {hasPasscodeSet && (
                  <button
                    type="button"
                    onClick={handleDisableLock}
                    className="py-1.5 px-3 border border-red-950/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 font-bold text-3xs font-mono uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Disable PIN
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* LOCAL FILE DATABASE: Download/Upload Local Backups */}
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Download className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="font-display font-semibold text-sm text-zinc-250">Offline Local Backups</h3>
              </div>
              <span className="text-4xs font-mono text-zinc-550 uppercase">JSON FORMAT</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Export your entire local IndexedDB dataset — including studying history, targets, active jobs pipelines, objectives, habits history, project cards, and quick tasks — instantly into a single backup JSON file, or restore from a previous JSON code backup.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Download JSON Button */}
              <button
                id="btn-download-json-backup"
                onClick={handleDownloadBackup}
                className="py-2.5 bg-[#09090b] border border-zinc-800 hover:bg-zinc-850 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:border-zinc-750"
              >
                <Download className="h-4 w-4 text-indigo-400" /> 
                Download JSON Backup
              </button>

              {/* Upload JSON file block */}
              <label className="py-2.5 bg-[#09090b] border border-zinc-800 hover:bg-zinc-850 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:border-zinc-750 text-center">
                <Upload className="h-4 w-4 text-emerald-400" />
                Restore Backup File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-4xs font-mono text-center text-zinc-600">
              *Local file backups allow 100% data export privacy. No cloud needed.
            </p>
          </div>

        </div>

        {/* Right Columns (Cloud Apps Script Configurations) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a]/80 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="font-display font-semibold text-sm text-zinc-250 font-bold">Infinite Sheets Cloud Connect</h3>
              </div>
              <div className="flex items-center gap-1 text-4xs font-mono px-2 py-0.5 rounded-full border border-zinc-820 bg-[#09090b]">
                <span className={`h-1 w-1 rounded-full ${syncConfig.appsScriptUrl ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="text-zinc-500 font-bold">{syncConfig.appsScriptUrl ? 'LINKED' : 'OFFLINE'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-4xs font-mono text-zinc-500 mb-1 leading-normal font-bold">
                  GOOGLE APPS SCRIPT API DEPLOYMENT LINK
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-gas-url"
                    type="text"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 text-xs bg-[#09090b] border border-zinc-c border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 text-zinc-150 placeholder-zinc-700"
                  />
                  <button
                    id="btn-save-gas-url"
                    onClick={saveUrl}
                    className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-3xs font-mono uppercase tracking-wider font-bold rounded-lg border-0 transition-all cursor-pointer shadow-md"
                  >
                    Save URL
                  </button>
                </div>
              </div>

              {syncConfig.appsScriptUrl && (
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <button
                    id="btn-test-cloud-conn"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="py-2 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-305 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 text-indigo-400 ${testStatus === 'testing' ? 'animate-spin' : ''}`} /> Test Link
                  </button>
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-end">
                    Last Sync: {syncConfig.lastSyncedAt ? new Date(syncConfig.lastSyncedAt).toLocaleString() : 'Never'}
                  </div>
                </div>
              )}
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg text-3xs font-mono border ${
                testStatus === 'success' 
                  ? 'bg-emerald-500/5 border-emerald-550/20 text-emerald-400' 
                  : 'bg-red-500/5 border-red-550/20 text-red-400'
              }`}>
                <div className="font-bold mb-0.5">{testStatus === 'success' ? 'CONNECTED' : 'CONNECTION FAULT'}</div>
                <p className="text-2xs leading-relaxed">{testResult}</p>
              </div>
            )}
          </div>

          {syncConfig.appsScriptUrl && (
            <div className="bg-[#0c0c0e] rounded-xl border border-zinc-850 p-5 space-y-4 shadow-md">
              <h4 className="font-display font-semibold text-xs text-zinc-200 uppercase tracking-wider font-bold">Cloud Command Board</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  id="btn-cloud-push"
                  onClick={triggerPush}
                  disabled={isPushing}
                  className="py-2.5 bg-[#09090b] border border-zinc-800 hover:bg-[#121217] text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPushing ? <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" /> : <Server className="h-4 w-4 text-indigo-400" />}
                  Force Cloud Push (Backup)
                </button>

                <button
                  id="btn-cloud-pull"
                  onClick={triggerPull}
                  disabled={isPulling}
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isPulling ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : <Database className="h-4 w-4 text-white" />}
                  Force Local Pull (Restore)
                </button>
              </div>
            </div>
          )}

          {/* Guide Stubs */}
          <div className="bg-[#0c0c0e] rounded-xl border border-zinc-850 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-indigo-400" />
                <h3 className="font-display font-semibold text-sm text-zinc-250">Sheet Storage Set up</h3>
              </div>
              <button
                id="btn-copy-apps-script"
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-zinc-800 bg-[#09090b] hover:bg-[#121217] text-zinc-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy API Scripts'}
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-2xs text-zinc-400 font-mono leading-relaxed">
              <li>Create a sheet named <span className="text-zinc-200">Life OS Database</span>.</li>
              <li>Under <span className="text-zinc-200">Extensions</span> check <span className="text-zinc-200">Apps Script</span>.</li>
              <li>Paste the API script from above copying.</li>
              <li>Choose Deploy &amp; select <span className="text-zinc-200">Web App</span>. Set access to <span className="text-zinc-200">"Anyone"</span>.</li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
}
