
import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors() as any);
app.use(express.json() as any);

const PORT = process.env.PORT || 3000;
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'https://metaview-api-production.up.railway.app';

// Initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Utility: Extract JSON from Gemini response safely
 */
const parseSafe = (text: string | undefined, fallback: any = {}) => {
  if (!text) return fallback;
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return fallback;
  }
};

// 1. Health Check
// Use 'any' to bypass Express type resolution errors in some environments
app.get('/api/health', (req: any, res: any) => {
  res.json({ status: "ok", service: "MetaView Intelligence Core", timestamp: new Date().toISOString() });
});

// 2. Comprehensive Analysis Pipeline (Dashboard + Sentiment + Bias)
// Use 'any' to bypass Express type resolution errors for body, status, and json
app.post('/api/analyze', async (req: any, res: any) => {
  const { lang = 'ar', source = '/articles', params = { top_k: 20 } } = req.body;
  const startTime = Date.now();

  try {
    // A. Data Fetching
    const queryParams = new URLSearchParams(params);
    const apiRes = await fetch(`${EXTERNAL_API_URL}${source}?${queryParams.toString()}`);
    if (!apiRes.ok) throw new Error(`External API Failure: ${apiRes.status}`);
    const rawData: any = await apiRes.json();
    const articles = rawData.articles || rawData.results || (Array.isArray(rawData) ? rawData : []);

    if (articles.length === 0) return res.status(404).json({ error: "No data found" });

    const headlines = articles.slice(0, 30).map((a: any) => `- ${a.headline}`).join('\n');

    // B. Parallel AI Processing
    const [dashboardRes, sentimentRes, biasRes] = await Promise.all([
      // 1. Dashboard Analysis (KPIs, Timeseries, Distributions)
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these news headlines and provide detailed dashboard metrics in ${lang === 'ar' ? 'Arabic' : 'English'}:\n${headlines}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              kpis: {
                type: Type.OBJECT,
                properties: {
                  sentimentAvg: { type: Type.NUMBER },
                  biasScore: { type: Type.NUMBER },
                  topTheme: { type: Type.STRING },
                  momentum: { type: Type.NUMBER }
                }
              },
              timeseries: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    sentiment: { type: Type.NUMBER },
                    volume: { type: Type.NUMBER }
                  }
                }
              },
              topThemes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    theme: { type: Type.STRING },
                    count: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      }),
      // 2. Sentiment Analysis
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide overall sentiment analysis in ${lang === 'ar' ? 'Arabic' : 'English'} for:\n${headlines}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
              score: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }),
      // 3. Bias/Propaganda Analysis (Pro)
      ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze editorial bias and rhetoric momentum in ${lang === 'ar' ? 'Arabic' : 'English'} for these headlines. Return score (0-100) and evidence:\n${headlines}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              label: { type: Type.STRING },
              evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      })
    ]);

    res.json({
      dashboard: parseSafe(dashboardRes.text),
      sentiment: parseSafe(sentimentRes.text),
      bias: parseSafe(biasRes.text),
      articles: articles,
      meta: { runtime_ms: Date.now() - startTime, lang }
    });

  } catch (error: any) {
    console.error("Analyze Pipeline Error:", error);
    res.status(502).json({ error: "Failed to process intelligence pipeline", detail: error.message });
  }
});

// 3. Smart Event Aggregation (Clustering)
// Use 'any' to bypass Express type resolution errors for body and res methods
app.post('/api/cluster', async (req: any, res: any) => {
  const { articles, lang = 'ar' } = req.body;
  try {
    const input = articles.slice(0, 25).map((a: any) => `- [${a.url}] ${a.headline}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Group these news items into intelligent event clusters. 
      For each cluster, provide a title, a short summary in ${lang === 'ar' ? 'Arabic' : 'English'}, momentum_score (0-1), and the list of URLs.
      Data:\n${input}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              momentum_score: { type: Type.NUMBER },
              articleUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
              evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "summary", "momentum_score", "articleUrls"]
          }
        }
      }
    });
    res.json(parseSafe(response.text, []));
  } catch (error) {
    res.status(503).json({ error: "Event clustering service unavailable" });
  }
});

// 4. Utility: Translation & Sentiment Detail
// Use 'any' to bypass Express type resolution errors for request and response
app.post('/api/translate', async (req: any, res: any) => {
  const { text, lang = 'Arabic' } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following to ${lang}. Keep the tone professional:\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { translated_text: { type: Type.STRING } } }
      }
    });
    res.json(parseSafe(response.text));
  } catch (error) {
    res.status(500).json({ error: "Translation failed" });
  }
});

// Use 'any' to bypass Express type resolution errors for request and response
app.post('/api/sentiment', async (req: any, res: any) => {
  const { text, lang = 'ar' } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Detailed sentiment in ${lang === 'ar' ? 'Arabic' : 'English'} for:\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            score: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          }
        }
      }
    });
    res.json(parseSafe(response.text));
  } catch (error) {
    res.status(500).json({ error: "Sentiment analysis failed" });
  }
});

// Static Hosting
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath) as any);
// Use 'any' to bypass sendFile type error on the Response object
app.get('*', (req: any, res: any) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(PORT, () => console.log(`MetaView Production Server running on port ${PORT}`));
