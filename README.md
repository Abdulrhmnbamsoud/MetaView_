
# MetaView Strategic Intelligence Hub (Production)

منصة استخبارات بيانات استراتيجية مدعومة بـ Gemini، جاهزة للنشر الفوري.

## المميزات
- **Frontend:** React 18 + Vite + Tailwind.
- **Backend:** Express + Node.js (TypeScript).
- **AI:** خط معالجة متكامل (Sentiment, Bias, Summarization, Clustering).
- **Deployment:** جاهز للنشر على Railway بضغطة واحدة.

## التشغيل المحلي (Local Development)

1. تثبيت المكتبات:
   ```bash
   npm install
   ```

2. إعداد المتغيرات (`.env`):
   ```env
   API_KEY=your_gemini_key
   EXTERNAL_API_URL=https://metaview-api-production.up.railway.app
   PORT=3000
   ```

3. تشغيل بيئة التطوير (في نافذتين):
   - واجهة المستخدم: `npm run dev:frontend`
   - الخادم: `npm run dev:backend`

## النشر على Railway

1. اربط المستودع بـ Railway.
2. أضف المتغيرات `API_KEY` و `EXTERNAL_API_URL`.
3. سيقوم Railway بتشغيل `npm run build` ثم `npm start` تلقائياً.

## هيكلية الملفات المحدثة
- `dist/`: يحتوي على ملفات الواجهة الأمامية المبنية (Static Assets).
- `server.ts`: الخادم الموحد الذي يقدم الـ API والملفات الساكنة.
- `vite.config.ts`: نظام البناء الحديث.
