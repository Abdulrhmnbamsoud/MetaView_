
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Globe, Languages, Smile, ArrowRight, Loader2, Sparkles, Copy, Check, Info } from 'lucide-react';
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
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
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
    setIsAnalyzingSentiment(true);
    try {
      const res = await apiService.analyzeSentiment(article.article_summary);
      setSentiment(res);
    } catch (e) { console.error(e); }
    finally { setIsAnalyzingSentiment(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 border-4 border-saudi-gold/20 border-b-saudi-gold rounded-full animate-spin"></div>
      <p className="font-black text-saudi-gold tracking-widest uppercase text-xs">MetaView Core Analyzing...</p>
    </div>
  );

  if (!article) return (
    <div className="p-20 text-center space-y-6">
      <div className="text-slate-700 text-6xl font-black">404</div>
      <div className="text-white text-xl font-bold">عذراً، لم نتمكن من العثور على محتوى هذا المقال</div>
      <button onClick={() => navigate('/')} className="bg-saudi-gold text-black px-8 py-3 rounded-xl font-black">العودة للرئيسية</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-40 space-y-12 animate-in fade-in duration-700 font-['Cairo']">
      
      {/* Top Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-black border border-white/5 p-6 rounded-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest">
          <ArrowRight className="w-5 h-5" /> رجوع للموجز
        </button>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleSentiment} 
            disabled={isAnalyzingSentiment}
            className="flex items-center gap-2 px-6 py-3 bg-saudi-gold/10 text-saudi-gold border border-saudi-gold/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-saudi-gold/20 transition-all disabled:opacity-50"
          >
            {isAnalyzingSentiment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smile className="w-4 h-4" />}
            تحليل النبرة التحريرية
          </button>
          
          <button 
            onClick={() => handleTranslate('Arabic')} 
            disabled={!!translatingLang}
            className="flex items-center gap-2 px-6 py-3 bg-saudi-gold text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-saudi-gold/10"
          >
            {translatingLang === 'Arabic' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
            ترجمة MetaView (عربي)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
          <div className="bg-black border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-saudi-gold/5 blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-4 mb-8">
               <span className="bg-saudi-gold text-black px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">{article.source}</span>
               <span className="text-slate-500 text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
                 <Calendar className="w-4 h-4 text-saudi-gold/40" /> {article.published_at}
               </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.2] mb-10 tracking-tighter">
              {article.headline}
            </h1>

            <div className="prose prose-invert max-w-none space-y-12">
               <div className="p-10 bg-[#0a0a0a] rounded-[2.5rem] border-r-[6px] border-saudi-gold shadow-inner">
                  <h3 className="text-saudi-gold font-black text-xs mb-4 flex items-center gap-2 uppercase tracking-[0.3em]">
                    <Sparkles className="w-4 h-4" /> ملخص MetaView الاستراتيجي
                  </h3>
                  <p className="text-xl text-slate-200 leading-[1.8] font-medium italic">
                    {article.article_summary}
                  </p>
               </div>

               <div className="text-slate-400 leading-[2] text-lg font-medium space-y-8 px-2">
                 {article.content ? article.content.split('\n').map((p, i) => <p key={i}>{p}</p>) : (
                   <div className="py-20 border border-dashed border-white/5 rounded-[3rem] text-center flex flex-col items-center gap-4">
                     <Info className="w-10 h-10 text-slate-800" />
                     <p className="text-slate-600 font-bold text-sm">المحتوى التفصيلي متاح عبر البوابة الأصلية للمصدر.</p>
                     <a href={article.url} target="_blank" className="text-saudi-gold text-xs font-black underline underline-offset-8">انقر هنا للانتقال</a>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* AI Translation Output */}
          {translation && (
            <div className="bg-black border border-saudi-gold/20 p-10 rounded-[3rem] animate-in zoom-in duration-500 shadow-2xl">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-saudi-gold font-black text-xs flex items-center gap-3 uppercase tracking-[0.3em]">
                   <Languages className="w-5 h-5" /> الترجمة الآلية الذكية
                 </h3>
                 <button onClick={() => {navigator.clipboard.writeText(translation.translated_text); setCopied(true); setTimeout(()=>setCopied(false),2000)}} className="p-3 bg-white/5 rounded-xl hover:text-saudi-gold transition-colors">
                   {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                 </button>
               </div>
               <div className="p-8 bg-[#050505] rounded-3xl text-slate-200 text-lg border border-white/5 leading-[1.9]">
                  {translation.translated_text}
               </div>
            </div>
          )}

          {/* Sentiment Output */}
          {sentiment && (
            <div className="bg-black border border-saudi-gold/20 p-10 rounded-[3rem] animate-in zoom-in duration-500 shadow-2xl space-y-8">
               <h3 className="text-saudi-gold font-black text-xs flex items-center gap-3 uppercase tracking-[0.3em]">
                 <Smile className="w-5 h-5" /> تشريح النبرة التحريرية
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-8 bg-[#050505] rounded-[2rem] border border-white/5">
                    <div className={`text-3xl font-black mb-2 ${
                      sentiment.label === 'positive' ? 'text-emerald-500' : 
                      sentiment.label === 'negative' ? 'text-red-500' : 'text-slate-400'
                    }`}>
                      {sentiment.label === 'positive' ? 'إيجابي' : sentiment.label === 'negative' ? 'سلبي' : 'محايد'}
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">التوجه العام</span>
                  </div>

                  <div className="md:col-span-8 space-y-4">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">درجة الثقة التحليلية</span>
                        <span className="text-saudi-gold font-black text-sm">{Math.round(sentiment.score * 100)}%</span>
                     </div>
                     <div className="h-4 bg-[#0a0a0a] rounded-full overflow-hidden border border-white/5 p-1">
                        <div className="h-full bg-saudi-gold rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(197,160,89,0.4)]" style={{ width: `${sentiment.score * 100}%` }}></div>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-saudi-gold/5 rounded-3xl border border-saudi-gold/10">
                  <p className="text-sm font-bold text-slate-300 leading-relaxed">
                    <span className="text-saudi-gold font-black ml-2">رؤية MetaView:</span>
                    {sentiment.explanation}
                  </p>
               </div>
            </div>
          )}
        </div>

        {/* Info Card Sidebar */}
        <div className="space-y-6">
          <div className="bg-black border border-white/5 p-10 rounded-[3rem] shadow-2xl sticky top-28">
            <h4 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-center">Metadata Node</h4>
            <div className="space-y-8">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-saudi-gold/10 rounded-2xl flex items-center justify-center text-saudi-gold border border-saudi-gold/10">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">النطاق الجغرافي</p>
                    <p className="text-sm font-black text-white uppercase tracking-tighter">{article.country || 'International'}</p>
                  </div>
               </div>
               
               <div className="pt-10 border-t border-white/5 space-y-4">
                 <a 
                   href={article.url} 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center justify-center w-full py-5 bg-saudi-gold hover:brightness-110 text-black rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-2xl active:scale-95"
                 >
                   زيارة المصدر الأصلي
                 </a>
                 <div className="p-5 bg-[#050505] rounded-2xl border border-white/5 text-center">
                   <p className="text-[9px] text-slate-600 font-black leading-tight uppercase tracking-widest">Verified by MetaView Core Hub</p>
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
