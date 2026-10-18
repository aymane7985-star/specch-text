import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
  isPaused: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  stream,
  isRecording,
  isPaused,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isRecording || !stream || isPaused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = Math.max(4, (dataArray[i] / 255) * canvas.height * 0.9);

          // Gradient color: Amber to Orange/Emerald
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#f59e0b'); // amber-500
          gradient.addColorStop(0.6, '#fbbf24'); // amber-400
          gradient.addColorStop(1, '#10b981'); // emerald-500

          ctx.fillStyle = gradient;
          const y = (canvas.height - barHeight) / 2;
          
          // Draw rounded bar
          ctx.beginPath();
          ctx.roundRect(x, y, Math.max(2, barWidth - 3), barHeight, 4);
          ctx.fill();

          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.warn('AudioVisualizer setup error:', e);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stream, isRecording, isPaused]);

  return (
    <div className="w-full flex items-center justify-center h-16 bg-slate-900/60 rounded-xl border border-slate-800/80 px-4 py-2">
      {isRecording && !isPaused ? (
        <canvas
          ref={canvasRef}
          width={280}
          height={50}
          className="w-full max-w-xs h-12"
        />
      ) : isPaused ? (
        <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span>التسجيل متوقف مؤقتاً (En pause)</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 h-8">
          {[12, 24, 16, 32, 20, 28, 14, 30, 18, 10].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-slate-700/60 rounded-full transition-all duration-300"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
