
import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Shield, Radar as RadarIcon, 
  PieChart as PieIcon, Activity, 
  TrendingUp, Info, Zap, Fingerprint, 
  Landmark, Radio, Database,
  ArrowUpRight, Wind, BrainCircuit
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { Article } from '../types';
import { 
  XAxis, YAxis, Tooltip as ReTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, 
  Radar as ReRadar, RadarChart, PolarGrid, PolarAngleAxis,
  AreaChart, Area, CartesianGrid
} from 'recharts';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [strategicData, setStrategicData] = useState<{summary: string, metrics: any[], key_takeaways: string[]}>({
    summary: '',
    metrics: [],
    key_takeaways: []
  });
  const [biasData, setBiasData] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // SVG Gauge Calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  const fetchFullIntelligence = async () => {
    setLoading(true);
    try {
      const results = await apiService.searchText({ top_k: 500 });
      setArticles(results);

      setIsAnalyzing(true);
      const [strat, bias] = await Promise.all([
        apiService.getStrategicSummary(results.slice(0, 80)),
        apiService.detectEditorialBias(results.slice(0, 40))
      ]);

      setStrategicData(strat);
      setBiasData(bias);
    } catch (err) {
      console.error("Dashboard Service Error:", err);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchFullIntelligence();
  }, []);

  const analytics = useMemo(() => {
    if (articles.length === 0) return { 
      sentimentData: [], averageBias: 0, momentumData: [] 
    };
    
    const catFrequencies: Record<string, number> = {
      'سياسة': 0, 'اقتصاد': 0, 'أمن': 0, 'طاقة': 0, 'تقنية': 0, 'أخرى': 0
    };
    const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
    
    articles.forEach(art => {
      const text = (art.headline + ' ' + (art.article_summary || '')).toLowerCase();
      
      if (text.includes('سياس')) catFrequencies['سياسة']++;
      else if (text.includes('اقتصاد')) catFrequencies['اقتصاد']++;
      else if (text.includes('أمن')) catFrequencies['أمن']++;
      else if (text.includes('طاق')) catFrequencies['طاقة']++;
      else if (text.includes('تقني')) catFrequencies['تقنية']++;
      else catFrequencies['أخرى']++;

      let sentiment = art.sentiment_label;
      if (!sentiment) {
        if (text.includes('نجاح') || text.includes('نمو') || text.includes('ممتاز')) sentiment = 'positive';
        else if (text.includes('تراجع') || text.includes('خطر') || text.includes('أزمة')) sentiment = 'negative';
        else sentiment = 'neutral';
      }
      sentimentDistribution[sentiment]++;
    });

    const momentumData = Object.entries(catFrequencies)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const sentimentData = [
      { name: 'إيجابي', value: sentimentDistribution.positive || 1, color: '#C5A059' }, // ذهبي للإيجابي
      { name: 'محايد', value: sentimentDistribution.neutral || 1, color: '#475569' },
      { name: 'سلبي', value: sentimentDistribution.negative || 1, color: '#b91c1c' }
    ];

    const averageBias = biasData.length > 0 
      ? Math.round(biasData.reduce((acc, curr) => acc + curr.bias_score, 0) / biasData.length)
      : 46;

    return { sentimentData, averageBias, momentumData };
  }, [articles, biasData]);

  if (loading) return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col items-center justify-center font-['Cairo']">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-b-2 border-saudi-gold rounded-full animate-spin"></div>
        <Landmark className="w-10 h-10 text-saudi-gold absolute inset-0 m-auto animate-pulse" />
      </div>
      <p className="text-[11px] font-black text-slate-400 dark:text-saudi-gold/60 tracking-[0.4em] uppercase">MetaView System Analyzing</p>
    </div>
  );

  return (
    <div className="max-w-[1536px] mx-auto space-y-12 pb-40 px-6 pt-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 border-b border-slate-200 dark:border-white/5 pb-12">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-saudi-gold/10 rounded-[1.5rem] flex items-center justify-center border border-saudi-gold/20 shadow-2xl">
             <BrainCircuit className="w-12 h-12 text-saudi-gold" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">تحليلات MetaView</h1>
            <div className="flex items-center gap-5">
               <span className="text-[10px] font-black text-emerald-500 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  System Online
               </span>
               <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                 <Database className="w-4 h-4 opacity-40" /> {articles.length.toLocaleString()} مرجع
               </span>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchFullIntelligence} 
          disabled={isAnalyzing}
          className="flex items-center gap-3 px-10 py-5 bg-slate-900 dark:bg-saudi-gold text-white dark:text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
        >
           <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} /> تحديث بيانات MetaView
        </button>
      </div>

      {/* TOP BRIEFING: BLACK & GREY THEME */}
      <section className="official-card rounded-[3.5rem] overflow-hidden border-none shadow-2xl">
         <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[450px]">
            {/* Tone 1: AI Analysis */}
            <div className="lg:col-span-8 p-14 bg-slate-50 dark:bg-[#050505] space-y-10 border-l border-white/5">
               <div className="flex items-center gap-6">
                  <div className="p-4 bg-saudi-gold/10 rounded-2xl">
                    <Shield className="w-8 h-8 text-saudi-gold" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-saudi-gold uppercase tracking-tighter">الموجز التنفيذي</h2>
                    <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">MetaView Insights</p>
                  </div>
               </div>
               <div className="p-12 bg-white dark:bg-black rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                  <p className="text-2xl font-medium text-slate-800 dark:text-slate-200 leading-relaxed italic">
                    "{strategicData.summary || 'يتم حالياً استخلاص الرؤية من محرك MetaView المركزي...'}"
                  </p>
               </div>
               <div className="flex flex-wrap gap-5">
                  {strategicData.key_takeaways.map((take, i) => (
                    <div key={i} className="flex items-center gap-3 px-6 py-3 bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
                       <Zap className="w-5 h-5 text-saudi-gold" />
                       <span className="text-[13px] font-bold text-slate-700 dark:text-slate-400">{take}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Tone 2: Bias Gauge */}
            <div className="lg:col-span-4 p-14 bg-slate-100 dark:bg-black flex flex-col items-center justify-center text-center">
               <div className="relative mb-10 w-56 h-56">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth="20" fill="transparent" className="text-slate-200 dark:text-zinc-900" />
                    <circle cx="100" cy="100" r={radius} stroke="#C5A059" strokeWidth="20" fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * analytics.averageBias) / 100} strokeLinecap="round" className="transition-all duration-1000 shadow-[0_0_20px_rgba(197,160,89,0.3)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-6xl font-black text-slate-900 dark:text-saudi-gold tracking-tighter">{analytics.averageBias}%</span>
                     <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">BIAS INDEX</span>
                  </div>
               </div>
               <div className="space-y-2">
                 <h4 className="font-black text-slate-900 dark:text-slate-200 text-2xl tracking-tight">كشف التحيز الإعلامي</h4>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] opacity-40">Editorial Divergence Radar</p>
               </div>
            </div>
         </div>
      </section>

      {/* CORE ANALYTICS: ALL BLACK BACKGROUNDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* PILLAR 1: Momentum Chart */}
        <div className="lg:col-span-8 official-card p-14 rounded-[3.5rem] flex flex-col min-h-[550px] dark:bg-black">
           <div className="flex items-center gap-6 mb-16">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                 <Wind className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">مؤشر الزخم الموضوعي</h3>
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Topic Velocity & Signal Intensity</p>
              </div>
           </div>
           <div className="flex-1 w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={analytics.momentumData}>
                    <defs>
                      <linearGradient id="colorMom" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5A059" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(197, 160, 89, 0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: '900'}} />
                    <YAxis hide />
                    <ReTooltip 
                      contentStyle={{backgroundColor: '#000', border: '1px solid #C5A05922', borderRadius: '16px', color: '#fff'}}
                      itemStyle={{color: '#C5A059'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="#C5A059" strokeWidth={5} fillOpacity={1} fill="url(#colorMom)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* PILLAR 2: Sentiment Pulse */}
        <div className="lg:col-span-4 official-card p-14 rounded-[3.5rem] flex flex-col min-h-[550px] dark:bg-black">
           <div className="flex flex-col items-center text-center space-y-4 mb-14">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                 <PieIcon className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">تحليل المشاعر العامة</h3>
              <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Sentiment Pulse</p>
           </div>
           <div className="flex-1 relative flex items-center justify-center min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={analytics.sentimentData}
                       cx="50%" cy="50%"
                       innerRadius={90} outerRadius={130}
                       paddingAngle={10}
                       dataKey="value"
                       stroke="none"
                    >
                       {analytics.sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <ReTooltip />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                 <Activity className="w-8 h-8 text-saudi-gold mb-2" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المزاج العام</span>
                 <span className="text-2xl font-black text-slate-800 dark:text-white uppercase">إيجابي</span>
              </div>
           </div>
           <div className="grid grid-cols-1 gap-3 mt-12">
              {analytics.sentimentData.map(d => (
                <div key={d.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                      <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">{d.name}</span>
                   </div>
                   <span className="text-sm font-black text-slate-900 dark:text-white">{d.value}</span>
                </div>
              ))}
           </div>
        </div>

      </div>

      {/* FOOTER TICKER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-white/95 dark:bg-black backdrop-blur-3xl border-t border-slate-200 dark:border-white/10 flex items-center overflow-hidden">
         <div className="bg-saudi-gold text-black h-full px-12 flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.4em] z-10 shadow-2xl">
            <Radio className="w-5 h-5 animate-pulse" /> MetaView Stream
         </div>
         <div className="flex-1 whitespace-nowrap overflow-hidden relative">
            <div className="flex gap-32 animate-[marquee_240s_linear_infinite] px-16">
               {articles.slice(0, 30).map((art, i) => (
                 <span key={i} className="text-[12px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-6">
                    <span className="text-saudi-gold/60 font-black">REF-{(1000 + i).toString()}</span> {art.headline}
                 </span>
               ))}
            </div>
         </div>
         <style>{`
           @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
         `}</style>
      </div>
    </div>
  );
};

export default Dashboard;
