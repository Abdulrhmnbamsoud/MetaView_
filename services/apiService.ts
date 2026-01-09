
import { Article, HealthStatus, SearchParams, DashboardMetrics, SentimentResult, ComparisonResult, TranslationResult } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const BASE_URL = 'https://metaview-api-production.up.railway.app';

const cleanJson = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Cleanup Error:", e);
    return null;
  }
};

export const apiService = {
  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      return { status: data.status || 'ok', rows: data.rows || 0 };
    } catch { 
      return { status: 'offline', rows: 0 }; 
    }
  },

  async clusterArticles(articles: Article[]): Promise<{title: string, articleUrls: string[], summary?: string}[]> {
    if (articles.length < 2) return [];
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const inputData = articles.slice(0, 30).map(a => ({ url: a.url, headline: a.headline }));
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `أنت محرك MetaView للتحليل الجيوسياسي. قم بتجميع الأخبار التالية في مجموعات موضوعية ذكية. 
        أرجع النتيجة بصيغة JSON فقط كقائمة من الكائنات تحتوي على (title, articleUrls, summary).
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
              required: ["title", "articleUrls", "summary"]
            }
          }
        }
      });
      return cleanJson(response.text) || [];
    } catch (err) {
      return [];
    }
  },

  async getStrategicSummary(articles: Article[]): Promise<{summary: string, metrics: {category: string, value: number}[], key_takeaways: string[]}> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const headlines = articles.slice(0, 40).map(a => a.headline).join('\n');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `قم بتحليل المشهد الإخباري الحالي لمنصة MetaView بناءً على العناوين التالية.
        استخلص ملخصاً استراتيجياً، و5 مقاييس أساسية (الاستقرار، الاقتصاد، الأمن، التقنية، التأثير الدولي) من 0-100.
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
      return cleanJson(response.text) || { summary: "", metrics: [], key_takeaways: [] };
    } catch (err) {
      return { summary: "عذراً، فشل محرك التحليل في الاستجابة.", metrics: [], key_takeaways: [] };
    }
  },

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `حلل نبرة النص التالي لـ MetaView وأعطِ تفسيراً موجزاً: "${text}"`,
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
      return cleanJson(response.text) || { label: "neutral", score: 0.5 };
    } catch {
      return { label: "neutral", score: 0.5 };
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
      queryParams.append('limit', (params.top_k || 100).toString());
    }
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}?${queryParams.toString()}`);
      const data = await response.json();
      // Handle different API response formats
      const articles = data.articles || data.results || (Array.isArray(data) ? data : []);
      return articles.map((a: any) => ({
        ...a,
        published_at: a.published_at || 'التاريخ غير متوفر',
        source: a.source || 'مصدر غير معروف',
        article_summary: a.article_summary || a.content?.substring(0, 150) || 'لا يوجد ملخص'
      }));
    } catch (err) { 
      return []; 
    }
  },

  async translateText(text: string, targetLanguage: 'Arabic' | 'English'): Promise<TranslationResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `ترجم النص التالي إلى ${targetLanguage}: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { translated_text: { type: Type.STRING } }, required: ["translated_text"] }
        }
      });
      return cleanJson(response.text) || { translated_text: text };
    } catch {
      return { translated_text: "فشلت الترجمة." };
    }
  },

  async compareArticles(text1: string, text2: string): Promise<ComparisonResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `قارن بين هذين الخبرين استراتيجياً لـ MetaView:\n1: ${text1}\n2: ${text2}`,
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
      return cleanJson(response.text) || { similarity: 0, insights: "", differences: [] };
    } catch {
      return { similarity: 0, insights: "خطأ في المقارنة", differences: [] };
    }
  },

  async detectEditorialBias(articles: Article[]): Promise<any[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const sample = articles.slice(0, 10).map(a => ({ source: a.source, headline: a.headline }));
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `حلل التحيز التحريري لهذه العناوين لـ MetaView: ${JSON.stringify(sample)}`,
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
              required: ["source", "bias_score", "tendency"]
            }
          }
        }
      });
      return cleanJson(response.text) || [];
    } catch { return []; }
  }
};
