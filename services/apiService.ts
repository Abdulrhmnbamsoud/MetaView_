
import { Article, HealthStatus, SearchParams, SentimentResult, ComparisonResult, TranslationResult } from '../types';

const DATA_API_URL = 'https://metaview-api-production.up.railway.app';

export const apiService = {
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
      const response = await fetch(`/api/health`);
      return await response.json();
    } catch {
      return { status: 'offline', rows: 0 };
    }
  },

  async compareArticles(h1: string, h2: string): Promise<ComparisonResult> {
    const response = await fetch(`/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ h1, h2 })
    });
    return await response.json();
  },

  async clusterArticles(articles: Article[]) {
    const response = await fetch(`/api/cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
    });
    return await response.json();
  },

  async getStrategicSummary(articles: Article[]) {
    const response = await fetch(`/api/strategic-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
    });
    return await response.json();
  },

  async detectEditorialBias(articles: Article[]) {
    const response = await fetch(`/api/detect-bias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
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

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const response = await fetch(`/api/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return await response.json();
  }
};
