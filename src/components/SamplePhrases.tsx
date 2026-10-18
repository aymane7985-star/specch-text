import React, { useState } from 'react';
import { Play, Sparkles, Volume2 } from 'lucide-react';
import { SAMPLE_AUDIO_TEXTS } from '../constants';
import { ArabicDialect } from '../types';

interface SamplePhrasesProps {
  onSelectSampleText: (text: string, dialect: ArabicDialect) => void;
  disabled?: boolean;
}

export const SamplePhrases: React.FC<SamplePhrasesProps> = ({
  onSelectSampleText,
  disabled = false,
}) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const previewVoice = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setPlayingIndex(index);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;
    utterance.onend = () => setPlayingIndex(null);
    utterance.onerror = () => setPlayingIndex(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>نماذج صوتية سريعة للتجربة الفورية (Échantillons arabes)</span>
        </h4>
        <span className="text-[11px] text-slate-500">انقر للتجربة مباشرة</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SAMPLE_AUDIO_TEXTS.map((sample, idx) => (
          <div
            key={idx}
            className="group p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/30 flex items-center justify-between gap-2 transition-all cursor-pointer"
            onClick={() => !disabled && onSelectSampleText(sample.text, sample.dialect)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-300">
                  {sample.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {sample.desc}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-['Cairo'] truncate" dir="rtl">
                "{sample.text}"
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  previewVoice(sample.text, idx);
                }}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors ${
                  playingIndex === idx ? 'text-amber-400 animate-pulse' : ''
                }`}
                title="Écouter l'échantillon"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={disabled}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-slate-950 text-amber-300 text-xs font-bold transition-all"
              >
                تجربة
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
