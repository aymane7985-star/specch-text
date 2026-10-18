import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MicrophoneRecorder } from './components/MicrophoneRecorder';
import { AudioUploader } from './components/AudioUploader';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { SamplePhrases } from './components/SamplePhrases';
import { CloudflareDeployModal } from './components/CloudflareDeployModal';
import { SettingsModal } from './components/SettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ArabicDialect, CloudflareSettings, TranscriptionItem } from './types';
import { DIALECTS } from './constants';
import {
  Mic,
  Upload,
  Sparkles,
  Cloud,
  CheckCircle2,
  Terminal,
  Globe,
  Radio,
  Layers,
} from 'lucide-react';

const STORAGE_KEY_HISTORY = 'sawtify_transcription_history_v1';
const STORAGE_KEY_SETTINGS = 'sawtify_cf_settings_v1';

export default function App() {
  const [selectedDialect, setSelectedDialect] = useState<ArabicDialect>('standard');
  const [task, setTask] = useState<'transcribe' | 'translate'>('transcribe');
  const [activeTab, setActiveTab] = useState<'mic' | 'upload' | 'samples'>('mic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTranscription, setActiveTranscription] = useState<TranscriptionItem | null>(null);
  const [history, setHistory] = useState<TranscriptionItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Cloudflare Settings
  const [cfSettings, setCfSettings] = useState<CloudflareSettings>({
    accountId: '',
    apiToken: '',
    workerUrl: '',
  });

  // Load persisted history & settings
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (storedSettings) {
        setCfSettings(JSON.parse(storedSettings));
      }
    } catch (e) {
      console.warn('Failed to load local storage', e);
    }
  }, []);

  // Save settings
  const handleSaveSettings = (newSettings: CloudflareSettings) => {
    setCfSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  };

  // Add to history
  const addToHistory = (item: TranscriptionItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.filter((i) => i.id !== item.id)].slice(0, 30);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save history', e);
      }
      return updated;
    });
  };

  // Handle Speech Audio Blob (from Mic or Upload)
  const handleAudioReady = async (
    audioBlob: Blob,
    durationSeconds: number,
    mimeType: string,
    filename?: string
  ) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const audioUrl = URL.createObjectURL(audioBlob);

    try {
      const headers: Record<string, string> = {
        'Content-Type': mimeType || 'audio/webm',
        'X-Task': task,
        'X-Language': 'ar',
        'X-Dialect': selectedDialect,
      };

      if (cfSettings.workerUrl) {
        headers['X-Cf-Worker-Url'] = cfSettings.workerUrl;
      }
      if (cfSettings.accountId && cfSettings.apiToken) {
        headers['X-Cf-Account-Id'] = cfSettings.accountId;
        headers['X-Cf-Api-Token'] = cfSettings.apiToken;
      }

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers,
        body: audioBlob,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur serveur HTTP ${response.status}`);
      }

      const result = await response.json();
      const transcribedText = result.text || '';

      const newItem: TranscriptionItem = {
        id: `tx_${Date.now()}`,
        text: transcribedText,
        timestamp: Date.now(),
        duration: durationSeconds,
        dialect: selectedDialect,
        task,
        wordCount: result.wordCount || transcribedText.split(/\s+/).filter(Boolean).length,
        audioUrl,
        provider: result.provider || 'cloudflare-workers-ai',
        model: result.model || '@cf/openai/whisper-large-v3-turbo',
      };

      setActiveTranscription(newItem);
      addToHistory(newItem);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(
        err.message || 'Une erreur est survenue lors de la transcription. Veuillez réessayer.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Sample selection
  const handleSelectSampleText = (text: string, dialect: ArabicDialect) => {
    setSelectedDialect(dialect);
    const newItem: TranscriptionItem = {
      id: `sample_${Date.now()}`,
      text,
      timestamp: Date.now(),
      duration: 4,
      dialect,
      task: 'transcribe',
      wordCount: text.split(/\s+/).length,
      provider: 'sample-preset',
      model: '@cf/openai/whisper-large-v3-turbo',
    };
    setActiveTranscription(newItem);
    addToHistory(newItem);
  };

  // Clear history
  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (e) {
      console.warn('Failed to clear history', e);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update history', e);
      }
      return updated;
    });
  };

  const currentDialectObj = DIALECTS.find((d) => d.id === selectedDialect) || DIALECTS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        selectedDialect={selectedDialect}
        onSelectDialect={setSelectedDialect}
        task={task}
        onToggleTask={setTask}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
        historyCount={history.length}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-yellow-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold shadow-inner">
            <Cloud className="w-4 h-4 text-orange-400" />
            <span>Cloudflare Workers AI • Modèle:</span>
            <code className="font-mono text-orange-200 font-bold">@cf/openai/whisper-large-v3-turbo</code>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            تحويل الصوت العربي إلى نص مكتوب فورياً
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            تحدث باللغة العربية الفصحى أو اللهجات الدارجة (المغربية، المصرية، الشامية، الخليجية). يتعرف نموذج Whisper Turbo على الكلام ويحوله إلى نص بدقة عالية.
          </p>
        </div>

        {/* Dialect & Mode Selector on Mobile */}
        <div className="lg:hidden flex flex-col gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <label className="text-xs font-bold text-slate-300">اختر اللهجة أو الفصحى :</label>
          <div className="flex flex-wrap gap-1.5">
            {DIALECTS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDialect(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedDialect === d.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {d.arabicName}
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
            <span className="text-slate-400">طريقة التحويل :</span>
            <button
              onClick={() => setTask(task === 'transcribe' ? 'translate' : 'transcribe')}
              className="px-3 py-1 rounded-lg bg-slate-800 text-amber-300 font-bold"
            >
              {task === 'transcribe' ? 'تحويل نص عربي' : 'ترجمة للإنجليزية'}
            </button>
          </div>
        </div>

        {/* Active Dialect Info Banner */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>اللهجة المحددة: <strong className="text-amber-300">{currentDialectObj.arabicName}</strong> ({currentDialectObj.region})</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">
            النمط: {task === 'transcribe' ? 'تحويل مباشر إلى نص عربي' : 'ترجمة دقيقة إلى الإنجليزية'}
          </span>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-400 hover:text-white px-2 py-1"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Input Switcher Tabs: Microphone / File Upload / Samples */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('mic')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'mic'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>تسجيل بالميكروفون</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'upload'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>رفع ملف صوتي</span>
            </button>

            <button
              onClick={() => setActiveTab('samples')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'samples'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>نماذج جاهزة</span>
            </button>
          </div>

          {/* Interactive Card */}
          <div className="w-full">
            {activeTab === 'mic' && (
              <MicrophoneRecorder
                onAudioReady={handleAudioReady}
                isProcessing={isProcessing}
                activeModelName="@cf/openai/whisper-large-v3-turbo"
              />
            )}

            {activeTab === 'upload' && (
              <div className="p-6 bg-slate-900/60 rounded-3xl border border-slate-800">
                <AudioUploader
                  onAudioSelected={handleAudioReady}
                  isProcessing={isProcessing}
                />
              </div>
            )}

            {activeTab === 'samples' && (
              <div className="p-6 bg-slate-900/60 rounded-3xl border border-slate-800">
                <SamplePhrases
                  onSelectSampleText={handleSelectSampleText}
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>
        </div>

        {/* Output Section: Transcription Display */}
        <div className="space-y-3">
          <TranscriptionDisplay
            item={activeTranscription}
            onUpdateText={(newText) => {
              if (activeTranscription) {
                const updated = { ...activeTranscription, text: newText };
                setActiveTranscription(updated);
                addToHistory(updated);
              }
            }}
          />
        </div>

        {/* Cloudflare Workers Deployment Card Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/30 border border-orange-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>تطبيق مهيأ بالكامل للنشر على Cloudflare Workers</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready to Deploy
                </span>
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                تم إنشاء ملفات <code className="text-orange-300">wrangler.jsonc</code> و <code className="text-orange-300">src/worker.ts</code> التي تستغل خدمة <code className="text-orange-300">env.AI.run('@cf/openai/whisper-large-v3-turbo')</code> مع استضافة الواجهة كـ Static Assets.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all shrink-0"
          >
            <Terminal className="w-4 h-4" />
            <span>عرض أوامر النشر (Deploy Guide)</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <p className="max-w-md mx-auto px-4">
          Sawtify • محرك تحويل الصوت العربي بالذكاء الاصطناعي مع Whisper-large-v3-turbo و Cloudflare Workers AI.
        </p>
      </footer>

      {/* Modals & Drawers */}
      <CloudflareDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        workerUrl={cfSettings.workerUrl}
        onSaveWorkerUrl={(url) => handleSaveSettings({ ...cfSettings, workerUrl: url })}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={cfSettings}
        onSave={handleSaveSettings}
      />

      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        items={history}
        onSelectItem={setActiveTranscription}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
      />
    </div>
  );
}
