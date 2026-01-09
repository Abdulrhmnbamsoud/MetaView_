
import { Article, HealthStatus, SearchParams, DashboardMetrics, SentimentResult, ComparisonResult, TranslationResult } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const BASE_URL = 'https://metaview-api-production.up.railway.app';

export const apiService = {
  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (!response.ok) throw new Error('Health check failed');
      const data = await response.json();
      return { status: data.status || 'ok', rows: data.rows || 0 };
    } catch { 
      return { status: 'offline', rows: 0 }; 
    }
  },

  async clusterArticles(articles: Article[]): Promise<{title: string, articleUrls: string[], summary?: string}[]> {
    if (articles.length < 2) return [];
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const inputData = articles.slice(0, 60).map(a => ({ url: a.url, headline: a.headline, source: a.source }));
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `قم بتجميع الأخبار التالية في مجموعات موضوعية لمحرك MetaView. 
        أعطِ كل مجموعة عنواناً شاملاً وملخصاً قصيراً جداً.
        أرجع النتيجة بصيغة JSON فقط كقائمة من الكائنات تحتوي على (title), (articleUrls), (summary).
        البيانات: ${JSON.stringify(inputData)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                articleUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
              },
              required: ["title", "articleUrls"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (err) {
      console.error("Clustering Error:", err);
      return [];
    }
  },

  async detectEditorialBias(articles: Article[]): Promise<{source: string, bias_score: number, tendency: string, notes: string}[]> {
    if (articles.length < 2) return [];
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const sample = articles.slice(0, 20).map(a => ({ source: a.source, headline: a.headline, summary: a.article_summary }));

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `قم بتحليل الاختلافات التحريرية والتحيز الإعلامي لمحرك MetaView. 
        حدد درجة التحيز (من 0 لـ 100) والتوجه العام (tendency) وملاحظة تحليلية (notes).
        أرجع النتيجة بصيغة JSON فقط قائمة كائنات لكل مصدر فريد.
        البيانات: ${JSON.stringify(sample)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                bias_score: { type: Type.NUMBER },
                tendency: { type: Type.STRING },
                notes: { type: Type.STRING }
              },
              required: ["source", "bias_score", "tendency", "notes"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (err) {
      console.error("Bias Analysis Error:", err);
      return [];
    }
  },

  async getStrategicSummary(articles: Article[]): Promise<{summary: string, metrics: {category: string, value: number}[], key_takeaways: string[]}> {
    if (articles.length === 0) return { summary: "لا توجد بيانات كافية.", metrics: [], key_takeaways: [] };
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const headlines = articles.slice(0, 50).map(a => `- ${a.headline}`).join('\n');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `أنت محرك تحليل MetaView. قم بتحليل العناوين التالية وأرجع النتيجة بصيغة JSON فقط.
        يجب أن يتضمن التحليل:
        1. (summary): موجز MetaView الاستراتيجي.
        2. (metrics): تقييم من 0-100 للمجالات التالية: (الاستقرار العام، الزخم الاقتصادي، التحديات الحالية، الابتكار، التأثير).
        3. (key_takeaways): قائمة بأهم 3 استنتاجات.
        
        العناوين:\n${headlines}`,
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
      return JSON.parse(response.text || "{}");
    } catch (err) {
      console.error("Strategic Summary Error:", err);
      return { summary: "خطأ في الاتصال بمحرك MetaView.", metrics: [], key_takeaways: [] };
    }
  },

  async searchText(params: SearchParams): Promise<Article[]> {
    const queryParams = new URLSearchParams();
    const hasQuery = params.q && params.q.trim() !== '';
    const endpoint = hasQuery ? '/search-text' : '/articles';
    if (hasQuery) {
      queryParams.append('q', params.q!.trim());
      if (params.top_k) queryParams.append('top_k', params.top_k.toString());
    } else {
      queryParams.append('limit', (params.top_k || 1000).toString());
    }
    if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
    try {
      const response = await fetch(`${BASE_URL}${endpoint}?${queryParams.toString()}`);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.results || data.articles || (Array.isArray(data) ? data : []);
    } catch (err) { return []; }
  },

  async translateText(text: string, targetLanguage: 'Arabic' | 'English'): Promise<TranslationResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate to ${targetLanguage}: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { translated_text: { type: Type.STRING } }, required: ["translated_text"] }
      }
    });
    return JSON.parse(response.text || '{"translated_text":""}');
  },

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze sentiment for MetaView: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { label: { type: Type.STRING }, score: { type: Type.NUMBER } },
          required: ["label", "score"]
        }
      }
    });
    return JSON.parse(response.text || '{"label":"neutral","score":0.5}');
  },

  async compareArticles(headline1: string, headline2: string): Promise<ComparisonResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Compare for MetaView: 1: "${headline1}" 2: "${headline2}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { similarity: { type: Type.NUMBER }, insights: { type: Type.STRING }, differences: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["similarity", "insights", "differences"]
        }
      }
    });
    return JSON.parse(response.text || '{"similarity":0, "insights":"Error", "differences":[]}');
  },

  async runIngest(): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/ingest/run`, { method: 'POST' });
      return await response.json();
    } catch { return { status: 'failed' }; }
  }
};
