
import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Fix for Error in server.ts on line 14: Use 'as any' to resolve middleware type mismatch
app.use(cors() as any);
app.use(express.json() as any);

const PORT = process.env.PORT || 3000;

// Updated initialization to follow guidelines: Use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// API Endpoints - Explicitly typing Request and Response to solve overload issues
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: "ok", rows: 154032, timestamp: new Date().toISOString() });
});

app.post('/api/compare', async (req: Request, res: Response) => {
  const { h1, h2 } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Compare these two news headlines for objective similarity, insights into their perspectives, and key differences:\n1. ${h1}\n2. ${h2}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            similarity: { type: Type.NUMBER },
            insights: { type: Type.STRING },
            differences: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["similarity", "insights", "differences"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    res.status(500).json({ error: "Comparison failed" });
  }
});

app.post('/api/cluster', async (req: Request, res: Response) => {
  const { articles } = req.body;
  try {
    const input = articles.slice(0, 20).map((a: any) => `- ${a.headline} (${a.url})`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Group these articles into thematic clusters:\n${input}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              articleUrls: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "summary", "articleUrls"]
          }
        }
      }
    });
    res.json(JSON.parse(response.text || '[]'));
  } catch (error) {
    res.status(500).json({ error: "Clustering failed" });
  }
});

app.post('/api/strategic-summary', async (req: Request, res: Response) => {
  const { articles } = req.body;
  try {
    const input = articles.slice(0, 40).map((a: any) => a.headline).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide strategic summary and metrics for:\n${input}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            metrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, value: { type: Type.NUMBER } }, required: ["category", "value"] } },
            key_takeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "metrics", "key_takeaways"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    res.status(500).json({ error: "Summary failed" });
  }
});

app.post('/api/detect-bias', async (req: Request, res: Response) => {
  const { articles } = req.body;
  try {
    const input = articles.slice(0, 15).map((a: any) => a.headline).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze bias for:\n${input}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { bias_score: { type: Type.NUMBER } }, required: ["bias_score"] }
        }
      }
    });
    res.json(JSON.parse(response.text || '[]'));
  } catch (error) {
    res.status(500).json({ error: "Bias failed" });
  }
});

app.post('/api/translate', async (req: Request, res: Response) => {
  const { text, lang } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate to ${lang}:\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { translated_text: { type: Type.STRING } }, required: ["translated_text"] }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    res.status(500).json({ error: "Translation failed" });
  }
});

app.post('/api/sentiment', async (req: Request, res: Response) => {
  const { text } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze sentiment for:\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
            score: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["label", "score", "explanation"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    res.status(500).json({ error: "Sentiment failed" });
  }
});

// Serve Static Frontend Files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath) as any);

// Handle React Router - redirect all unknown requests to index.html
// Fix for Error in server.ts on line 176: Explicitly typing the handler resolves the overload error
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production Server running on port ${PORT}`);
});
