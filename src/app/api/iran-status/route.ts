import { NextResponse } from 'next/server';

const CACHE_TTL_MS = 10 * 60 * 1000;
let cached: { data: IranStatus; ts: number } | null = null;

interface IranStatus {
  hormuzStatus: 'CLOSED' | 'DISRUPTED' | 'OPEN' | 'UNKNOWN';
  conflictStatus: 'ACTIVE_CONFLICT' | 'ESCALATING' | 'DE_ESCALATING' | 'CEASEFIRE' | 'UNKNOWN';
  summary: string;
  keyDevelopments: string[];
  oilImpact: string;
  updatedAt: string;
}

async function fetchRecentNews(): Promise<string[]> {
  const queries = [
    'Strait of Hormuz shipping status',
    'Iran US war latest',
    'Iran oil disruption',
  ];
  const headlines: string[] = [];
  for (const q of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const xml = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      let count = 0;
      while ((match = itemRegex.exec(xml)) !== null && count < 5) {
        const block = match[1];
        const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]
          ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() || '';
        const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
        if (title) {
          headlines.push(`[${pubDate}] ${title}`);
          count++;
        }
      }
    } catch {}
  }
  return headlines;
}

async function analyzeWithLLM(headlines: string[]): Promise<IranStatus> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { hormuzStatus: 'UNKNOWN', conflictStatus: 'UNKNOWN', summary: 'API key not configured', keyDevelopments: [], oilImpact: 'Unknown', updatedAt: new Date().toISOString() };
  }

  const prompt = `You are a geopolitical analyst. Based on these recent news headlines, determine the current status of:
1. The Strait of Hormuz (CLOSED / DISRUPTED / OPEN)
2. The Iran-US/Israel conflict (ACTIVE_CONFLICT / ESCALATING / DE_ESCALATING / CEASEFIRE)

Headlines:
${headlines.join('\n')}

Respond in JSON only, no markdown fences:
{
  "hormuzStatus": "CLOSED|DISRUPTED|OPEN",
  "conflictStatus": "ACTIVE_CONFLICT|ESCALATING|DE_ESCALATING|CEASEFIRE",
  "summary": "1-2 sentence current situation summary",
  "keyDevelopments": ["up to 3 key recent developments"],
  "oilImpact": "brief oil market impact assessment"
}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 500 }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const parsed = JSON.parse(content);
    return {
      hormuzStatus: parsed.hormuzStatus || 'UNKNOWN',
      conflictStatus: parsed.conflictStatus || 'UNKNOWN',
      summary: parsed.summary || '',
      keyDevelopments: parsed.keyDevelopments || [],
      oilImpact: parsed.oilImpact || '',
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    return { hormuzStatus: 'UNKNOWN', conflictStatus: 'UNKNOWN', summary: `Analysis failed: ${e instanceof Error ? e.message : 'unknown'}`, keyDevelopments: [], oilImpact: 'Unknown', updatedAt: new Date().toISOString() };
  }
}

export async function GET() {
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }
  const headlines = await fetchRecentNews();
  const status = await analyzeWithLLM(headlines);
  cached = { data: status, ts: Date.now() };
  return NextResponse.json(status);
}
