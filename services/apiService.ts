import { Article, HealthStatus, SearchParams, SentimentResult, ComparisonResult, TranslationResult } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const BASE_URL = 'https://metaview-api-production.up.railway.app';

/**
 * وظيفة معالجة مخرجات JSON لضمان استقرار التطبيق
 */
const safeParseJson = (text: string | undefined) => {
  if (!text) return null;
  try {
    // إزالة أي زوائد نصية قد يضيفها الموديل خارج حدود JSON
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("MetaView AI Engine Error: Failed to parse response text.", e);
    return null;
  }
};

export const apiService = {
  // 1. محرك تجميع الأحداث - Gemini 3 Flash
  async clusterArticles(articles: Article[]): Promise<{title: string, articleUrls: string[], summary?: string}[]> {
    if (articles.length < 2) return [];
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inputData = articles.slice(0, 30).map(a => ({ url: a.url, headline: a.headline }));
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `أنت محرك تصنيف MetaView الاستراتيجي. قم بتجميع هذه العناوين في مجموعات موضوعية ذكية مع ملخص لكل مجموعة.
        البيانات: ${JSON.stringify(inputData)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "عنوان المجموعة الذكي" },
                articleUrls: { type: Type.ARRAY, items: { type: Type.STRING }, description: "روابط المقالات في هذه المجموعة" },
                summary: { type: Type.STRING, description: "ملخص جوهري للمجموعة" }
              },
              required: ["title", "articleUrls", "summary"]
            }
          }
        }
      });
      return safeParseJson(response.text) || [];
    } catch (err) {
      console.error("Clustering Service Failed:", err);
      return [];
    }
  },

  // 2. الموجز الاستراتيجي - Gemini 3 Pro (Complex Reasoning)
  async getStrategicSummary(articles: Article[]): Promise<{summary: string, metrics: {category: string, value: number}[], key_takeaways: string[]}> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const headlines = articles.slice(0, 40).map(a => a.headline).join('\n');
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `قم بتحليل المشهد الإخباري الحالي لمنصة MetaView بناءً على هذه العناوين وقدم رؤية استراتيجية ومقاييس أداء (0-100):\n${headlines}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "ملخص تحليلي شامل للمشهد" },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: "اسم المؤشر (مثال: الاستقرار، الاقتصاد)" },
                    value: { type: Type.NUMBER, description: "قيمة المؤشر" }
                  },
                  required: ["category", "value"]
                }
              },
              key_takeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "أهم 3 استنتاجات" }
            },
            required: ["summary", "metrics", "key_takeaways"]
          }
        }
      });
      return safeParseJson(response.text) || { summary: "تعذر استخراج الموجز الاستراتيجي.", metrics: [], key_takeaways: [] };
    } catch (err) {
      console.error("Strategic Summary Service Failed:", err);
      return { summary: "حدث خطأ في الاتصال بمحرك الذكاء الاصطناعي.", metrics: [], key_takeaways: [] };
    }
  },

  // 3. تحليل النبرة - Gemini 3 Flash
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `حلل نبرة هذا النص التحريري لـ MetaView: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
              score: { type: Type.NUMBER, description: "درجة الثقة من 0 إلى 1" },
              explanation: { type: Type.STRING, description: "شرح سبب التصنيف" }
            },
            required: ["label", "score", "explanation"]
          }
        }
      });
      const result = safeParseJson(response.text);
      return {
        label: result?.label || 'neutral',
        score: result?.score || 0.5,
        explanation: result?.explanation || 'تم تحليل النص كنبرة متوازنة.'
      };
    } catch (err) {
      console.error("Sentiment Service Failed:", err);
      return { label: "neutral", score: 0.5, explanation: 'المحرك في وضع الخمول حالياً.' };
    }
  },

  // 4. الترجمة الذكية - Gemini 3 Flash
  async translateText(text: string, targetLanguage: 'Arabic' | 'English'): Promise<TranslationResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `ترجم النص التالي لـ MetaView إلى ${targetLanguage}: "${text}"`,
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
      const result = safeParseJson(response.text);
      return result || { translated_text: text };
    } catch (err) {
      console.error("Translation Service Failed:", err);
      return { translated_text: text };
    }
  },

  // 5. كشف التحيز - Gemini 3 Pro
  async detectEditorialBias(articles: Article[]): Promise<{url: string, bias_score: number}[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const input = articles.slice(0, 20).map(a => ({ url: a.url, headline: a.headline }));
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `حلل مستوى التحيز التحريري (0-100) لهذه العناوين:\n${JSON.stringify(input)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                url: { type: Type.STRING, description: "رابط المقال" },
                bias_score: { type: Type.NUMBER, description: "درجة التحيز" }
              },
              required: ["url", "bias_score"]
            }
          }
        }
      });
      return safeParseJson(response.text) || [];
    } catch (err) {
      console.error("Bias Detection Service Failed:", err);
      return [];
    }
  },

  // 6. المقارنة الذكية - Gemini 3 Pro
  async compareArticles(headline1: string, headline2: string): Promise<ComparisonResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `قارن استراتيجياً بين هذين العنوانين لـ MetaView:\n1: ${headline1}\n2: ${headline2}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              similarity: { type: Type.NUMBER, description: "نسبة التشابه من 0 إلى 1" },
              insights: { type: Type.STRING, description: "رؤية تحليلية موجزة" },
              differences: { type: Type.ARRAY, items: { type: Type.STRING }, description: "نقاط الاختلاف الرئيسية" }
            },
            required: ["similarity", "insights", "differences"]
          }
        }
      });
      return safeParseJson(response.text) || { similarity: 0, insights: "تعذر إتمام المقارنة.", differences: [] };
    } catch (err) {
      console.error("Comparison Service Failed:", err);
      return { similarity: 0, insights: "فشل الاتصال بالمحرك التحليلي.", differences: [] };
    }
  },

  // جلب البيانات الخام من API MetaView (يعمل في كافة البيئات)
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
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const articles = data.articles || data.results || (Array.isArray(data) ? data : []);
      return articles.map((a: any) => ({
        ...a,
        published_at: a.published_at || 'قيد التحقق',
        source: a.source || 'MetaView Node',
        article_summary: a.article_summary || a.content?.substring(0, 150) || 'لا يوجد ملخص متاح.'
      }));
    } catch (err) {
      console.error("MetaView Data Fetch Error:", err);
      return [];
    }
  },

  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      return { status: data.status || 'ok', rows: data.rows || 0 };
    } catch { return { status: 'offline', rows: 0 }; }
  }
};