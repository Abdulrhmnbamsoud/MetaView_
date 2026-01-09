
export interface Article {
  id?: string | number;
  headline: string;
  article_summary: string;
  content?: string;
  published_at: string;
  source: string;
  url: string;
  country?: string;
  domain?: string;
  sentiment_label?: 'positive' | 'neutral' | 'negative';
}

export interface SearchParams {
  q?: string;
  top_k?: number;
  offset?: number;
  source?: string;
  country?: string;
  domain?: string;
  min_date?: string;
  max_date?: string;
}

export interface FiltersData {
  sources: string[];
  domains: string[];
  countries: string[];
}

export interface DashboardMetrics {
  total_articles: number;
  top_sources: { source: string; count: number }[];
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface HealthStatus {
  status: string;
  rows: number;
  service?: string;
}

export interface SentimentResult {
  label: 'positive' | 'neutral' | 'negative';
  score: number;
  explanation?: string;
}

export interface TranslationResult {
  translated_text: string;
}

export interface ComparisonResult {
  similarity: number;
  insights: string;
  differences: string[];
}

export interface IngestLog {
  id: number;
  source: string;
  status: 'success' | 'failed';
  timestamp: string;
  rows_added: number;
}
