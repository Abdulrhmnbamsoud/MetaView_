
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Loader2, DatabaseZap, RefreshCw, 
  Clock, Globe, MapPin, AlertCircle, Layers, Compass, Zap, LayoutGrid, Network, Flame
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

const BATCH_SIZE = 50;
const INITIAL_LOAD_SIZE = 150;

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [isClusterMode, setIsClusterMode] = useState(false);
  const [clusters, setClusters] = useState<{title: string, articleUrls: string[]}[]>([]);
  const [isClustering, setIsClustering] = useState(false);

  const [metaSources, setMetaSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  const observer = useRef<IntersectionObserver | null>(null);
  const lastArticleElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const mergeArticles = (oldArticles: Article[], newArticles: Article[], prepend = false) => {
    const existingUrls = new Set(oldArticles.map(a => a.url));
    const uniqueNew = newArticles.filter(a => !existingUrls.has(a.url));
    if (uniqueNew.length === 0) return oldArticles;
    return prepend ? [...uniqueNew, ...oldArticles] : [...oldArticles, ...uniqueNew];
  };

  const performClustering = async (data: Article[]) => {
    if (data.length === 0) return;
    setIsClustering(true);
    try {
      const sample = data.slice(0, 40);
      const result = await apiService.clusterArticles(sample);
      setClusters(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsClustering(false);
    }
  };

  const loadData = async (isNew = true) => {
    if (isNew) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const results = await apiService.searchText({ 
        q: searchQuery, 
        top_k: isNew ? INITIAL_LOAD_SIZE : BATCH_SIZE, 
        offset: isNew ? 0 : (page + 1) * BATCH_SIZE 
      });

      if (isNew) {
        setArticles(results);
        if (isClusterMode) performClustering(results);
        
        if (metaSources.length === 0) {
          const filterSample = await apiService.searchText({ top_k: 1000 });
          const sources = new Set<string>();
          filterSample.forEach(art => { if (art.source) sources.add(art.source); });
          setMetaSources(Array.from(sources).sort());
        }
      } else {
        setArticles(prev => mergeArticles(prev, results));
      }
      setHasMore(results.length >= BATCH_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (searchQuery === '' && !loading && !loadingMore) {
        setIsPolling(true);
        try {
          const latest = await apiService.searchText({ top_k: 20 });
          setArticles(prev => {
            const merged = mergeArticles(prev, latest, true);
            if (isClusterMode && latest.length > 0) performClustering(merged);
            return merged;
          });
        } catch (e) { console.error(e); } finally { setIsPolling(false); }
      }
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [searchQuery, loading, loadingMore, isClusterMode]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(true), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (page > 0) loadData(false);
  }, [page]);

  const processedArticles = useMemo(() => {
    const keywords: Record<string, string[]> = {
      politics: ['سياسة', 'حكومة', 'رئيس', 'وزير'],
      security: ['أمن', 'دفاع', 'جيش'],
      economy: ['اقتصاد', 'مال', 'بورصة'],
      energy: ['طاقة', 'نفط', 'غاز'],
      tech: ['تقنية', 'ذكاء', 'رقمي'],
    };

    return articles.map(art => {
      let cat = 'general';
      const fullText = (art.headline + ' ' + (art.article_summary || '')).toLowerCase();
      for (const [key, words] of Object.entries(keywords)) {
        if (words.some(w => fullText.includes(w))) { cat = key; break; }
      }
      return { ...art, localCategory: cat };
    });
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return processedArticles.filter(art => {
      if (selectedCategory !== 'all' && art.localCategory !== selectedCategory) return false;
      if (selectedSource !== 'all' && art.source !== selectedSource) return false;
      return true;
    });
  }, [processedArticles, selectedCategory, selectedSource]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 font-['Cairo']">
      
      {/* Search & Header */}
      <section className="relative h-[220px] overflow-hidden rounded-[3rem] border border-saudi-gold/20 shadow-2xl bg-black flex flex-col items-center justify-center text-center px-6">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #C5A059 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="flex items-center gap-3 mb-4">
           <div className="px-4 py-1.5 rounded-full border border-saudi-gold/20 bg-saudi-gold/10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-saudi-gold ${isPolling ? 'animate-ping' : ''}`}></div>
              <span className="text-[10px] font-black text-saudi-gold uppercase tracking-widest">رصد الأرشيف الحي</span>
           </div>
        </div>
        <h1 className="text-4xl font-black text-white">استكشاف <span className="text-saudi-gold">أرشيف MetaView</span></h1>
        <p className="text-slate-500 text-xs font-bold mt-2 tracking-widest uppercase">Global MetaView Repository</p>
      </section>

      {/* Simplified Filters */}
      <div className="space-y-6 sticky top-20 z-20 backdrop-blur-xl bg-black/80 p-6 rounded-[2.5rem] border border-saudi-gold/10 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group flex-1 w-full">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-saudi-gold transition-colors" />
            <input 
              type="text"
              placeholder="البحث في محتوى MetaView..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-3xl py-5 pr-14 pl-6 text-white outline-none focus:border-saudi-gold transition-all font-bold"
            />
          </div>
          
          <button 
            onClick={() => setIsClusterMode(!isClusterMode)}
            className={`px-8 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all ${isClusterMode ? 'bg-saudi-gold text-black shadow-xl shadow-saudi-gold/20' : 'bg-zinc-900 text-slate-400 border border-white/5 hover:border-saudi-gold/30 hover:bg-zinc-800'}`}
          >
            <Network className="w-5 h-5" />
            {isClusterMode ? 'عرض الشبكة' : 'تجميع الأحداث'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full appearance-none bg-zinc-900 border border-white/5 rounded-2xl py-4 pr-11 pl-4 text-[11px] font-black text-slate-300 outline-none hover:border-saudi-gold transition-all cursor-pointer">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-saudi-gold pointer-events-none" />
          </div>

          <div className="relative">
            <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className="w-full appearance-none bg-zinc-900 border border-white/5 rounded-2xl py-4 pr-11 pl-4 text-[11px] font-black text-slate-300 outline-none hover:border-saudi-gold transition-all cursor-pointer">
              <option value="all">كافة المصادر</option>
              {metaSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <DatabaseZap className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-saudi-gold pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-saudi-gold" />
          <p className="font-black text-slate-500 text-[10px] uppercase tracking-widest">جاري جلب البيانات...</p>
        </div>
      ) : filteredArticles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article, i) => {
              const isLast = i === filteredArticles.length - 1;
              return (
                <div 
                  key={`${article.url}-${i}`}
                  ref={isLast ? lastArticleElementRef : null}
                  onClick={() => navigate(`/article/${encodeURIComponent(article.headline)}`, { state: { article } })}
                  className="group bg-black border border-saudi-gold/20 p-8 rounded-[2.5rem] hover:border-saudi-gold/80 transition-all cursor-pointer flex flex-col justify-between shadow-2xl hover:-translate-y-2 relative"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-saudi-gold">{article.source}</span>
                      <span className="text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {article.published_at}</span>
                    </div>
                    <h3 className="text-lg font-black text-white group-hover:text-saudi-gold transition-colors line-clamp-2 leading-tight">{article.headline}</h3>
                    <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed font-medium">{article.article_summary}</p>
                  </div>
                  <div className="mt-8 pt-5 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-saudi-gold/60" /> {article.country || 'International'}</span>
                    <span className="bg-saudi-gold/10 text-saudi-gold px-3 py-1 rounded-full border border-saudi-gold/10">{(article as any).localCategory}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {loadingMore && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-saudi-gold" /></div>}
        </>
      ) : (
        <div className="text-center py-40 bg-zinc-900/10 rounded-[3rem] border border-dashed border-saudi-gold/20">
          <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-black">لا توجد سجلات مطابقة.</p>
        </div>
      )}
    </div>
  );
};

export default Explore;
