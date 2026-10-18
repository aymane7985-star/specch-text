import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  Edit3,
  Sparkles,
  Share2,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
} from 'lucide-react';
import { TranscriptionItem } from '../types';

interface TranscriptionDisplayProps {
  item: TranscriptionItem | null;
  onUpdateText?: (newText: string) => void;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  item,
  onUpdateText,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [fontSize, setFontSize] = useState<'text-lg' | 'text-xl' | 'text-2xl'>('text-xl');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!item || !item.text) {
    return (
      <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 border-dashed">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4">
          <Sparkles className="w-8 h-8 text-amber-500/60" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-1">في انتظار الصوت...</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          تحدث عبر الميكروفون بالأعلى أو حمّل ملفاً صوتياً لتحويله إلى نص عربي فورياً عبر Whisper-large-v3-turbo.
        </p>
      </div>
    );
  }

  const activeText = isEditing ? editedText : item.text;

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Arabic Text-to-Speech
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('La synthèse vocale n’est pas supportée sur ce navigateur.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeText);
    utterance.lang = item.task === 'translate' ? 'en-US' : 'ar-SA';
    utterance.rate = 0.95;

    // Try finding Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
    if (arabicVoice && item.task !== 'translate') {
      utterance.voice = arabicVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Download export files
  const downloadFile = (format: 'txt' | 'srt' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    const filename = `transcription-whisper-ar-${Date.now()}`;

    if (format === 'txt') {
      content = activeText;
    } else if (format === 'srt') {
      content = `1\n00:00:00,000 --> 00:00:${String(item.duration || 5).padStart(2, '0')},000\n${activeText}\n`;
    } else if (format === 'json') {
      mimeType = 'application/json';
      content = JSON.stringify(
        {
          model: item.model || '@cf/openai/whisper-large-v3-turbo',
          text: activeText,
          wordCount: activeText.trim().split(/\s+/).length,
          timestamp: item.timestamp,
          duration: item.duration,
          dialect: item.dialect,
        },
        null,
        2
      );
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startEdit = () => {
    setEditedText(item.text);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (onUpdateText) {
      onUpdateText(editedText);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl transition-all">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-800/40 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs md:text-sm font-bold text-slate-200">
            النص العربي المستخرج (Transcription)
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-mono">
            {item.model || 'Whisper-large-v3-turbo'}
          </span>
        </div>

        {/* Font size and counts */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{activeText.trim().split(/\s+/).length} كلمة</span>
          <span>•</span>
          <span>{activeText.length} حرف</span>

          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setFontSize('text-lg')}
              className={`p-1 rounded ${fontSize === 'text-lg' ? 'bg-slate-700 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
              title="تصغير الخط"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFontSize('text-2xl')}
              className={`p-1 rounded ${fontSize === 'text-2xl' ? 'bg-slate-700 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
              title="تكبير الخط"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Text Content */}
      <div className="p-6 md:p-8 min-h-[140px] flex items-center">
        {isEditing ? (
          <div className="w-full space-y-3">
            <textarea
              dir="rtl"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className={`w-full p-4 bg-slate-950 border border-amber-500/50 rounded-2xl text-slate-100 font-['Cairo'] ${fontSize} leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500`}
              rows={5}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <p
              dir={item.task === 'translate' ? 'ltr' : 'rtl'}
              className={`w-full text-slate-100 font-['Cairo'] font-semibold leading-relaxed tracking-wide select-text ${fontSize} transition-all`}
            >
              {activeText}
            </p>

            {item.audioUrl && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                <audio
                  id="transcription-audio-element"
                  src={item.audioUrl}
                  onEnded={() => setIsPlayingAudio(false)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    const audioEl = document.getElementById('transcription-audio-element') as HTMLAudioElement;
                    if (audioEl) {
                      if (isPlayingAudio) {
                        audioEl.pause();
                        setIsPlayingAudio(false);
                      } else {
                        audioEl.play();
                        setIsPlayingAudio(true);
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  {isPlayingAudio ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isPlayingAudio ? 'إيقاف الصوت الأصلي' : 'استمع للتسجيل الصوتي'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950/60 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ النص'}</span>
          </button>

          {/* Read Aloud Button */}
          <button
            onClick={handleSpeak}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              isSpeaking
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span>{isSpeaking ? 'إيقاف القراءة' : 'قراءة صوتية'}</span>
          </button>

          {/* Inline Edit */}
          {!isEditing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>تعديل</span>
            </button>
          )}
        </div>

        {/* Export dropdown / buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 ml-1">تصدير:</span>
          <button
            onClick={() => downloadFile('txt')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700"
            title="Télécharger en format texte"
          >
            .TXT
          </button>
          <button
            onClick={() => downloadFile('srt')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700"
            title="Sous-titres SRT"
          >
            .SRT
          </button>
          <button
            onClick={() => downloadFile('json')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700"
            title="Format JSON complet"
          >
            .JSON
          </button>
        </div>
      </div>
    </div>
  );
};
