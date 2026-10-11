import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  MessageCircle,
  X,
  Send,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ShoppingBag,
  Package,
  RotateCcw,
  Tag,
  Headphones,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Minimize2,
  Copy,
  Check,
  Radio,
  Clock,
  Sparkle,
  Square,
  Bot
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product, Order, Voucher } from '../../types';

interface AIAssistantWidgetProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export type VoiceState =
  | 'IDLE'
  | 'LISTENING_FOR_WAKE_WORD'
  | 'LISTENING_FOR_QUESTION'
  | 'THINKING'
  | 'SPEAKING'
  | 'LISTENING_FOR_FOLLOW_UP';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  actionTags?: { action: string; target: string; label: string }[];
  recommendedProducts?: Product[];
  orderPreview?: Order;
  couponPreview?: Voucher[];
}

const WAKE_PHRASES = [
  'hello trendpro',
  'hi trendpro',
  'hey trendpro',
  'trendpro',
  'hello trend pro',
  'hi trend pro',
  'hey trend pro',
  'trend pro',
  'हेलो ट्रेंडप्रो',
  'ट्रेंडप्रो',
  'नमस्ते ट्रेंडप्रो',
];

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ onNavigate }) => {
  const { aiKnowledgeConfig, products, orders, vouchers } = useStore();
  const { currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [followUpCountdown, setFollowUpCountdown] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const personality = aiKnowledgeConfig?.assistantPersonality || {
    name: 'Riya — TrendPro Assistant',
    tone: 'warm_friendly_female',
    languages: 'Hindi, Hinglish, English',
    welcomeMessage:
      'Namaste! Main Riya hoon, TrendPro ki friendly AI assistant. Main aapko best deals dhoondhne, coupons lagane, orders track karne aur checkout mein help kar sakti hoon! Aap mujhse Hindi ya English mein baat kar sakte hain. Boliye, main aapke liye kya kar sakti hoon? ✨',
    suggestedQuestions: [
      '🔥 Trending Deals dikhao',
      '📦 Mera order track karo',
      '🏷️ Active discount coupons',
      '🔄 Return policy kya hai?',
      '😄 Ek funny joke sunao',
      '👤 TrendPro ka owner kaun hai?',
    ],
    voiceEnabled: true,
    defaultSpeechRate: 0.95,
    defaultSpeechPitch: 1.05,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const voiceStateRef = useRef<VoiceState>('IDLE');

  // Keep voiceStateRef in sync for speech callbacks
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'assistant',
          text: personality.welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [personality.welcomeMessage]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping, liveTranscript]);

  // Text-To-Speech Natural Female Voice
  const speakText = useCallback(
    (textToSpeak: string, onEndCallback?: () => void) => {
      if (voiceMuted || !personality.voiceEnabled) {
        if (onEndCallback) onEndCallback();
        return;
      }
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEndCallback) onEndCallback();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        // Remove markdown and action brackets for clean speech
        const cleanText = textToSpeak
          .replace(/\[action:[^\]]+\]/g, '')
          .replace(/[*_#`]/g, '')
          .slice(0, 350);

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = personality.defaultSpeechRate || 0.95;
        utterance.pitch = personality.defaultSpeechPitch || 1.05;

        // Pick suitable female voice
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(
          (v) =>
            v.lang.startsWith('hi') ||
            v.name.includes('Google हिन्दी') ||
            v.name.includes('Lekha') ||
            v.name.includes('Kalpana')
        );
        const femaleVoice = voices.find(
          (v) =>
            (v.name.includes('Female') ||
              v.name.includes('Samantha') ||
              v.name.includes('Zira') ||
              v.name.includes('Microsoft Heera') ||
              v.name.includes('Neerja') ||
              v.name.includes('Victoria')) &&
            (v.lang.startsWith('en') || v.lang.startsWith('hi'))
        );

        if (hindiVoice) {
          utterance.voice = hindiVoice;
        } else if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        setVoiceState('SPEAKING');

        utterance.onend = () => {
          if (voiceModeEnabled) {
            startFollowUpWindow();
          } else {
            setVoiceState('IDLE');
          }
          if (onEndCallback) onEndCallback();
        };

        utterance.onerror = () => {
          if (voiceModeEnabled) {
            startFollowUpWindow();
          } else {
            setVoiceState('IDLE');
          }
          if (onEndCallback) onEndCallback();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('TTS error:', err);
        if (voiceModeEnabled) {
          startFollowUpWindow();
        } else {
          setVoiceState('IDLE');
        }
        if (onEndCallback) onEndCallback();
      }
    },
    [voiceMuted, personality, voiceModeEnabled]
  );

  // Stop current speaking
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (voiceModeEnabled) {
      setVoiceState('LISTENING_FOR_WAKE_WORD');
    } else {
      setVoiceState('IDLE');
    }
  };

  // Follow-Up listening window (6 seconds)
  const startFollowUpWindow = () => {
    setVoiceState('LISTENING_FOR_FOLLOW_UP');
    setFollowUpCountdown(6);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setFollowUpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          if (voiceStateRef.current === 'LISTENING_FOR_FOLLOW_UP') {
            setVoiceState(voiceModeEnabled ? 'LISTENING_FOR_WAKE_WORD' : 'IDLE');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Helper: Extract action tags like [action:navigate|/path|Label]
  const parseActionTags = (rawText: string) => {
    const actionRegex = /\[action:([^|\]]+)\|([^|\]]+)\|?([^\]]*)\]/g;
    const tags: { action: string; target: string; label: string }[] = [];
    let match;
    while ((match = actionRegex.exec(rawText)) !== null) {
      tags.push({
        action: match[1],
        target: match[2],
        label: match[3] || match[2],
      });
    }
    const cleanDisplay = rawText.replace(actionRegex, '').trim();
    return { cleanDisplay, tags };
  };

  // Check if query matches products in store catalog
  const findMatchingProducts = (query: string): Product[] => {
    const q = query.toLowerCase();
    const words = q.split(' ').filter((w) => w.length > 2);
    if (words.length === 0) return [];

    return products
      .filter((p) => {
        if (!p.isActive) return false;
        const nameMatch = words.some((w) => p.name.toLowerCase().includes(w));
        const catMatch = words.some((w) => p.category.toLowerCase().includes(w));
        const brandMatch = words.some((w) => p.brand.toLowerCase().includes(w));
        return nameMatch || catMatch || brandMatch;
      })
      .slice(0, 3);
  };

  // Send message and get response from server-side Gemini AI
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeNow,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLiveTranscript('');
    setIsTyping(true);
    setVoiceState('THINKING');

    // Prepare catalog summary
    const catalogSummary = products
      .slice(0, 15)
      .map((p) => `${p.name} (₹${p.sellingPrice}, ${p.category})`)
      .join(', ');

    // User context
    const userOrders = currentUser ? orders.filter((o) => o.userId === currentUser.uid) : [];
    const userContext = currentUser
      ? {
          name: currentUser.displayName || 'Customer',
          email: currentUser.email,
          recentOrdersCount: userOrders.length,
          latestOrder: userOrders[0]
            ? {
                id: userOrders[0].id,
                status: userOrders[0].orderStatus,
                total: userOrders[0].pricing.total,
                carrier: userOrders[0].carrier,
              }
            : null,
        }
      : null;

    // History formatting
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      text: m.text,
    }));

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          knowledge: aiKnowledgeConfig,
          catalogSummary,
          userContext,
        }),
      });

      const data = await response.json();
      const rawReply =
        data.reply ||
        'Namaste! Main aapki madad ke liye taiyaar hoon. Aap TrendPro par koi bhi product ya order ke baare mein pooch sakte hain.';

      const { cleanDisplay, tags } = parseActionTags(rawReply);

      // Check if products or orders or coupons should be embedded
      const matchedProds = findMatchingProducts(query);
      const isOrderQuery =
        query.toLowerCase().includes('order') ||
        query.toLowerCase().includes('track') ||
        query.toLowerCase().includes('delivery');
      const isCouponQuery =
        query.toLowerCase().includes('coupon') ||
        query.toLowerCase().includes('discount') ||
        query.toLowerCase().includes('code');

      const asstMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: cleanDisplay,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTags: tags,
        recommendedProducts: matchedProds.length > 0 ? matchedProds : undefined,
        orderPreview: isOrderQuery && userOrders.length > 0 ? userOrders[0] : undefined,
        couponPreview: isCouponQuery ? vouchers.filter((v) => v.isActive).slice(0, 3) : undefined,
      };

      setMessages((prev) => [...prev, asstMsg]);
      setIsTyping(false);

      // Speak answer out loud
      speakText(cleanDisplay);
    } catch (err) {
      console.error('Failed to contact Gemini assistant:', err);
      // Graceful fallback
      const fallbackText =
        'Namaste! Main Riya hoon. TrendPro par aap electronics, fashion, beauty aur home essentials explore kar sakte hain! Koi bhi help ke liye poochiye.';
      const asstMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, asstMsg]);
      setIsTyping(false);
      speakText(fallbackText);
    }
  };

  // Speech Recognition & Wake-Word Engine
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognizer = new SpeechRecognition();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = 'hi-IN'; // Default Hindi with Indian English recognition
    recognitionRef.current = recognizer;

    recognizer.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }

      const lower = currentTranscript.trim().toLowerCase();
      setLiveTranscript(currentTranscript);

      const currentState = voiceStateRef.current;

      // 1. In LISTENING_FOR_WAKE_WORD state:
      if (currentState === 'LISTENING_FOR_WAKE_WORD') {
        const matchedPhrase = WAKE_PHRASES.find((phrase) => lower.includes(phrase));
        if (matchedPhrase) {
          // Check if user spoke a question right after the wake phrase (inline query)
          const phraseIndex = lower.indexOf(matchedPhrase);
          const trailingSpeech = currentTranscript
            .slice(phraseIndex + matchedPhrase.length)
            .replace(/^[,.!?\s]+/, '')
            .trim();

          if (trailingSpeech.length > 5) {
            // User said e.g. "Hey TrendPro, best headphones kaunse hain?"
            // Seamlessly execute question without asking them to repeat!
            setLiveTranscript('');
            handleSendMessage(trailingSpeech);
          } else {
            // Wake word only: "Hello TrendPro"
            // Friendly greeting audio response and prompt to listen for question!
            setVoiceState('LISTENING_FOR_QUESTION');
            setLiveTranscript('');
            speakText('Haan ji, boliye! Main sun rahi hoon.', () => {
              setVoiceState('LISTENING_FOR_QUESTION');
            });
          }
        }
      } else if (
        currentState === 'LISTENING_FOR_QUESTION' ||
        currentState === 'LISTENING_FOR_FOLLOW_UP'
      ) {
        // Checking if finalized speech
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult.isFinal) {
          const finalQuery = currentTranscript.trim();
          if (finalQuery.length > 2) {
            setLiveTranscript('');
            handleSendMessage(finalQuery);
          }
        }
      }
    };

    recognizer.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.warn('Speech recognition warning:', e.error);
      }
    };

    recognizer.onend = () => {
      // Keep listening if voice mode is still enabled
      if (voiceModeEnabled && voiceStateRef.current !== 'IDLE') {
        try {
          recognizer.start();
        } catch {
          // Restart gracefully
        }
      }
    };

    return () => {
      try {
        recognizer.abort();
      } catch {
        // cleanup
      }
    };
  }, [voiceModeEnabled]);

  // Toggle Voice Mode
  const toggleVoiceMode = () => {
    if (!voiceModeEnabled) {
      setVoiceModeEnabled(true);
      setVoiceState('LISTENING_FOR_WAKE_WORD');
      try {
        recognitionRef.current?.start();
      } catch {
        // already started
      }
    } else {
      setVoiceModeEnabled(false);
      setVoiceState('IDLE');
      try {
        recognitionRef.current?.stop();
      } catch {
        // stopped
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  // Manual Mic Push-to-Talk (Ask Question Directly)
  const triggerManualMic = () => {
    if (!voiceModeEnabled) {
      setVoiceModeEnabled(true);
    }
    setVoiceState('LISTENING_FOR_QUESTION');
    try {
      recognitionRef.current?.start();
    } catch {
      // already active
    }
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Handle action button click
  const handleActionClick = (action: string, target: string) => {
    if (action === 'navigate') {
      const cleanPath = target.startsWith('/') ? target.slice(1) : target;
      if (cleanPath.startsWith('product/')) {
        const prodId = cleanPath.split('/')[1];
        onNavigate('product-detail', { id: prodId });
      } else if (cleanPath === 'cart') {
        onNavigate('cart');
      } else if (cleanPath === 'orders') {
        onNavigate('orders');
      } else if (cleanPath === 'support') {
        onNavigate('support');
      } else if (cleanPath === 'wallet') {
        onNavigate('wallet');
      } else if (cleanPath === 'trending') {
        onNavigate('products');
      } else {
        onNavigate(cleanPath);
      }
      setIsOpen(false);
    } else if (action === 'coupon') {
      copyCoupon(target);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-indigo-100 text-xs font-bold text-slate-800 animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Chat with {personality.name.split(' ')[0] || 'TrendPro Assistant'}</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-700 via-indigo-600 to-rose-500 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white"
            title={`Chat with ${personality.name}`}
            aria-label="Open AI Shopping Assistant"
          >
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 text-[9px] font-black text-slate-950 items-center justify-center">
                ✨
              </span>
            </span>
            <Sparkles className="w-6 h-6 animate-pulse" />
          </button>
        </div>
      )}

      {/* Assistant Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isMinimized
              ? 'bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-indigo-200'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 md:w-[420px] max-h-[85vh] h-[640px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-4 flex items-center justify-between border-b border-indigo-700/50 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 p-0.5 shadow-md">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300 font-black text-sm">
                    ✨
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-indigo-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white leading-tight">
                    {personality.name}
                  </h3>
                  <span className="text-[10px] bg-indigo-500/30 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-indigo-400/30">
                    Hindi & English
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200">
                  Friendly Female Voice Companion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Voice Mode Toggle (Wake word listening) */}
              <button
                onClick={toggleVoiceMode}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  voiceModeEnabled
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                    : 'text-indigo-300 hover:text-white hover:bg-indigo-800/50'
                }`}
                title={
                  voiceModeEnabled
                    ? 'Voice Mode On (Wake word: "Hello TrendPro")'
                    : 'Enable Voice Mode & Wake Word'
                }
              >
                {voiceModeEnabled ? <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Mute TTS */}
              <button
                onClick={() => setVoiceMuted(!voiceMuted)}
                className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/50 cursor-pointer"
                title={voiceMuted ? 'Unmute voice' : 'Mute voice'}
              >
                {voiceMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
              </button>

              {/* Minimize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/50 cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <ChevronDown className="w-4 h-4 rotate-180" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/50 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Voice State Visual Feedback Banner */}
              {voiceModeEnabled && (
                <div className="bg-indigo-950/90 text-white px-3.5 py-2 text-xs border-b border-indigo-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {voiceState === 'LISTENING_FOR_WAKE_WORD' && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] text-indigo-200">
                          Listening for wake phrase: <strong className="text-amber-300 font-mono">"Hello TrendPro"</strong>
                        </span>
                      </>
                    )}
                    {voiceState === 'LISTENING_FOR_QUESTION' && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-[11px] font-bold text-rose-300">
                          Listening to you... Boliye!
                        </span>
                      </>
                    )}
                    {voiceState === 'THINKING' && (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                        <span className="text-[11px] text-amber-200 font-medium">
                          Thinking... Soch rahi hoon...
                        </span>
                      </>
                    )}
                    {voiceState === 'SPEAKING' && (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                        <span className="text-[11px] text-emerald-300 font-semibold">
                          Speaking... Bol rahi hoon
                        </span>
                      </>
                    )}
                    {voiceState === 'LISTENING_FOR_FOLLOW_UP' && (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span className="text-[11px] text-amber-200 font-medium">
                          Follow-up window ({followUpCountdown}s) — Koi aur sawaal?
                        </span>
                      </>
                    )}
                  </div>

                  {voiceState === 'SPEAKING' && (
                    <button
                      onClick={stopSpeaking}
                      className="text-[10px] bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" />
                      Stop
                    </button>
                  )}
                </div>
              )}

              {/* Quick Action Suggestion Chips */}
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
                {personality.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="shrink-0 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                        m.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>

                      {/* Recommended Products Carousel / List */}
                      {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                          <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                            Recommended for you
                          </p>
                          {m.recommendedProducts.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/70 transition-colors"
                            >
                              <img
                                src={p.mainImage}
                                alt={p.name}
                                className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-slate-200"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-[11px] truncate">
                                  {p.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-extrabold text-indigo-700 text-xs">
                                    ₹{p.sellingPrice.toLocaleString()}
                                  </span>
                                  {p.discountPercent > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-bold">
                                      {p.discountPercent}% off
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  onNavigate('product-detail', { id: p.id });
                                  setIsOpen(false);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer"
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Order Preview Card */}
                      {m.orderPreview && (
                        <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700">Order #{m.orderPreview.id}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                              {m.orderPreview.orderStatus}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Total: <strong>₹{m.orderPreview.pricing.total.toLocaleString()}</strong> ({m.orderPreview.items.length} items)
                          </p>
                          {m.orderPreview.trackingNumber && (
                            <p className="text-[10px] text-slate-500 font-mono">
                              Tracking: {m.orderPreview.carrier} — {m.orderPreview.trackingNumber}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Coupons Card */}
                      {m.couponPreview && (
                        <div className="mt-2.5 space-y-1.5">
                          {m.couponPreview.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between p-2 bg-amber-50/70 border border-amber-200/80 rounded-xl"
                            >
                              <div>
                                <span className="font-mono font-black text-amber-900 text-xs bg-amber-200/60 px-1.5 py-0.5 rounded-md">
                                  {v.code}
                                </span>
                                <p className="text-[10px] text-amber-800 mt-0.5">
                                  {v.discountType === 'percentage'
                                    ? `${v.discountValue}% OFF (Min ₹${v.minOrderValue})`
                                    : `₹${v.discountValue} OFF (Min ₹${v.minOrderValue})`}
                                </p>
                              </div>
                              <button
                                onClick={() => copyCoupon(v.code)}
                                className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-50 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedCode === v.code ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interactive Action Tags */}
                      {m.actionTags && m.actionTags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          {m.actionTags.map((tag, i) => (
                            <button
                              key={i}
                              onClick={() => handleActionClick(tag.action, tag.target)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>{tag.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {m.timestamp}
                    </span>
                  </div>
                ))}

                {/* Live speech feedback in chat feed */}
                {liveTranscript && (
                  <div className="flex items-center gap-2 p-2.5 bg-indigo-50/80 rounded-2xl border border-indigo-200/60 text-xs text-indigo-900 animate-pulse">
                    <Mic className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="italic">"{liveTranscript}"</span>
                  </div>
                )}

                {isTyping && (
                  <div className="flex items-center gap-1.5 p-3 bg-white rounded-2xl border border-slate-200 w-20">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                {/* Direct Manual Mic button */}
                <button
                  type="button"
                  onClick={triggerManualMic}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    voiceState === 'LISTENING_FOR_QUESTION'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                  }`}
                  title="Direct Mic — Speak your question"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Ask ${personality.name.split(' ')[0] || 'Aria'} anything in Hindi or English...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
