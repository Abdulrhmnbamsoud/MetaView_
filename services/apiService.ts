
import { Article, HealthStatus, SearchParams, SentimentResult, ComparisonResult, TranslationResult } from '../types';

// في بيئة التطوير، يتصل بـ localhost، وفي الإنتاج يتصل بنفس نطاق الخادم
const BACKEND_URL = ''; 
const DATA_API_URL = 'https://metaview-api-production.up.railway.app';

export const apiService = {
  // طلب تحليل شامل من الباكيند الخاص بنا
  async getFullAnalysis(params: SearchParams) {
    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: '/articles', params })
      });
      return await response.json();
    } catch (err) {
      console.error("Backend Analysis Failed:", err);
      return null;
    }
  },

  // جلب البيانات الخام (للعرض السريع)
  async searchText(params: SearchParams): Promise<Article[]> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.top_k) queryParams.append('top_k', params.top_k.toString());
    
    try {
      const response = await fetch(`${DATA_API_URL}${params.q ? '/search-text' : '/articles'}?${queryParams.toString()}`);
      const data = await response.json();
      return data.articles || data.results || (Array.isArray(data) ? data : []);
    } catch (err) {
      return [];
    }
  },

  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return await response.json();
    } catch {
      return { status: 'offline', rows: 0 };
    }
  },

  // Fix: Added missing method used by ComparisonDrawer
  async compareArticles(h1: string, h2: string): Promise<ComparisonResult> {
    const response = await fetch(`${BACKEND_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ h1, h2 })
    });
    return await response.json();
  },

  // Fix: Added missing method used by Explore
  async clusterArticles(articles: Article[]) {
    const response = await fetch(`${BACKEND_URL}/cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
    });
    return await response.json();
  },

  // Fix: Added missing method used by Dashboard
  async getStrategicSummary(articles: Article[]) {
    const response = await fetch(`${BACKEND_URL}/strategic-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
    });
    return await response.json();
  },

  // Fix: Added missing method used by Dashboard
  async detectEditorialBias(articles: Article[]) {
    const response = await fetch(`${BACKEND_URL}/detect-bias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
    });
    return await response.json();
  },

  // Fix: Added missing method used by ArticleDetail
  async translateText(text: string, lang: string): Promise<TranslationResult> {
    const response = await fetch(`${BACKEND_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang })
    });
    return await response.json();
  },

  // Fix: Added missing method used by ArticleDetail
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const response = await fetch(`${BACKEND_URL}/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return await response.json();
  }
};
