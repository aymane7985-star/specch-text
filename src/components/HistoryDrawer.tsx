import React from 'react';
import { History, Trash2, Copy, Check, Clock, Sparkles, X } from 'lucide-react';
import { TranscriptionItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranscriptionItem[];
  onSelectItem: (item: TranscriptionItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onClearHistory,
  onDeleteItem,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">سجل التحويلات السابقة</h3>
              <p className="text-xs text-slate-400">{items.length} نصوص مسجلة محلياً</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Vider l'historique"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Clock className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">لا يوجد نصوص سابقة حتى الآن</p>
              <p className="text-xs text-slate-600 mt-1">
                سجل صوتك أو ارفع ملف صوتي ليظهر هنا
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className="group p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-amber-500/30 transition-all cursor-pointer flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-1.5">
                    {item.duration && <span>{item.duration} ثانية</span>}
                    <span className="text-amber-400/80">• {item.wordCount || item.text.split(' ').length} كلمة</span>
                  </div>
                </div>

                <p dir="rtl" className="text-xs md:text-sm font-['Cairo'] text-slate-200 line-clamp-3 leading-relaxed">
                  {item.text}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.model || 'Whisper-large-v3-turbo'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleCopy(e, item.text, item.id)}
                      className="p-1 rounded text-slate-400 hover:text-amber-400"
                      title="Copier"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-400"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
