
import { Article, HealthStatus, SearchParams, SentimentResult, ComparisonResult, TranslationResult } from '../types';

export const apiService = {
  // المحرك الرئيسي الجديد: جلب البيانات وتحليلها في طلب واحد
  async getAnalysis(params: SearchParams, lang: 'ar' | 'en' = 'ar') {
    try {
      const response = await fetch(`/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: '/articles', params, lang })
      });
      if (!response.ok) throw new Error("Backend Failure");
      return await response.json();
    } catch (err) {
      console.error("Full Analysis Failed:", err);
      return null;
    }
  },

  async searchText(params: SearchParams): Promise<Article[]> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.top_k) queryParams.append('top_k', params.top_k.toString());
    
    try {
      const response = await fetch(`https://metaview-api-production.up.railway.app${params.q ? '/search-text' : '/articles'}?${queryParams.toString()}`);
      const data = await response.json();
      return data.articles || data.results || (Array.isArray(data) ? data : []);
    } catch (err) { return []; }
  },

  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`/api/health`);
      return await response.json();
    } catch { return { status: 'offline', rows: 0 }; }
  },

  async compareArticles(h1: string, h2: string): Promise<ComparisonResult> {
    const response = await fetch(`/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ h1, h2 })
    });
    return await response.json();
  },

  async clusterArticles(articles: Article[], lang: 'ar' | 'en' = 'ar') {
    const response = await fetch(`/api/cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles, lang })
    });
    return await response.json();
  },

  async translateText(text: string, lang: string): Promise<TranslationResult> {
    const response = await fetch(`/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang })
    });
    return await response.json();
  },

  async analyzeSentiment(text: string, lang: 'ar' | 'en' = 'ar'): Promise<SentimentResult> {
    const response = await fetch(`/api/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang })
    });
    return await response.json();
  }
};
