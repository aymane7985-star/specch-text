import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Pause, Play, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface MicrophoneRecorderProps {
  onAudioReady: (audioBlob: Blob, durationSeconds: number, mimeType: string) => void;
  isProcessing: boolean;
  activeModelName?: string;
}

export const MicrophoneRecorder: React.FC<MicrophoneRecorderProps> = ({
  onAudioReady,
  isProcessing,
  activeModelName = '@cf/openai/whisper-large-v3-turbo',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
    timerIntervalRef.current = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
  };

  // Start recording
  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ne supporte pas la capture audio.');
      }

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setStream(audioStream);

      // Choose supported mimeType
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        '',
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (!mime || MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorder = selectedMime
        ? new MediaRecorder(audioStream, { mimeType: selectedMime })
        : new MediaRecorder(audioStream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const duration = Math.max(1, elapsedSeconds);

        // Stop all tracks
        audioStream.getTracks().forEach((track) => track.stop());
        setStream(null);

        if (audioChunksRef.current.length > 0 && recordedBlob.size > 0) {
          onAudioReady(recordedBlob, duration, recorder.mimeType || 'audio/webm');
        }
      };

      recorder.start(200); // 200ms slices for smooth streaming
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      let msg = 'Impossible d’accéder au microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Veuillez autoriser l’accès au microphone dans votre navigateur.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      setIsRecording(false);
    }
  };

  // Stop recording normally
  const stopRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, [elapsedSeconds]);

  // Pause / Resume
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // Cancel recording without transcribing
  const cancelRecording = () => {
    stopTimer();
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsRecording(false);
    setIsPaused(false);
    setElapsedSeconds(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-b from-slate-900/90 to-slate-950/90 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl">
      {/* Top Status & Model Badge */}
      <div className="flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs md:text-sm font-medium">
        <Sparkles className="w-4 h-4 animate-spin text-amber-400" style={{ animationDuration: '6s' }} />
        <span>النموذج: <code className="font-mono text-amber-300 font-bold">{activeModelName}</code></span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">Cloudflare Workers AI</span>
      </div>

      {/* Main Microphone Button Area */}
      <div className="relative my-4 flex items-center justify-center">
        {/* Animated pulsating halo rings when recording */}
        {isRecording && !isPaused && (
          <>
            <div className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full bg-red-500/20 animate-ping" />
            <div className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full bg-amber-500/25 animate-pulse-ring" />
          </>
        )}

        {/* The tactile Mic Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          dir="ltr"
          aria-label={isRecording ? 'Arrêter et transcrire' : 'Commencer à parler'}
          className={`relative z-10 group flex items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full transition-all duration-300 shadow-xl focus:outline-none focus:ring-4 ${
            isProcessing
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-4 border-slate-700'
              : isRecording
              ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white hover:scale-105 active:scale-95 shadow-red-500/30 border-4 border-white/20 focus:ring-red-500/40'
              : 'bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 hover:scale-105 active:scale-95 shadow-amber-500/25 hover:shadow-amber-500/40 border-4 border-amber-300/40 focus:ring-amber-400/50'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 md:w-16 md:h-16 animate-spin text-amber-400" />
          ) : isRecording ? (
            <Square className="w-10 h-10 md:w-14 md:h-14 fill-current transition-transform group-hover:scale-90" />
          ) : (
            <Mic className="w-12 h-12 md:w-16 md:h-16 transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* Status Instruction / Timer */}
      <div className="mt-4 text-center">
        {isProcessing ? (
          <div className="space-y-1">
            <p className="text-base md:text-lg font-bold text-amber-300 animate-pulse">
              جاري معالجة الصوت وتحويله إلى نص عربي...
            </p>
            <p className="text-xs text-slate-400">
              Traitement par Whisper-large-v3-turbo de Cloudflare
            </p>
          </div>
        ) : isRecording ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-500/30 rounded-full text-red-300 text-sm font-mono font-bold tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>{formatTime(elapsedSeconds)}</span>
              <span>- جاري التسجيل</span>
            </div>
            <p className="text-sm text-slate-300">
              تحدث باللغة العربية بوضوح، ثم اضغط على الزر للإيقاف والتحويل
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-base md:text-lg font-bold text-slate-100">
              اضغط على الميكروفون وابدأ في التحدث
            </p>
            <p className="text-xs text-slate-400">
              Cliquez pour enregistrer votre voix en arabe (Fusha ou dialecte)
            </p>
          </div>
        )}
      </div>

      {/* Visualizer & Extra Controls when recording */}
      {isRecording && (
        <div className="w-full max-w-md mt-6 space-y-4">
          <AudioVisualizer stream={stream} isRecording={isRecording} isPaused={isPaused} />

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={togglePause}
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
              <span>{isPaused ? 'استئناف' : 'إيقاف مؤقت'}</span>
            </button>

            <button
              onClick={cancelRecording}
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 transition-colors"
            >
              <X className="w-4 h-4 text-red-400" />
              <span>إلغاء التسجيل</span>
            </button>

            <button
              onClick={stopRecording}
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-colors"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>إنهاء وتحويل</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 p-3 text-sm text-red-300 bg-red-950/60 border border-red-800/50 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
