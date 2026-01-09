
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Globe, Languages, Smile, ArrowRight, Loader2, Volume2, Sparkles, Copy, Check } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Article, SentimentResult, TranslationResult } from '../types';

const ArticleDetail: React.FC = () => {
  const { headline } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // AI States
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [translatingLang, setTranslatingLang] = useState<'Arabic' | 'English' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (location.state?.article) {
      setArticle(location.state.article);
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      setLoading(true);
      try {
        const decodedHeadline = decodeURIComponent(headline || '');
        const results = await apiService.searchText({ q: decodedHeadline });
        if (results.length > 0) {
          const exactMatch = results.find(a => a.headline === decodedHeadline);
          setArticle(exactMatch || results[0]);
        }
      } catch (err) {
        console.error("Fetch Article Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [headline, location.state]);

  const handleTranslate = async (lang: 'Arabic' | 'English') => {
    if (!article) return;
    setTranslatingLang(lang);
    try {
      const res = await apiService.translateText(article.article_summary, lang);
      setTranslation(res);
    } catch (e) { console.error(e); }
    finally { setTranslatingLang(null); }
  };

  const handleSentiment = async () => {
    if (!article) return;
    const res = await apiService.analyzeSentiment(article.article_summary);
    setSentiment(res);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-saudi-gold animate-spin" />
      <p className="font-bold text-slate-500">جاري تحليل بيانات المقال...</p>
    </div>
  );

  if (!article) return (
    <div className="p-20 text-center space-y-6">
      <div className="text-slate-700 text-6xl font-black">404</div>
      <div className="text-white text-xl font-bold">عذراً، لم نتمكن من العثور على محتوى هذا المقال</div>
      <button onClick={() => navigate('/')} className="bg-saudi-gold text-black px-8 py-3 rounded-xl font-black">
        العودة للرئيسية
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-40 space-y-12 animate-in fade-in duration-700">
      
      {/* Top Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-black border border-white/5 p-6 rounded-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold">
          <ArrowRight className="w-5 h-5" /> رجوع
        </button>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={handleSentiment} className="flex items-center gap-2 px-5 py-2.5 bg-saudi-gold/10 text-saudi-gold border border-saudi-gold/20 rounded-xl font-black text-xs hover:bg-saudi-gold/20 transition-all">
            <Smile className="w-4 h-4" /> تحليل المشاعر
          </button>
          
          <button 
            onClick={() => handleTranslate('Arabic')} 
            disabled={!!translatingLang}
            className="flex items-center gap-2 px-5 py-2.5 bg-saudi-gold text-black rounded-xl font-black text-xs hover:brightness-110 transition-all shadow-lg shadow-saudi-gold/10"
          >
            {translatingLang === 'Arabic' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
            ترجمة للعربية
          </button>

          <button 
            onClick={() => handleTranslate('English')} 
            disabled={!!translatingLang}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 text-saudi-gold border border-saudi-gold/20 rounded-xl font-black text-xs hover:bg-white/10 transition-all"
          >
            {translatingLang === 'English' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
            Translate to EN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
          <div className="bg-black border border-white/5 p-10 rounded-[2.5rem] shadow-xl">
            <div className="flex items-center gap-4 mb-6">
               <span className="bg-saudi-gold text-black px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">{article.source}</span>
               <span className="text-slate-500 text-xs font-bold flex items-center gap-2">
                 <Calendar className="w-4 h-4" /> {article.published_at}
               </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-8">
              {article.headline}
            </h1>

            <div className="prose prose-invert max-w-none space-y-8">
               <div className="p-8 bg-zinc-900/40 rounded-3xl border-r-8 border-saudi-gold">
                  <h3 className="text-saudi-gold font-black text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> ملخص MetaView
                  </h3>
                  <p className="text-lg text-slate-300 leading-relaxed font-medium italic">
                    {article.article_summary}
                  </p>
               </div>

               <div className="text-slate-400 leading-loose text-lg font-medium space-y-6">
                 {article.content ? article.content.split('\n').map((p, i) => <p key={i}>{p}</p>) : (
                   <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center">
                     <p className="opacity-50 italic">المحتوى الكامل متوفر مباشرة في الرابط الأصلي للمصدر.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* AI Translation Output */}
          {translation && (
            <div className="bg-black border border-saudi-gold/20 p-8 rounded-[2rem] animate-in zoom-in duration-300">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-saudi-gold font-black text-lg flex items-center gap-2">
                   <Languages className="w-5 h-5" /> نتيجة الترجمة الذكية
                 </h3>
                 <button onClick={() => {navigator.clipboard.writeText(translation.translated_text); setCopied(true); setTimeout(()=>setCopied(false),2000)}} className="text-slate-500 hover:text-white transition-colors">
                   {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                 </button>
               </div>
               <div className="p-6 bg-zinc-900/60 rounded-2xl text-white text-lg border border-white/5 leading-relaxed">
                  {translation.translated_text}
               </div>
            </div>
          )}

          {/* Sentiment Output */}
          {sentiment && (
            <div className="bg-black border border-saudi-gold/20 p-8 rounded-[2rem] animate-in zoom-in duration-300">
               <h3 className="text-saudi-gold font-black text-lg mb-6 flex items-center gap-2">
                 <Smile className="w-5 h-5" /> تحليل التوجه العام (MetaView AI)
               </h3>
               <div className="flex items-center gap-8">
                  <div className={`text-2xl font-black px-8 py-3 rounded-2xl ${
                    sentiment.label === 'positive' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                    sentiment.label === 'negative' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                  }`}>
                    {sentiment.label === 'positive' ? 'إيجابي' : sentiment.label === 'negative' ? 'سلبي' : 'محايد'}
                  </div>
                  <div className="flex-1 space-y-2">
                     <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-saudi-gold" style={{ width: `${sentiment.score * 100}%` }}></div>
                     </div>
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">الثقة: {Math.round(sentiment.score * 100)}%</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Info Card Sidebar */}
        <div className="space-y-6">
          <div className="bg-black border border-white/5 p-8 rounded-[2.5rem] shadow-xl sticky top-28">
            <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-8 text-center">بيانات التوثيق</h4>
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-saudi-gold/10 rounded-xl flex items-center justify-center text-saudi-gold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">النطاق</p>
                    <p className="text-sm font-bold text-white uppercase">{article.country || 'Global'}</p>
                  </div>
               </div>
               
               <div className="pt-8 border-t border-white/5 space-y-4">
                 <a 
                   href={article.url} 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center justify-center w-full py-4 bg-saudi-gold hover:brightness-110 text-black rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95"
                 >
                   زيارة المصدر الأصلي
                 </a>
                 <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 text-center">
                   <p className="text-[10px] text-slate-500 font-bold leading-tight">تم التحقق من الوثيقة عبر MetaView ({article.source})</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
