
import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Shield, Radar as RadarIcon, 
  Activity, Zap, Database, BrainCircuit, Landmark, BarChart3, TrendingUp
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { 
  Tooltip as ReTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, 
  Radar as ReRadar, RadarChart, PolarGrid, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchFullIntelligence = async () => {
    setIsAnalyzing(true);
    setLoading(true);
    try {
      const result = await apiService.getAnalysis({ top_k: 40 });
      if (result) {
        setData(result);
      }
    } catch (err) {
      console.error("Dashboard Intelligence Error:", err);
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullIntelligence();
  }, []);

  const kpis = data?.dashboard?.kpis || { sentimentAvg: 0, biasScore: 0, topTheme: 'N/A', momentum: 0 };
  const timeseries = data?.dashboard?.timeseries || [];
  const topThemes = data?.dashboard?.topThemes || [];
  const biasInfo = data?.bias || { score: 50, label: 'Stable' };
  
  const sentimentDistribution = useMemo(() => [
    { name: 'إيجابي', value: (data?.sentiment?.label === 'positive' ? 70 : 10), color: '#10b981' },
    { name: 'محايد', value: (data?.sentiment?.label === 'neutral' ? 70 : 30), color: '#475569' },
    { name: 'سلبي', value: (data?.sentiment?.label === 'negative' ? 70 : 10), color: '#ef4444' }
  ], [data]);

  if (loading && !data) return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-b-2 border-saudi-gold rounded-full animate-spin"></div>
        <Landmark className="w-10 h-10 text-saudi-gold absolute inset-0 m-auto animate-pulse" />
      </div>
      <p className="text-[11px] font-black text-saudi-gold tracking-[0.4em] uppercase">MetaView AI Initializing Dashboard...</p>
    </div>
  );

  return (
    <div className="max-w-[1536px] mx-auto space-y-12 pb-40 px-6 pt-8 font-['Cairo']">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 border-b border-white/5 pb-12">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-saudi-gold/10 rounded-[1.5rem] flex items-center justify-center border border-saudi-gold/20 shadow-2xl">
             <BrainCircuit className="w-12 h-12 text-saudi-gold" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">رادار الاستخبارات الاستراتيجي</h1>
            <div className="flex items-center gap-5">
               <span className="text-[10px] font-black text-emerald-500 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  AI Processing Enabled
               </span>
               <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                 <Database className="w-4 h-4 opacity-40" /> {data?.articles?.length || 0} سجل تم تحليلها
               </span>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchFullIntelligence} 
          disabled={isAnalyzing}
          className="flex items-center gap-3 px-10 py-5 bg-saudi-gold text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
        >
           <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} /> تحديث الرادار
        </button>
      </div>

      {/* Main KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'متوسط المشاعر', value: `${(kpis.sentimentAvg * 100).toFixed(0)}%`, icon: Activity, color: 'text-emerald-500' },
          { label: 'مؤشر التحيز', value: `${kpis.biasScore}%`, icon: Shield, color: 'text-amber-500' },
          { label: 'الموضوع المهيمن', value: kpis.topTheme, icon: BarChart3, color: 'text-saudi-gold' },
          { label: 'زخم التفاعل', value: `${(kpis.momentum * 100).toFixed(0)}%`, icon: TrendingUp, color: 'text-blue-500' },
        ].map((k, i) => (
          <div key={i} className="official-card p-8 rounded-3xl border border-white/5 bg-black/50">
            <div className="flex items-center justify-between mb-4">
              <k.icon className={`w-6 h-6 ${k.color}`} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{k.label}</span>
            </div>
            <div className="text-3xl font-black text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Strategic Summary Section */}
      <section className="official-card rounded-[3.5rem] overflow-hidden border-none shadow-2xl bg-[#050505]">
         <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
            <div className="lg:col-span-12 p-14 space-y-10">
               <div className="flex items-center gap-6">
                  <div className="p-4 bg-saudi-gold/10 rounded-2xl">
                    <Shield className="w-8 h-8 text-saudi-gold" />
                  </div>
                  <h2 className="text-3xl font-black text-saudi-gold uppercase tracking-tighter">الموجز التنفيذي للذكاء الاصطناعي</h2>
               </div>
               <div className="p-10 bg-black rounded-[2.5rem] border border-white/5">
                  <p className="text-2xl font-medium text-slate-200 leading-relaxed italic">
                    "{data?.dashboard?.summary || 'تعذر استخراج الموجز الاستراتيجي حالياً.'}"
                  </p>
               </div>
               {biasInfo.evidence && (
                  <div className="flex flex-wrap gap-5">
                    {biasInfo.evidence.slice(0, 3).map((ev: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                        <Zap className="w-5 h-5 text-saudi-gold" />
                        <span className="text-[13px] font-bold text-slate-400">{ev}</span>
                      </div>
                    ))}
                  </div>
               )}
            </div>
         </div>
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Trend Analysis */}
        <div className="lg:col-span-8 official-card p-14 rounded-[3.5rem] flex flex-col min-h-[500px] bg-black border border-white/5">
           <div className="flex items-center gap-6 mb-16">
              <TrendingUp className="w-8 h-8 text-saudi-gold" />
              <h3 className="text-lg font-black text-white uppercase tracking-widest">تحليل الاتجاهات الزمنية</h3>
           </div>
           <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={timeseries}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                    <YAxis stroke="#475569" fontSize={10} />
                    <ReTooltip contentStyle={{backgroundColor: '#000', border: '1px solid #C5A05922'}} />
                    <Area type="monotone" dataKey="sentiment" stroke="#C5A059" fillOpacity={1} fill="url(#colorSent)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="lg:col-span-4 official-card p-14 rounded-[3.5rem] flex flex-col min-h-[500px] bg-black border border-white/5">
           <div className="flex flex-col items-center text-center space-y-4 mb-14">
              <Activity className="w-8 h-8 text-emerald-500" />
              <h3 className="text-lg font-black text-white uppercase tracking-widest">خارطة المشاعر العامة</h3>
           </div>
           <div className="flex-1 relative flex items-center justify-center min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={sentimentDistribution}
                       cx="50%" cy="50%"
                       innerRadius={70} outerRadius={100}
                       paddingAngle={10}
                       dataKey="value"
                       stroke="none"
                    >
                       {sentimentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <ReTooltip />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                 <span className="text-xs font-black text-slate-500 uppercase tracking-widest">التوازن</span>
                 <span className="text-2xl font-black text-white">{data?.sentiment?.label || 'محايد'}</span>
              </div>
           </div>
        </div>

        {/* Top Themes Bar Chart */}
        <div className="lg:col-span-12 official-card p-14 rounded-[3.5rem] bg-black border border-white/5">
           <div className="flex items-center gap-6 mb-12">
              <RadarIcon className="w-8 h-8 text-saudi-gold" />
              <h3 className="text-lg font-black text-white uppercase tracking-widest">المواضيع الأكثر تداولاً</h3>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={topThemes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                    <XAxis dataKey="theme" stroke="#475569" fontSize={12} fontWeight="bold" />
                    <YAxis stroke="#475569" fontSize={10} />
                    <ReTooltip contentStyle={{backgroundColor: '#000', border: '1px solid #C5A05922'}} />
                    <Bar dataKey="count" fill="#C5A059" radius={[10, 10, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
