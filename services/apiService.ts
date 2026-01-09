
import { Article, HealthStatus, SearchParams, SentimentResult, ComparisonResult, TranslationResult } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const BASE_URL = 'https://metaview-api-production.up.railway.app';

// وظيفة تنظيف مخرجات الـ AI لضمان JSON صالح
const cleanJson = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("MetaView AI Parse Error:", e);
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inputData = articles.slice(0, 30).map(a => ({ url: a.url, headline: a.headline }));
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `أنت خبير تصنيف MetaView. قم بتجميع هذه الأخبار في مجموعات موضوعية. أرجع JSON فقط. البيانات: ${JSON.stringify(inputData)}`,
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
    } catch { return []; }
  },

  async getStrategicSummary(articles: Article[]): Promise<{summary: string, metrics: {category: string, value: number}[], key_takeaways: string[]}> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const headlines = articles.slice(0, 40).map(a => a.headline).join('\n');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `تحليل استراتيجي لـ MetaView بناءً على العناوين:\n${headlines}`,
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
                  properties: { category: { type: Type.STRING }, value: { type: Type.NUMBER } },
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
    } catch { return { summary: "فشل التحليل الاستراتيجي.", metrics: [], key_takeaways: [] }; }
  },

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `حلل مشاعر النص التالي لـ MetaView: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { 
              label: { type: Type.STRING }, 
              score: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ["label", "score", "explanation"]
          }
        }
      });
      const result = cleanJson(response.text);
      return {
        label: result?.label || 'neutral',
        score: result?.score || 0.5,
        explanation: result?.explanation || 'لم يتم استخراج تفسير.'
      };
    } catch {
      return { label: "neutral", score: 0.5, explanation: 'حدث خطأ أثناء التحليل.' };
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
      const articles = data.articles || data.results || (Array.isArray(data) ? data : []);
      return articles.map((a: any) => ({
        ...a,
        published_at: a.published_at || 'قيد المعالجة',
        source: a.source || 'MetaView Node',
        article_summary: a.article_summary || a.content?.substring(0, 150) || 'لا يوجد ملخص متاح.'
      }));
    } catch { return []; }
  },

  async translateText(text: string, targetLanguage: 'Arabic' | 'English'): Promise<TranslationResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `ترجم النص التالي لـ MetaView إلى ${targetLanguage}: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { translated_text: { type: Type.STRING } }, required: ["translated_text"] }
        }
      });
      return cleanJson(response.text) || { translated_text: text };
    } catch { return { translated_text: text }; }
  },

  async compareArticles(text1: string, text2: string): Promise<ComparisonResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `قارن استراتيجياً بين:\n1: ${text1}\n2: ${text2}`,
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
    } catch { return { similarity: 0, insights: "خطأ في المقارنة", differences: [] }; }
  },

  async detectEditorialBias(articles: Article[]): Promise<any[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const sample = articles.slice(0, 10).map(a => ({ source: a.source, headline: a.headline }));
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `تحليل التحيز لـ MetaView: ${JSON.stringify(sample)}`,
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
