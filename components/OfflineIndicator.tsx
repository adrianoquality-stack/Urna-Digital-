'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#1B2A4A] border-2 border-[#C9A227] px-3.5 py-2 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-4 h-4 text-[#C9A227] animate-pulse" />
      <span>Modo Offline — O simulador e a colinha funcionam 100% sem internet!</span>
    </div>
  );
};
