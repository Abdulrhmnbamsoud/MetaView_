
import { Article, HealthStatus, SearchParams, SentimentResult, ComparisonResult, TranslationResult } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const BASE_URL = 'https://metaview-api-production.up.railway.app';

// وظيفة تنظيف مخرجات الـ AI لضمان JSON صالح دائماً
// Fix: Added check for undefined text and improved parsing safety
const cleanJson = (text: string | undefined) => {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("MetaView Engine Error: Failed to parse AI response.", e);
    return null;
  }
};

export const apiService = {
  // 1. محرك تجميع الأحداث (Clustering Model)
  async clusterArticles(articles: Article[]): Promise<{title: string, articleUrls: string[], summary?: string}[]> {
    if (articles.length < 2) return [];
    // Fix: Using new GoogleGenAI instance for each request to ensure fresh key access
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inputData = articles.slice(0, 30).map(a => ({ url: a.url, headline: a.headline }));
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `أنت محرك تصنيف MetaView الاستراتيجي. قم بتحليل العناوين التالية وتجميعها في مجموعات موضوعية ذكية. أرجع النتيجة كـ JSON فقط.
        البيانات: ${JSON.stringify(inputData)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "عنوان المجموعة الذكي" },
                articleUrls: { type: Type.ARRAY, items: { type: Type.STRING }, description: "روابط المقالات المنتمية للمجموعة" },
                summary: { type: Type.STRING, description: "ملخص قصير جداً لجوهر هذه المجموعة" }
              },
              required: ["title", "articleUrls", "summary"]
            }
          }
        }
      });
      return cleanJson(response.text) || [];
    } catch { return []; }
  },

  // 2. محرك الموجز الاستراتيجي (Strategic Briefing Model)
  async getStrategicSummary(articles: Article[]): Promise<{summary: string, metrics: {category: string, value: number}[], key_takeaways: string[]}> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const headlines = articles.slice(0, 40).map(a => a.headline).join('\n');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `قم بتحليل المشهد الإخباري الحالي لمنصة MetaView بناءً على هذه العناوين:\n${headlines}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "ملخص تحليلي شامل للمشهد الحالي" },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { 
                    category: { type: Type.STRING, description: "اسم المؤشر (مثال: الاستقرار، الاقتصاد، الأمن)" }, 
                    value: { type: Type.NUMBER, description: "قيمة المؤشر من 0 إلى 100" } 
                  },
                  required: ["category", "value"]
                }
              },
              key_takeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "أهم 3 استنتاجات جوهرية" }
            },
            required: ["summary", "metrics", "key_takeaways"]
          }
        }
      });
      return cleanJson(response.text) || { summary: "", metrics: [], key_takeaways: [] };
    } catch { return { summary: "تعذر استخلاص الموجز حالياً.", metrics: [], key_takeaways: [] }; }
  },

  // 3. محرك تحليل النبرة (Sentiment Analysis Model)
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `حلل نبرة هذا النص التحريري لـ MetaView: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { 
              label: { type: Type.STRING, enum: ["positive", "neutral", "negative"] }, 
              score: { type: Type.NUMBER, description: "درجة الثقة من 0 إلى 1" },
              explanation: { type: Type.STRING, description: "شرح مختصر لسبب هذا التصنيف" }
            },
            required: ["label", "score", "explanation"]
          }
        }
      });
      const result = cleanJson(response.text);
      return {
        label: result?.label || 'neutral',
        score: result?.score || 0.5,
        explanation: result?.explanation || 'تم تحليل النص كنبرة متوازنة.'
      };
    } catch {
      return { label: "neutral", score: 0.5, explanation: 'المحرك في وضع الخمول.' };
    }
  },

  // 4. محرك الترجمة الذكية (Translation Model)
  async translateText(text: string, targetLanguage: 'Arabic' | 'English'): Promise<TranslationResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
      const result = cleanJson(response.text);
      return result || { translated_text: text };
    } catch { return { translated_text: text }; }
  },

  // 5. محرك كشف التحيز التحريري (Bias Detection Model)
  // Fix: Implemented missing detectEditorialBias method used in Dashboard.tsx
  async detectEditorialBias(articles: Article[]): Promise<{url: string, bias_score: number}[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const input = articles.slice(0, 20).map(a => ({ url: a.url, headline: a.headline }));
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `حلل مستوى التحيز التحريري للعناوين التالية لـ MetaView. أرجع قائمة JSON تحتوي على رابط المقال ودرجة التحيز من 0 إلى 100.
        البيانات: ${JSON.stringify(input)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                url: { type: Type.STRING, description: "رابط المقال" },
                bias_score: { type: Type.NUMBER, description: "درجة التحيز من 0 إلى 100" }
              },
              required: ["url", "bias_score"]
            }
          }
        }
      });
      return cleanJson(response.text) || [];
    } catch { return []; }
  },

  // جلب البيانات الخام من API MetaView فقط
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
        published_at: a.published_at || 'قيد التحقق',
        source: a.source || 'MetaView Node',
        article_summary: a.article_summary || a.content?.substring(0, 150) || 'لا يوجد ملخص متاح.'
      }));
    } catch { return []; }
  },

  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      return { status: data.status || 'ok', rows: data.rows || 0 };
    } catch { return { status: 'offline', rows: 0 }; }
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
  }
};
