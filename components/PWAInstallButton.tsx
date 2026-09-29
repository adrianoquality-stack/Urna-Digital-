'use client';

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Se já estiver rodando em modo aplicativo instalado, oculta o botão
  if (isInstalled) {
    return null;
  }

  // Fluxo Padrão (Android, Chrome, Edge, Desktop)
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-lg bg-[#3A7D44] hover:bg-[#2E6637] active:scale-95 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer border border-emerald-600 ${className}`}
        title="Instalar aplicativo na tela inicial do seu celular ou computador"
      >
        <Download className="w-3.5 h-3.5 text-[#C9A227]" />
        <span>Instalar App PWA</span>
      </button>
    );
  }

  // Fluxo iOS Safari (WebKit não suporta beforeinstallprompt nativo)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 px-3 py-1.5 text-xs font-bold text-white border border-white/30 shadow-xs transition-all cursor-pointer ${className}`}
          title="Instalar no iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border-2 border-[#C9A227] text-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1B2A4A] flex items-center justify-center text-[#C9A227]">
                    <Download className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#1B2A4A]">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    No Safari, toque no botão <strong>Compartilhar</strong> (ícone <Share className="w-3.5 h-3.5 inline text-[#1B2A4A]" /> na barra inferior).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    Role as opções e toque em <strong>Adicionar à Tela de Início</strong> (ícone <PlusSquare className="w-3.5 h-3.5 inline text-[#1B2A4A]" />).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#3A7D44] text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div>
                    Toque em <strong>Adicionar</strong> no canto superior direito para concluir!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#1B2A4A] py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback se não for disparado ainda ou não suportado (exibe botão informativo)
  return (
    <button
      onClick={() => {
        alert('Para instalar o app PWA:\n\n• No Google Chrome / Edge: clique no ícone de instalar na barra de endereços (ou no menu ⋮ > "Instalar Colinha 2026").\n• No celular: toque no menu ⋮ do navegador e selecione "Adicionar à tela inicial".');
      }}
      className={`flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 px-3 py-1.5 text-xs font-bold text-white border border-white/25 shadow-xs transition-all cursor-pointer ${className}`}
      title="Como instalar o App PWA"
    >
      <Download className="w-3.5 h-3.5 text-[#C9A227]" />
      <span>Instalar App</span>
    </button>
  );
};
