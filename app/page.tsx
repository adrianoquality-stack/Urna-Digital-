'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  CheckCircle2, 
  RotateCcw, 
  Printer, 
  Share2, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  FileText, 
  Check, 
  Vote, 
  ShieldCheck, 
  Star, 
  ExternalLink,
  Download
} from 'lucide-react';

interface StepInfo {
  id: 'fed' | 'est' | 'sen1' | 'sen2' | 'gov' | 'pres';
  title: string;
  shortLabel: string;
  digits: number;
  isLocked?: boolean;
}

const STEPS: StepInfo[] = [
  { id: 'fed', title: 'DEPUTADO FEDERAL', shortLabel: 'Dep. Federal', digits: 4 },
  { id: 'est', title: 'DEPUTADO ESTADUAL', shortLabel: 'Dep. Estadual', digits: 5, isLocked: true },
  { id: 'sen1', title: 'SENADOR (1º VOTO)', shortLabel: 'Senador 1', digits: 3 },
  { id: 'sen2', title: 'SENADOR (2º VOTO)', shortLabel: 'Senador 2', digits: 3 },
  { id: 'gov', title: 'GOVERNADOR', shortLabel: 'Governador', digits: 2 },
  { id: 'pres', title: 'PRESIDENTE DA REPÚBLICA', shortLabel: 'Presidente', digits: 2 }
];

const PARTIDOS: Record<string, string> = {
  '70': 'AVANTE',
  '15': 'MDB',
  '22': 'PL',
  '13': 'PT',
  '45': 'PSDB',
  '10': 'REPUBLICANOS',
  '11': 'PP',
  '55': 'PSD',
  '44': 'UNIÃO BRASIL',
  '40': 'PSB',
  '12': 'PDT',
  '20': 'PODEMOS',
  '77': 'SOLIDARIEDADE',
  '50': 'PSOL',
  '30': 'NOVO',
  '23': 'CIDADANIA',
  '65': 'PCdoB',
  '18': 'REDE'
};

interface VoteRecord {
  number: string;
  label: string;
  party: string;
  isBranco?: boolean;
}

export default function UrnaPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [digitsInput, setDigitsInput] = useState('');
  const [isBranco, setIsBranco] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showLockModal, setShowLockModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false); // tela GRAVANDO -> FIM
  const [fimState, setFimState] = useState<'none' | 'gravando' | 'fim'>('none');
  const [showReceipt, setShowReceipt] = useState(false);

  // Registro de todos os votos concluídos
  const [recordedVotes, setRecordedVotes] = useState<Record<string, VoteRecord>>({
    fed: { number: '', label: '', party: '' },
    est: { number: '70123', label: 'VANILDO NEVES', party: 'AVANTE (70)' },
    sen1: { number: '', label: '', party: '' },
    sen2: { number: '', label: '', party: '' },
    gov: { number: '', label: '', party: '' },
    pres: { number: '', label: '', party: '' }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Inicialização Web Audio API
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Bip de digitação
  const playKeyBeep = useCallback(() => {
    if (!audioEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignorar erros de áudio silenciosamente
    }
  }, [audioEnabled, getAudioContext]);

  // Bip de confirmação padrão
  const playConfirmBeep = useCallback(() => {
    if (!audioEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1200, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.22);
    } catch {
      // Ignorar
    }
  }, [audioEnabled, getAudioContext]);

  // Bip de alerta (trava do 70123 ou repetição de voto de senador)
  const playAlertBeep = useCallback(() => {
    if (!audioEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(210, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.35);
    } catch {
      // Ignorar
    }
  }, [audioEnabled, getAudioContext]);

  // Som FIM oficial do TSE
  const playFimSound = useCallback(() => {
    if (!audioEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 440, duration: 0.12 },
        { freq: 554, duration: 0.12 },
        { freq: 659, duration: 0.12 },
        { freq: 880, duration: 1.2 }
      ];

      let offset = 0;
      notes.forEach((n, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + offset);
        gain.gain.setValueAtTime(0.28, now + offset);
        if (idx === notes.length - 1) {
          gain.gain.setValueAtTime(0.28, now + offset + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + n.duration);
        } else {
          gain.gain.exponentialRampToValueAtTime(0.01, now + offset + n.duration);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + n.duration);
        offset += n.duration;
      });
    } catch {
      // Ignorar
    }
  }, [audioEnabled, getAudioContext]);

  const currentStep = STEPS[currentStepIndex];

  // Ação: Pressionar dígito
  const handleDigit = useCallback((digit: string) => {
    if (isFinishing || showLockModal) return;
    playKeyBeep();
    if (isBranco) {
      setIsBranco(false);
      setDigitsInput(digit);
      return;
    }
    if (digitsInput.length < currentStep.digits) {
      setDigitsInput(prev => prev + digit);
    }
  }, [currentStep.digits, digitsInput.length, isBranco, isFinishing, playKeyBeep, showLockModal]);

  // Ação: Pressionar BRANCO
  const handleBranco = useCallback(() => {
    if (isFinishing || showLockModal) return;
    playKeyBeep();

    // TRAVA CRÍTICA: Deputado Estadual NÃO pode votar em branco!
    if (currentStep.id === 'est') {
      playAlertBeep();
      setShowLockModal(true);
      setDigitsInput('');
      return;
    }

    setDigitsInput('');
    setIsBranco(true);
  }, [currentStep.id, isFinishing, playAlertBeep, playKeyBeep, showLockModal]);

  // Ação: Pressionar CORRIGE
  const handleCorrige = useCallback(() => {
    if (isFinishing) return;
    playKeyBeep();
    setDigitsInput('');
    setIsBranco(false);
    setShowLockModal(false);
  }, [isFinishing, playKeyBeep]);

  // Ação: Pressionar CONFIRMA
  const handleConfirma = useCallback(() => {
    if (isFinishing || showLockModal) return;

    // Se estiver em branco (exceto estadual)
    if (isBranco) {
      if (currentStep.id === 'est') {
        playAlertBeep();
        setShowLockModal(true);
        return;
      }
      playConfirmBeep();
      advanceVote({
        number: 'BRANCO',
        label: 'Voto em Branco',
        party: '--',
        isBranco: true
      });
      return;
    }

    // Se não preencheu todos os dígitos
    if (digitsInput.length < currentStep.digits) {
      playAlertBeep();
      return;
    }

    // TRAVA OBRIGATÓRIA: DEPUTADO ESTADUAL (Vanildo Neves 70123)
    if (currentStep.id === 'est') {
      if (digitsInput !== '70123') {
        playAlertBeep();
        setShowLockModal(true);
        setDigitsInput('');
        return;
      }

      playConfirmBeep();
      advanceVote({
        number: '70123',
        label: 'VANILDO NEVES',
        party: 'AVANTE (70)'
      });
      return;
    }

    // Validação especial: Senador 2 não pode repetir Senador 1
    if (currentStep.id === 'sen2' && recordedVotes.sen1.number && !recordedVotes.sen1.isBranco) {
      if (digitsInput === recordedVotes.sen1.number) {
        playAlertBeep();
        alert('Atenção: O 2º voto para Senador não pode ser para o mesmo candidato do 1º voto. Corrija para avançar.');
        setDigitsInput('');
        return;
      }
    }

    // Outros cargos
    const prefix = digitsInput.slice(0, 2);
    const partyName = PARTIDOS[prefix] ? `${PARTIDOS[prefix]} (${prefix})` : `PARTIDO ${prefix}`;
    const voteData: VoteRecord = {
      number: digitsInput,
      label: currentStep.id === 'fed' ? `Deputado Federal ${digitsInput}` :
             currentStep.id === 'sen1' ? `Senador ${digitsInput}` :
             currentStep.id === 'sen2' ? `Senador ${digitsInput}` :
             currentStep.id === 'gov' ? `Governador ${digitsInput}` :
             `Presidente ${digitsInput}`,
      party: partyName
    };

    playConfirmBeep();
    advanceVote(voteData);
  }, [isFinishing, showLockModal, isBranco, digitsInput, currentStep.digits, currentStep.id, playAlertBeep, playConfirmBeep, recordedVotes.sen1.number, recordedVotes.sen1.isBranco]);

  // Avança para o próximo cargo ou finaliza
  const advanceVote = (voteRecord: VoteRecord) => {
    setRecordedVotes(prev => ({
      ...prev,
      [currentStep.id]: voteRecord
    }));

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setDigitsInput('');
      setIsBranco(false);
    } else {
      // Último cargo (Presidente) -> Finaliza a votação com sinal sonoro clássico TSE
      setIsFinishing(true);
      setFimState('gravando');

      setTimeout(() => {
        setFimState('fim');
        playFimSound();

        setTimeout(() => {
          setIsFinishing(false);
          setShowReceipt(true);
        }, 2200);
      }, 1000);
    }
  };

  // Preenchimento automático do Vanildo Neves na trava
  const autoFillVanildo = () => {
    setShowLockModal(false);
    setDigitsInput('70123');
    setIsBranco(false);
    playKeyBeep();
  };

  // Reiniciar simulador
  const handleResetUrna = () => {
    setCurrentStepIndex(0);
    setDigitsInput('');
    setIsBranco(false);
    setShowLockModal(false);
    setIsFinishing(false);
    setFimState('none');
    setShowReceipt(false);
    setRecordedVotes({
      fed: { number: '', label: '', party: '' },
      est: { number: '70123', label: 'VANILDO NEVES', party: 'AVANTE (70)' },
      sen1: { number: '', label: '', party: '' },
      sen2: { number: '', label: '', party: '' },
      gov: { number: '', label: '', party: '' },
      pres: { number: '', label: '', party: '' }
    });
  };

  // Atalho direto para treinar Deputado Estadual 70123
  const handleJumpToVanildo = () => {
    setCurrentStepIndex(1);
    setDigitsInput('70123');
    setIsBranco(false);
    setShowLockModal(false);
    playKeyBeep();
  };

  // Compartilhamento no WhatsApp
  const handleShareWhatsApp = () => {
    const text = 
`🗳️ *MINHA COLINHA DIGITAL - ELEIÇÕES 2026 (MS)*
Simulei meu voto na Urna Oficial! Confira a minha colinha:

🔹 *Deputado Federal:* ${recordedVotes.fed.number || 'Confira seu candidato'}
⭐ *DEPUTADO ESTADUAL:* *70.123 — VANILDO NEVES (AVANTE)* ⭐
🔹 *Senador (1º Voto):* ${recordedVotes.sen1.number || '---'}
🔹 *Senador (2º Voto):* ${recordedVotes.sen2.number || '---'}
🔹 *Governador:* ${recordedVotes.gov.number || '--'}
🔹 *Presidente:* ${recordedVotes.pres.number || '--'}

✨ *"Trabalho, diálogo e respeito por Mato Grosso do Sul, vote 70.123!"*
👉 Treine você também no Simulador e emita sua colinha: ${typeof window !== 'undefined' ? window.location.href : 'https://vanildoneves70123.com.br'}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Download do arquivo autônomo index.html
  const handleDownloadStandaloneHtml = () => {
    if (typeof window === 'undefined') return;
    const a = document.createElement('a');
    a.href = '/index.html';
    a.download = 'colinha-eleicoes-2026-vanildo-neves-70123.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Listener para Teclado Físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showReceipt) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Enter') {
        handleConfirma();
      } else if (e.key === 'Backspace' || e.key === 'Escape') {
        handleCorrige();
      } else if (e.key.toLowerCase() === 'b') {
        handleBranco();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleConfirma, handleCorrige, handleBranco, handleDigit, showReceipt]);

  // Informações dinâmicas do candidato na tela
  const isEstadualVanildo = currentStep.id === 'est' && digitsInput === '70123';
  const isCandidateReady = digitsInput.length === currentStep.digits && !isBranco;

  const candidatePartyText = isBranco ? '--' :
    isEstadualVanildo ? 'AVANTE (70)' :
    isCandidateReady ? (PARTIDOS[digitsInput.slice(0, 2)] ? `${PARTIDOS[digitsInput.slice(0, 2)]} (${digitsInput.slice(0, 2)})` : `PARTIDO REGISTRADO (${digitsInput.slice(0, 2)})`) :
    '--';

  const candidateNameText = isBranco ? '--' :
    isEstadualVanildo ? 'VANILDO NEVES' :
    isCandidateReady ? (
      currentStep.id === 'fed' ? `CANDIDATO(A) DEPUTADO FEDERAL ${digitsInput}` :
      currentStep.id === 'est' ? `CANDIDATO(A) ESTADUAL ${digitsInput}` :
      currentStep.id === 'sen1' ? `CANDIDATO(A) AO SENADO ${digitsInput}` :
      currentStep.id === 'sen2' ? `CANDIDATO(A) AO SENADO ${digitsInput}` :
      currentStep.id === 'gov' ? `CANDIDATO(A) A GOVERNADOR ${digitsInput}` :
      `CANDIDATO(A) A PRESIDENTE ${digitsInput}`
    ) : '--';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased flex flex-col font-sans selection:bg-[#C9A227] selection:text-[#1B2A4A]">
      
      {/* CABEÇALHO INSTITUCIONAL MS (Azul #1B2A4A + Dourado #C9A227) */}
      <header className="bg-[#1B2A4A] text-white shadow-md border-b-4 border-[#C9A227] print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-[#C9A227] text-2xl font-black shadow-inner">
              <Vote className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-[#C9A227] tracking-widest uppercase">
                <span>Mato Grosso do Sul</span>
                <span>•</span>
                <span>Eleições Gerais 2026</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                Colinha Digital & Simulador de Votação
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-200">Dep. Estadual:</span>
            <strong className="text-[#C9A227] font-bold tracking-wider text-base">VANILDO NEVES 70123</strong>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col items-center">
        
        {/* BARRA DE PROGRESSO DOS CARGOS */}
        <section className="w-full mb-4 sm:mb-6 print:hidden" aria-label="Progresso da Votação">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs sm:text-sm font-bold text-[#1B2A4A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C9A227]" />
                <span>Ordem Oficial de Votação (6 Cargos Oficiais)</span>
              </div>
              <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                Etapa {currentStepIndex + 1} de {STEPS.length}
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {STEPS.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (!isFinishing && !showReceipt) {
                        setCurrentStepIndex(idx);
                        setDigitsInput('');
                        setIsBranco(false);
                        setShowLockModal(false);
                      }
                    }}
                    className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-bold shadow-md scale-102 ring-2 ring-[#C9A227]'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs uppercase leading-tight font-extrabold flex items-center gap-0.5">
                      {idx + 1}º
                      {step.id === 'est' && <Star className="w-2.5 h-2.5 text-[#C9A227] fill-[#C9A227]" />}
                    </span>
                    <span className="text-[9px] sm:text-[11px] truncate w-full font-medium">
                      {step.id === 'est' ? '70123' : step.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONTAINER DA URNA ELETRÔNICA */}
        {!showReceipt && (
          <div className="w-full flex justify-center print:hidden">
            <div className="bg-gradient-to-b from-slate-200 to-slate-300 p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl border-4 border-slate-400 w-full max-w-4xl relative">
              
              {/* CABEÇALHO DA CARCAÇA DA URNA */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-300 text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1B2A4A] flex items-center justify-center text-[#C9A227] text-xs sm:text-sm font-bold shadow-inner">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-black tracking-widest text-slate-600 uppercase">
                      JUSTIÇA ELEITORAL
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#1B2A4A]">
                      SIMULADOR OFICIAL — MS 2026
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button 
                    onClick={() => setAudioEnabled(!audioEnabled)} 
                    className="px-2.5 py-1 bg-white/80 hover:bg-white rounded-md border border-slate-300 text-slate-700 font-medium flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs"
                    title={audioEnabled ? 'Desativar Sons' : 'Ativar Sons'}
                  >
                    {audioEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#3A7D44]" />
                        <span className="hidden sm:inline">Som Ativo</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Mudo</span>
                      </>
                    )}
                  </button>
                  <span className="hidden md:inline-block px-2 py-0.5 bg-slate-300/80 rounded text-[11px] font-mono text-slate-700">
                    UE-2026-MS
                  </span>
                </div>
              </div>

              {/* CORPO DA URNA: TELA LCD + TECLADO */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
                
                {/* VISOR LCD DA URNA (COL 7) */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="bg-[#F8FAF9] rounded-xl border-4 border-slate-700 shadow-inner p-3 sm:p-5 flex-1 flex flex-col justify-between min-h-[360px] sm:min-h-[420px] relative overflow-hidden font-sans text-slate-900 select-none">
                    
                    {/* TELA DE GRAVANDO / FIM */}
                    {fimState !== 'none' && (
                      <div className="absolute inset-0 bg-[#F8FAF9] flex flex-col items-center justify-center z-20 transition-all">
                        {fimState === 'gravando' && (
                          <div className="text-xl sm:text-2xl font-bold tracking-widest text-slate-700 animate-pulse">
                            GRAVANDO...
                          </div>
                        )}
                        {fimState === 'fim' && (
                          <div className="text-center animate-in zoom-in-75 duration-300">
                            <div className="text-6xl sm:text-8xl font-black text-[#1B2A4A] tracking-wider">
                              FIM
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600 mt-3 font-semibold px-4">
                              Votação concluída com sucesso! Gerando sua colinha oficial...
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MODAL / BANNER DE TRAVA OBRIGATÓRIA (DEPUTADO ESTADUAL 70123) */}
                    {showLockModal && (
                      <div className="absolute inset-0 bg-[#1B2A4A]/95 text-white flex flex-col items-center justify-center p-5 text-center z-30 transition-all backdrop-blur-xs">
                        <div className="w-14 h-14 rounded-full bg-[#C9A227]/20 border-2 border-[#C9A227] flex items-center justify-center text-[#C9A227] text-2xl mb-3 animate-bounce">
                          <AlertTriangle className="w-7 h-7 text-[#C9A227]" />
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-[#C9A227] uppercase tracking-wide mb-2">
                          Atenção Eleitor de MS!
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed max-w-sm mb-4">
                          Para prosseguir no treino e emitir sua colinha oficial, confirme o número do nosso Deputado Estadual:
                          <span className="block text-2xl font-black text-[#C9A227] my-1 tracking-wider">70123</span>
                          <span className="font-bold text-white">(Vanildo Neves — O Amigo de Sempre)</span>!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                          <button 
                            onClick={autoFillVanildo} 
                            className="flex-1 py-2.5 px-3 bg-[#3A7D44] hover:bg-[#2E6637] text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Digitar 70123 Agora</span>
                          </button>
                          <button 
                            onClick={() => setShowLockModal(false)} 
                            className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg text-xs transition-all cursor-pointer"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TELA NORMAL DE VOTAÇÃO */}
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Topo da tela LCD */}
                      <div>
                        <div className="text-[11px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider">
                          SEU VOTO PARA
                        </div>
                        <h2 className="text-lg sm:text-2xl font-black text-[#1B2A4A] tracking-tight mt-0.5">
                          {currentStep.title}
                        </h2>
                      </div>

                      {/* Meio: Dígitos e Dados do Candidato */}
                      <div className="my-3 sm:my-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold text-slate-600 mb-1">Número:</div>
                            
                            {/* Caixas de Dígitos */}
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              {isBranco ? (
                                <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-wider py-1">
                                  VOTO EM BRANCO
                                </div>
                              ) : (
                                Array.from({ length: currentStep.digits }).map((_, i) => {
                                  const char = digitsInput[i] || '';
                                  const isCurrent = i === digitsInput.length;
                                  return (
                                    <div
                                      key={i}
                                      className={`w-8 h-10 sm:w-10 sm:h-12 border-2 rounded flex items-center justify-center font-mono text-xl sm:text-2xl font-black bg-white shadow-xs ${
                                        char 
                                          ? 'border-slate-800 text-[#1B2A4A]' 
                                          : isCurrent 
                                          ? 'border-[#1B2A4A] ring-2 ring-[#1B2A4A]/25' 
                                          : 'border-slate-300 text-slate-300'
                                      }`}
                                    >
                                      {char || (isCurrent ? <span className="w-0.5 h-6 bg-[#1B2A4A] animate-pulse" /> : '')}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Foto do candidato (quando válido) */}
                          <div className={`w-20 h-24 sm:w-24 sm:h-28 border-2 border-slate-400 bg-white rounded-md shadow-xs flex flex-col items-center justify-center p-1 relative overflow-hidden text-center ${isBranco ? 'opacity-30' : ''}`}>
                            {isEstadualVanildo ? (
                              <svg className="w-full h-full object-cover" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="120" height="140" fill="#1B2A4A"/>
                                <circle cx="60" cy="50" r="45" fill="#3A7D44" fillOpacity="0.3"/>
                                <path d="M15 140C15 110 32 98 60 98C88 98 105 110 105 140H15Z" fill="#111D35"/>
                                <path d="M48 98L60 125L72 98H48Z" fill="#FFFFFF"/>
                                <path d="M57 106L60 135L63 106L60 102L57 106Z" fill="#C9A227"/>
                                <circle cx="38" cy="115" r="7" fill="#C9A227"/>
                                <text x="38" y="118" fontSize="7" fontWeight="900" fill="#1B2A4A" textAnchor="middle" fontFamily="sans-serif">70</text>
                                <path d="M50 82H70V98H50V82Z" fill="#F0C29E"/>
                                <ellipse cx="60" cy="62" rx="24" ry="29" fill="#F7D0B2"/>
                                <path d="M35 55C35 38 46 32 60 32C74 32 85 38 85 55C85 45 80 37 60 37C40 37 35 45 35 55Z" fill="#5A6578"/>
                                <ellipse cx="51" cy="59" rx="3.5" ry="2.5" fill="#2D3748"/>
                                <ellipse cx="69" cy="59" rx="3.5" ry="2.5" fill="#2D3748"/>
                                <circle cx="52" cy="58" r="1" fill="#FFFFFF"/>
                                <circle cx="70" cy="58" r="1" fill="#FFFFFF"/>
                                <path d="M46 54C49 52 54 53 56 55" stroke="#4A5568" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M74 54C71 52 66 53 64 55" stroke="#4A5568" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M60 59V69H63" stroke="#DDA884" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M49 76C54 82 66 82 71 76" stroke="#C25E5E" strokeWidth="2.5" strokeLinecap="round"/>
                                <rect x="0" y="124" width="120" height="16" fill="#C9A227"/>
                                <text x="60" y="135" fontSize="8.5" fontWeight="900" fill="#1B2A4A" textAnchor="middle" fontFamily="sans-serif">VANILDO NEVES</text>
                              </svg>
                            ) : (
                              <div className="text-slate-400 flex flex-col items-center text-[10px]">
                                <ShieldCheck className="w-8 h-8 text-slate-300 mb-1" />
                                <span>FOTO</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Detalhes do Candidato */}
                        <div className="mt-3 min-h-[70px] border-t border-slate-200 pt-2">
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-bold text-slate-500 w-16">Nome:</span>
                              <span className="text-xs sm:text-sm font-black text-[#1B2A4A] truncate">
                                {candidateNameText}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-bold text-slate-500 w-16">Partido:</span>
                              <span className="text-xs sm:text-sm font-bold text-slate-700">
                                {candidatePartyText}
                              </span>
                            </div>
                            {isEstadualVanildo && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-bold text-[#C9A227] w-16">Slogan:</span>
                                <span className="text-xs font-bold text-[#1B2A4A] italic">
                                  &quot;O Amigo de Sempre!&quot; — Servindo a nossa gente.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rodapé da tela LCD (Instruções da Urna) */}
                      <div className="border-t-2 border-slate-700 pt-2 text-[10px] sm:text-[11px] text-slate-700 leading-tight">
                        <div className="font-bold mb-0.5">Aperte a tecla:</div>
                        <div className="flex items-center justify-between gap-1 flex-wrap font-semibold">
                          <span className="text-[#3A7D44] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> VERDE para CONFIRMAR
                          </span>
                          <span className="text-[#C9A227] font-bold flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5" /> AMARELO para REINICIAR
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="mt-2 text-center text-xs text-slate-500">
                    Você pode usar o teclado numérico do computador ou os botões ao lado.
                  </div>
                </div>

                {/* TECLADO DA URNA ELETRÔNICA (COL 5) */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-slate-800 p-3 sm:p-5 rounded-xl border-4 border-slate-900 shadow-xl">
                  
                  {/* Placa do Teclado */}
                  <div className="text-center pb-2 mb-2 border-b border-slate-700 flex items-center justify-center gap-2 text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Teclado Eletrônico</span>
                  </div>

                  {/* Grade Numérica 1-9 e 0 */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[260px] mx-auto w-full mb-3 sm:mb-4">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                      <button
                        key={num}
                        onClick={() => handleDigit(num)}
                        className="bg-slate-900 hover:bg-slate-700 active:translate-y-1 text-white font-extrabold text-xl sm:text-2xl h-11 sm:h-12 rounded-lg flex items-center justify-center shadow-[0_4px_0_#0f172a] transition-all cursor-pointer relative"
                      >
                        {num}
                        {num === '5' && (
                          <span className="absolute bottom-1 w-1 h-1 bg-slate-400 rounded-full" />
                        )}
                      </button>
                    ))}
                    <div className="col-span-3 flex justify-center">
                      <button
                        onClick={() => handleDigit('0')}
                        className="bg-slate-900 hover:bg-slate-700 active:translate-y-1 text-white font-extrabold text-xl sm:text-2xl h-11 sm:h-12 w-[31%] rounded-lg flex items-center justify-center shadow-[0_4px_0_#0f172a] transition-all cursor-pointer"
                      >
                        0
                      </button>
                    </div>
                  </div>

                  {/* Teclas de Ação: BRANCO, CORRIGE (Amarelo Ouro), CONFIRMA (Verde Pantanal) */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700 items-end">
                    
                    {/* Tecla BRANCO */}
                    <button
                      onClick={handleBranco}
                      className="bg-white hover:bg-slate-100 active:translate-y-1 text-slate-800 font-extrabold text-[11px] sm:text-xs uppercase h-11 sm:h-12 rounded-lg flex flex-col items-center justify-center p-1 leading-tight tracking-tight border border-slate-300 shadow-[0_4px_0_#9ca3af] transition-all cursor-pointer"
                    >
                      <span>BRANCO</span>
                    </button>

                    {/* Tecla CORRIGE (Amarelo Ouro MS - SEM LARANJA) */}
                    <button
                      onClick={handleCorrige}
                      className="bg-[#C9A227] hover:bg-[#B5901F] active:translate-y-1 text-[#1B2A4A] font-black text-[11px] sm:text-xs uppercase h-11 sm:h-12 rounded-lg flex flex-col items-center justify-center p-1 leading-tight tracking-tight shadow-[0_4px_0_#8c6e14] transition-all cursor-pointer"
                    >
                      <span>CORRIGE</span>
                    </button>

                    {/* Tecla CONFIRMA (Verde Pantanal MS - Maior e mais alta) */}
                    <button
                      onClick={handleConfirma}
                      className="bg-[#3A7D44] hover:bg-[#2E6637] active:translate-y-1 text-white font-black text-xs sm:text-sm uppercase h-13 sm:h-15 rounded-lg flex flex-col items-center justify-center p-1 leading-tight tracking-wide border border-emerald-600 shadow-[0_6px_0_#1e4624] transition-all cursor-pointer"
                    >
                      <span>CONFIRMA</span>
                    </button>
                  </div>

                  {/* Botão de Atalho para treinar Vanildo Neves */}
                  <div className="mt-3 pt-2 text-center border-t border-slate-700/60">
                    <button
                      onClick={handleJumpToVanildo}
                      className="w-full py-1.5 px-2 bg-[#C9A227]/20 hover:bg-[#C9A227]/30 border border-[#C9A227]/40 text-[#C9A227] text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-[#C9A227]" />
                      <span>Atalho: Treinar Vanildo Neves (70123)</span>
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* SEÇÃO DO COMPROVANTE DA COLINHA DIGITAL (EMISSÃO E COMPARTILHAMENTO) */}
        {showReceipt && (
          <section className="w-full max-w-lg mt-2 flex flex-col items-center animate-in fade-in duration-500">
            
            {/* Card do Comprovante Estilo Cupom Térmico */}
            <div id="printReceiptArea" className="w-full bg-white rounded-2xl shadow-2xl border border-slate-300 p-5 sm:p-7 relative text-slate-900 font-sans">
              
              {/* Cabeçalho do Canhoto */}
              <div className="text-center pb-4 border-b-2 border-dashed border-slate-300">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1B2A4A] text-[#C9A227] text-xl mb-2 shadow-sm">
                  <Vote className="w-6 h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#1B2A4A] tracking-tight uppercase">
                  Colinha Eleitoral 2026
                </h2>
                <div className="text-xs font-bold text-[#C9A227] uppercase tracking-wider">
                  Mato Grosso do Sul • 1º Turno (04/10/2026)
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Simulador Oficial de Treino e Emissão de Votos
                </div>
              </div>

              {/* Lista dos Votos Computados */}
              <div className="py-4 space-y-2.5 text-xs sm:text-sm">
                
                {/* Deputado Federal */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Deputado Federal</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {recordedVotes.fed.label || 'Voto Registrado'}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-black text-[#1B2A4A] bg-white px-2 py-0.5 rounded border border-slate-300">
                    {recordedVotes.fed.number || '----'}
                  </div>
                </div>

                {/* DEPUTADO ESTADUAL (DESTAQUE VANILDO NEVES 70123) */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#1B2A4A] to-slate-900 text-white shadow-md border-2 border-[#C9A227] relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#C9A227] tracking-wider flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-[#C9A227]" /> Deputado Estadual
                      </span>
                      <span className="font-black text-sm sm:text-base text-white block">
                        VANILDO NEVES
                      </span>
                      <span className="text-[11px] text-slate-300 font-semibold block">
                        AVANTE (70) • &quot;O Amigo de Sempre!&quot;
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-black text-[#C9A227] bg-black/40 px-3 py-1 rounded-lg border border-[#C9A227]/50 shadow-inner">
                      70.123
                    </div>
                  </div>
                </div>

                {/* Senador 1 */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Senador (1º Voto)</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {recordedVotes.sen1.label || 'Voto Registrado'}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-black text-[#1B2A4A] bg-white px-2 py-0.5 rounded border border-slate-300">
                    {recordedVotes.sen1.number || '---'}
                  </div>
                </div>

                {/* Senador 2 */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Senador (2º Voto)</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {recordedVotes.sen2.label || 'Voto Registrado'}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-black text-[#1B2A4A] bg-white px-2 py-0.5 rounded border border-slate-300">
                    {recordedVotes.sen2.number || '---'}
                  </div>
                </div>

                {/* Governador */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Governador do Estado</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {recordedVotes.gov.label || 'Voto Registrado'}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-black text-[#1B2A4A] bg-white px-2 py-0.5 rounded border border-slate-300">
                    {recordedVotes.gov.number || '--'}
                  </div>
                </div>

                {/* Presidente */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Presidente da República</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {recordedVotes.pres.label || 'Voto Registrado'}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-black text-[#1B2A4A] bg-white px-2 py-0.5 rounded border border-slate-300">
                    {recordedVotes.pres.number || '--'}
                  </div>
                </div>

              </div>

              {/* RODAPÉ OBRIGATÓRIO DO CANHOTO */}
              <div className="pt-3 border-t-2 border-dashed border-slate-300 text-center space-y-2">
                <div className="bg-amber-50 border border-[#C9A227]/40 rounded-lg p-2.5">
                  <p className="text-xs sm:text-sm font-black text-[#1B2A4A] tracking-tight leading-snug">
                    ⭐ TRABALHO, DIÁLOGO E RESPEITO POR MATO GROSSO DO SUL, VOTE 70.123. ⭐
                  </p>
                </div>
                
                <div className="text-[11px] sm:text-xs text-slate-600 font-semibold bg-slate-100 p-2 rounded-md border border-slate-200 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#C9A227] shrink-0" />
                  <span>No dia 4 de outubro de 2026, leve sua colinha em papel para a cabine de votação!</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  (Pela legislação eleitoral do TSE, o uso de aparelho celular na cabine de votação é proibido)
                </div>
              </div>

            </div>

            {/* BOTÕES DE AÇÃO (IMPRIMIR, WHATSAPP, NOVO TREINO, DOWNLOAD) */}
            <div className="mt-4 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:hidden">
              <button 
                onClick={() => window.print()} 
                className="py-3 px-4 bg-[#1B2A4A] hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#C9A227]" />
                <span>Imprimir / Salvar PDF</span>
              </button>

              <button 
                onClick={handleShareWhatsApp} 
                className="py-3 px-4 bg-[#3A7D44] hover:bg-[#2E6637] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </button>

              <button 
                onClick={handleResetUrna} 
                className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>Novo Treino da Urna</span>
              </button>

              <button 
                onClick={handleDownloadStandaloneHtml} 
                className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                title="Baixar arquivo index.html autônomo offline"
              >
                <Download className="w-4 h-4 text-[#C9A227]" />
                <span>Baixar index.html (Offline)</span>
              </button>
            </div>

          </section>
        )}

      </main>

      {/* RODAPÉ DA PÁGINA */}
      <footer className="bg-[#1B2A4A] text-slate-300 border-t border-slate-800 py-4 px-4 text-center text-xs print:hidden mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Eleições Gerais 2026 • Mato Grosso do Sul</span>
            <span>—</span>
            <span className="text-[#C9A227] font-bold">Vanildo Neves 70.123</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Simulador educativo e cívico desenvolvido para treinamento do eleitorado sul-mato-grossense.
          </div>
        </div>
      </footer>
    </div>
  );
}
