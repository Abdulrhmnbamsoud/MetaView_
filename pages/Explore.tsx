
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Loader2, Clock, Globe, MapPin, AlertCircle, Layers, Compass, Network, Sparkles, Database
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { Article } from '../types';

const CATEGORIES = [
  { id: 'all', label: 'كافة المواضيع' },
  { id: 'politics', label: 'سياسة وحكومة' },
  { id: 'economy', label: 'اقتصاد وشركات' },
  { id: 'security', label: 'أمن ودفاع' },
  { id: 'energy', label: 'طاقة وموارد' },
  { id: 'tech', label: 'تقنية وابتكار' },
];

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isClusterMode, setIsClusterMode] = useState(false);
  const [clusters, setClusters] = useState<{title: string, articleUrls: string[], summary?: string}[]>([]);
  const [isClustering, setIsClustering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await apiService.searchText({ q: searchQuery, top_k: 100 });
      setArticles(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClusterToggle = async () => {
    const nextMode = !isClusterMode;
    setIsClusterMode(nextMode);
    if (nextMode && clusters.length === 0 && articles.length > 0) {
      setIsClustering(true);
      const res = await apiService.clusterArticles(articles);
      setClusters(res);
      setIsClustering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 font-['Cairo']">
      
      {/* Search & Header */}
      <section className="relative h-[220px] overflow-hidden rounded-[3rem] border border-saudi-gold/20 shadow-2xl bg-black flex flex-col items-center justify-center text-center px-6">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #C5A059 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <h1 className="text-4xl font-black text-white">استكشاف <span className="text-saudi-gold">أرشيف MetaView</span></h1>
        <p className="text-slate-500 text-xs font-bold mt-2 tracking-widest uppercase">Global MetaView Intelligence Hub</p>
      </section>

      {/* Filters */}
      <div className="space-y-6 sticky top-20 z-20 backdrop-blur-xl bg-black/80 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group flex-1 w-full">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-saudi-gold transition-colors" />
            <input 
              type="text"
              placeholder="البحث في سجلات MetaView..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-3xl py-5 pr-14 pl-6 text-white outline-none focus:border-saudi-gold transition-all font-bold"
            />
          </div>
          
          <button 
            onClick={handleClusterToggle}
            className={`px-8 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all ${isClusterMode ? 'bg-saudi-gold text-black' : 'bg-zinc-900 text-slate-400 border border-white/5'}`}
          >
            <Network className="w-5 h-5" />
            {isClusterMode ? 'عرض المجموعات' : 'تجميع الأحداث ذكياً'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-saudi-gold" />
          <p className="font-black text-slate-500 uppercase tracking-widest">جاري جلب البيانات من MetaView...</p>
        </div>
      ) : isClusterMode ? (
        <div className="space-y-12">
          {isClustering && (
            <div className="flex items-center justify-center py-20 gap-4">
              <Sparkles className="w-6 h-6 text-saudi-gold animate-pulse" />
              <p className="text-saudi-gold font-black uppercase tracking-widest">الذكاء الاصطناعي يقوم بتجميع الأحداث حالياً...</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {clusters.map((cluster, idx) => (
              <div key={idx} className="official-card p-10 rounded-[3rem] border border-saudi-gold/20 bg-black space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-saudi-gold/10 rounded-xl flex items-center justify-center text-saudi-gold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-white">{cluster.title}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed italic border-r-2 border-saudi-gold/40 pr-4">{cluster.summary}</p>
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black text-saudi-gold uppercase tracking-widest">المصادر المرتبطة ({cluster.articleUrls.length})</p>
                  {cluster.articleUrls.slice(0, 4).map((url, i) => {
                    const art = articles.find(a => a.url === url);
                    return art ? (
                      <div key={i} onClick={() => navigate(`/article/${encodeURIComponent(art.headline)}`, { state: { article: art } })} className="text-xs text-slate-400 hover:text-saudi-gold cursor-pointer transition-colors truncate flex items-center gap-2">
                        <Database className="w-3 h-3 opacity-40" /> {art.headline}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, i) => (
            <div 
              key={i}
              onClick={() => navigate(`/article/${encodeURIComponent(article.headline)}`, { state: { article } })}
              className="group bg-black border border-white/5 p-8 rounded-[2.5rem] hover:border-saudi-gold/60 transition-all cursor-pointer shadow-2xl hover:-translate-y-2"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-saudi-gold">{article.source}</span>
                  <span className="text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {article.published_at}</span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-saudi-gold transition-colors line-clamp-2 leading-tight">{article.headline}</h3>
                <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed font-medium">{article.article_summary}</p>
              </div>
              <div className="mt-8 pt-5 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-slate-400">
                <span className="flex items-center gap-1.5 uppercase tracking-widest"><Globe className="w-3 h-3 text-saudi-gold/60" /> {article.country || 'Global'}</span>
                <span className="bg-saudi-gold/10 text-saudi-gold px-3 py-1 rounded-full border border-saudi-gold/10 uppercase tracking-widest">DOC-{1000 + i}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
