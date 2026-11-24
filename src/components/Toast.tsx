import React from 'react';
import { Check, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-18 md:bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-950 text-white rounded-xl shadow-lg border border-emerald-800 text-xs sm:text-sm animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5" />
      </div>
      <span className="font-medium text-emerald-50">{message}</span>
    </div>
  );
};
