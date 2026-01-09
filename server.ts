
import express from 'express';
// Fix: Import cors as any or use casting to avoid TS middleware signature mismatch errors
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import fetch from 'node-fetch';

const app = express();
// Fix: Use type assertion to satisfy Express app.use expectations
app.use(cors() as any);
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'https://metaview-api-production.up.railway.app';

if (!API_KEY) {
  console.error("FATAL ERROR: API_KEY is not defined in environment variables.");
}

// Fix: Always use named parameter for apiKey during initialization
const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

// 1. Health Endpoint
app.get('/health', (req, res) => {
  // Return mock row count for UI display
  res.json({ status: "ok", rows: 154032, timestamp: new Date().toISOString() });
});

// 2. Comparison Endpoint
app.post('/compare', async (req, res) => {
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
            similarity: { type: Type.NUMBER, description: "Similarity score from 0 to 1" },
            insights: { type: Type.STRING },
            differences: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["similarity", "insights", "differences"]
        }
      }
    });
    // Fix: Access .text as a property, not a method
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    res.status(500).json({ error: "Comparison failed" });
  }
});

// 3. Clustering Endpoint
app.post('/cluster', async (req, res) => {
  const { articles } = req.body;
  try {
    const input = articles.slice(0, 20).map((a: any) => `- ${a.headline} (${a.url})`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Group these articles into thematic clusters. For each cluster, provide a title, a short summary, and the list of URLs of articles belonging to it:\n${input}`,
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

// 4. Strategic Summary Endpoint
app.post('/strategic-summary', async (req, res) => {
  const { articles } = req.body;
  try {
    const input = articles.slice(0, 40).map((a: any) => a.headline).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a strategic high-level summary of these news trends, metrics (0-100) for Stability, Economy, Security, and Tech, and 3-5 key takeaways:\n${input}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                },
                required: ["category", "value"]
              }
            },
            key_takeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "metrics", "key_takeaways"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    res.status(500).json({ error: "Summary generation failed" });
  }
});

// 5. Editorial Bias Detection Endpoint
app.post('/detect-bias', async (req, res) => {
  const { articles } = req.body;
  try {
    const input = articles.slice(0, 15).map((a: any) => a.headline).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze these headlines for editorial bias. Return an array of bias scores from 0 (neutral) to 100 (extreme bias):\n${input}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              bias_score: { type: Type.NUMBER }
            },
            required: ["bias_score"]
          }
        }
      }
    });
    res.json(JSON.parse(response.text || '[]'));
  } catch (error) {
    res.status(500).json({ error: "Bias detection failed" });
  }
});

// 6. Translation Endpoint
app.post('/translate', async (req, res) => {
  const { text, lang } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following text to ${lang}:\n\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translated_text: { type: Type.STRING }
          },
          required: ["translated_text"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    res.status(500).json({ error: "Translation failed" });
  }
});

// 7. Sentiment Analysis Endpoint
app.post('/sentiment', async (req, res) => {
  const { text } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the sentiment of this text. Return label (positive, neutral, negative), a score (0-1), and an explanation:\n\n${text}`,
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
    res.status(500).json({ error: "Sentiment analysis failed" });
  }
});

// 8. Legacy Analysis Pipeline Endpoint
app.post('/analyze', async (req, res) => {
  const startTime = Date.now();
  const { source, params } = req.body;

  try {
    const queryParams = new URLSearchParams(params || {});
    const apiRes = await fetch(`${EXTERNAL_API_URL}${source || '/articles'}?${queryParams.toString()}`);
    if (!apiRes.ok) throw new Error(`External API returned ${apiRes.status}`);
    
    const rawData: any = await apiRes.json();
    const articles = rawData.articles || rawData.results || (Array.isArray(rawData) ? rawData : []);

    if (articles.length === 0) {
      return res.status(404).json({ error: "No articles found to analyze" });
    }

    const headlines = articles.slice(0, 15).map((a: any) => a.headline).join('\n');

    const [summaryRes, sentimentRes, biasRes] = await Promise.all([
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these news headlines and provide a strategic summary and 3 key takeaways:\n${headlines}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              takeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "takeaways"]
          }
        }
      }),
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the overall sentiment of these headlines:\n${headlines}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
              score: { type: Type.NUMBER }
            },
            required: ["label", "score"]
          }
        }
      }),
      ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Detect editorial bias and propaganda score (0-100) for these headlines. Provide evidence:\n${headlines}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              label: { type: Type.STRING },
              evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["score", "label", "evidence"]
          }
        }
      })
    ]);

    const result = {
      summary: JSON.parse(summaryRes.text || '{}'),
      sentiment: JSON.parse(sentimentRes.text || '{}'),
      bias: JSON.parse(biasRes.text || '{}'),
      data: articles,
      meta: {
        runtime_ms: Date.now() - startTime,
        model_versions: {
          summary: "gemini-3-flash",
          bias: "gemini-3-pro"
        }
      }
    };

    res.json(result);

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    res.status(500).json({ error: error.message || "Internal Analysis Error" });
  }
});

app.listen(PORT, () => {
  console.log(`MetaView Intelligence Server listening on port ${PORT}`);
});
