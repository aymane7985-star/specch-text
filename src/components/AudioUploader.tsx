import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, Play, Pause, Trash2, ArrowRight } from 'lucide-react';

interface AudioUploaderProps {
  onAudioSelected: (audioBlob: Blob, durationSeconds: number, mimeType: string, filename: string) => void;
  isProcessing: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onAudioSelected,
  isProcessing,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|flac|aac)$/i)) {
      alert('Veuillez sélectionner un fichier audio valide (MP3, WAV, M4A, WEBM, OGG).');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Get duration
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setDuration(Math.round(tempAudio.duration) || 5);
    };
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const togglePlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const clearFile = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setSelectedFile(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitAudio = () => {
    if (!selectedFile) return;
    onAudioSelected(selectedFile, duration, selectedFile.type || 'audio/webm', selectedFile.name);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-amber-500/50 bg-slate-900/40 hover:bg-slate-900/70'
          }`}
        >
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200 mb-1">
            أو اسحب وأفلت ملف صوتي هنا، أو انقر للاختيار
          </p>
          <p className="text-xs text-slate-400">
            MP3, WAV, M4A, WEBM, OGG (jusqu'à 25 Mo)
          </p>
        </div>
      ) : (
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col gap-3">
          {audioUrl && (
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div>
                <p className="text-sm font-bold text-slate-100 truncate max-w-[200px] md:max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {duration ? `${duration} ثانية` : 'صوت'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearFile}
                disabled={isProcessing}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={submitAudio}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs md:text-sm shadow-md transition-colors disabled:opacity-50"
              >
                <span>تحويل بالـ AI</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
