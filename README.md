
# MetaView Strategic Intelligence Hub

منصة متقدمة لتحليل البيانات الإخبارية باستخدام ذكاء Gemini الاصطناعي.

## متطلبات التشغيل (Local Run)

1. قم بتثبيت التبعيات:
   ```bash
   npm install
   ```

2. قم بإعداد المتغيرات البيئية في ملف `.env`:
   ```env
   API_KEY=your_gemini_api_key
   EXTERNAL_API_URL=https://metaview-api-production.up.railway.app
   PORT=3000
   ```

3. تشغيل الخادم:
   ```bash
   npm run start
   ```

## النشر على Railway (Railway Deploy)

1. اربط المستودع بـ Railway.
2. في إعدادات المتغيرات (Variables)، أضف:
   - `API_KEY`: مفتاح Gemini الخاص بك.
   - `EXTERNAL_API_URL`: الرابط الخاص بالـ API الأساسي.
3. سيتعرف Railway تلقائياً على `package.json` ويقوم بتشغيل `npm start`.

## هيكلة الـ API (Endpoints)

### `GET /health`
التحقق من حالة الخادم.

### `POST /analyze`
خط المعالجة الرئيسي.
- **Input:** `{ "source": "/articles", "params": { "top_k": 10 } }`
- **Output:**
  ```json
  {
    "summary": { "summary": "...", "takeaways": [...] },
    "sentiment": { "label": "positive", "score": 0.9 },
    "bias": { "score": 15, "label": "Minimal", "evidence": [...] },
    "data": [...],
    "meta": { "runtime_ms": 1200 }
  }
  ```
