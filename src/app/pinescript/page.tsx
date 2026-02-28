'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Copy, Check, Zap } from 'lucide-react';
import { PineEditor } from '@/components/pine-editor';

const MODELS = [
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'o3', name: 'o3' },
  { id: 'o4-mini', name: 'o4-mini' },
];

const EXAMPLE_PROMPTS = [
  'RSI divergence detector with alerts',
  'MACD crossover strategy with stop loss',
  'Bollinger Band squeeze indicator',
  'Volume-weighted moving average ribbon',
  'Support and resistance auto-detection',
];

export default function PineScriptPage() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gpt-4.1');
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setCode('');
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/pinescript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        setCode(`// Error: ${err.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullCode = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const json = JSON.parse(data);
            if (json.text) {
              fullCode += json.text;
              setCode(fullCode);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setCode(`// Error: ${e.message}`);
      }
    }
    setLoading(false);
  }, [prompt, model]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-foreground/70 uppercase tracking-[0.12em]">
          PineScript AI
        </h1>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Model</label>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="bg-secondary border border-border rounded-sm px-2 py-1 text-sm"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="border border-border rounded-md bg-card p-4">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-2">
          Describe your strategy
        </label>
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g., Create an RSI divergence indicator with customizable overbought/oversold levels and alerts..."
            className="flex-1 bg-secondary border border-border rounded-sm px-3 py-2 text-sm min-h-[80px] resize-y"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate();
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map(ex => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="text-[11px] text-muted-foreground hover:text-foreground bg-secondary/50 px-2 py-0.5 rounded-sm transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-1.5 bg-data-positive/20 hover:bg-data-positive/30 text-data-positive px-3 py-1.5 rounded-sm text-sm font-medium transition-colors disabled:opacity-40"
          >
            {loading ? (
              <Zap className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Code Output */}
      <div className="border border-border rounded-md bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            PineScript v6 Output
          </span>
          {code && (
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-data-positive" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        <PineEditor code={code} />
      </div>
    </div>
  );
}
