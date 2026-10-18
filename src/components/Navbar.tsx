import React from 'react';
import {
  Mic2,
  Cloud,
  Settings,
  History,
  Languages,
  Sparkles,
} from 'lucide-react';
import { ArabicDialect } from '../types';
import { DIALECTS } from '../constants';

interface NavbarProps {
  selectedDialect: ArabicDialect;
  onSelectDialect: (dialect: ArabicDialect) => void;
  task: 'transcribe' | 'translate';
  onToggleTask: (task: 'transcribe' | 'translate') => void;
  onOpenDeployModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenHistoryDrawer: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedDialect,
  onSelectDialect,
  task,
  onToggleTask,
  onOpenDeployModal,
  onOpenSettingsModal,
  onOpenHistoryDrawer,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Mic2 className="w-5 h-5 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-['Cairo']">
                صوتيـفـاي <span className="text-amber-400 text-sm font-sans font-bold">Sawtify</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Cloud className="w-3 h-3" />
                Whisper-large-v3-turbo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              تحويل الصوت العربي إلى نص • Cloudflare Workers AI
            </p>
          </div>
        </div>

        {/* Center Dialect & Task Pills (visible on medium+ screens) */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1">
            {DIALECTS.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelectDialect(d.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  selectedDialect === d.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {d.arabicName}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Task Mode Toggle */}
          <button
            onClick={() => onToggleTask(task === 'transcribe' ? 'translate' : 'transcribe')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              task === 'translate'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Basculer entre transcription arabe directe et traduction anglaise"
          >
            {task === 'transcribe' ? 'تحويل مباشر (نص)' : 'ترجمة للإنجليزية'}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Cloudflare Deploy Button */}
          <button
            onClick={onOpenDeployModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold transition-all"
            title="Déployer sur Cloudflare Workers"
          >
            <Cloud className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Cloudflare Workers</span>
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistoryDrawer}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Historique des transcriptions"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Paramètres API"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
