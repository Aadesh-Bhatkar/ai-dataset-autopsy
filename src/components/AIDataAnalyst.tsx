import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  User,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { DatasetState } from '../types';
import { askDataAnalyst, ChatMessage } from '../services/geminiService';

interface AIDataAnalystProps {
  state: DatasetState;
}

export const AIDataAnalyst: React.FC<AIDataAnalystProps> = ({ state }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      text: `Hello! I am your **AI Data Quality Auditor** for \`${state.filename}\`.

I have full access to your dataset's computed statistical profile, missing value counts, outlier fences, target imbalance ratios, and potential leakage risks.

Ask me anything about your dataset, or click any of the suggested prompt chips below!`,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'What are the biggest data-quality problems?',
    'Which columns need attention first?',
    'Explain the outliers in simple language',
    'What should I clean before training a model?',
    'Does my target variable look imbalanced?',
    'Which columns might cause data leakage?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await askDataAnalyst(text, state, messages);
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: response.text,
        isRuleBased: response.isRuleBased,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Unable to complete inquiry:** ${err?.message || 'Error occurred generating response.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSimpleMarkdown = (text: string) => {
    // Basic Markdown formatting helper for chats
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-sm text-cyan-300 mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-base text-white mt-2 mb-1">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-2">
                <span className="text-purple-400 font-bold">•</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatInline(line.slice(2)),
                  }}
                />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-2">
                <span className="text-cyan-400 font-bold font-mono">
                  {line.match(/^\d+\./)?.[0]}
                </span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatInline(line.replace(/^\d+\.\s*/, '')),
                  }}
                />
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: formatInline(line) }}
            />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-900 text-purple-300 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Privacy Badge */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              Ask Your Dataset — AI Data Analyst
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Investigate anomalies, clarify statistical terminology, and receive step-by-step feature engineering guidance grounded in your computed results.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs shrink-0 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacy First: Only Aggregates Transmitted</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong>Zero Raw Data Transmission:</strong> Raw row observations and confidential records are never uploaded. Inquiries refer only to calculated statistics (counts, boundaries, percentages). If Gemini API credentials are absent, an intelligent local rule-based data scientist responds instantly.
          </p>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Suggested Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition cursor-pointer disabled:opacity-50 text-left"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[520px]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                    isUser
                      ? 'bg-purple-600'
                      : 'bg-linear-to-tr from-purple-600 to-cyan-500'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-xl border text-xs ${
                    isUser
                      ? 'bg-purple-950/40 border-purple-800 text-purple-100 rounded-tr-none'
                      : 'bg-slate-950/80 border-slate-800 text-slate-200 rounded-tl-none space-y-2'
                  }`}
                >
                  {!isUser && msg.isRuleBased && (
                    <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 border-b border-slate-800 pb-1 mb-1">
                      <span>• Local Rule-Based Engine Active</span>
                    </div>
                  )}

                  {isUser ? <p>{msg.text}</p> : renderSimpleMarkdown(msg.text)}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-md">
              <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shrink-0 text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Analyzing computed dataset profile...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask a question about outliers, missingness, leakage, or modeling steps..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2.5 outline-hidden focus:border-purple-500 transition"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
