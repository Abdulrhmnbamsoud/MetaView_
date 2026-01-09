
# MetaView Strategic Intelligence Hub (Production Ready)

منصة استخبارات بيانات استراتيجية مدعومة بـ Gemini، جاهزة للنشر الفوري على Railway.

## الميزات الجديدة
1. **Unified Analytics Engine:** نقطة نهاية `/analyze` واحدة تجلب البيانات، تحلل المشاعر، تقيس التحيز، وتولد بيانات الرسوم البيانية.
2. **Smart Event Aggregation:** نظام تجميع الأحداث الذكي الذي يجمع الأخبار المرتبطة في كتل موضوعية مع قياس "الزخم" (Momentum Score).
3. **Auto-Translation:** كافة مخرجات الذكاء الاصطناعي معربة بالكامل (Modern Standard Arabic).
4. **Resilient UI:** لوحة تحكم مدعومة بـ Recharts مع معالجة ذكية لحالات نقص البيانات.

## المتطلبات (Environment Variables)
- `API_KEY`: مفتاح Google Gemini الخاص بك.
- `EXTERNAL_API_URL`: الرابط الأساسي لجلب البيانات (افتراضي: MetaView production API).
- `PORT`: المنفذ (يتم تعيينه تلقائياً بواسطة Railway).

## نقاط النهاية (API Endpoints)

### `POST /api/analyze`
المحرك الرئيسي للوحة التحكم.
- **Input:** `{ "lang": "ar", "params": { "top_k": 30 } }`
- **Output:** كائن يحتوي على `dashboard`, `sentiment`, `bias`, و `articles`.

### `POST /api/cluster`
محرك تجميع الأحداث.
- **Input:** `{ "articles": [...], "lang": "ar" }`
- **Output:** قائمة بمجموعات الأحداث الذكية.

## النشر على Railway
1. اربط المستودع بـ Railway.
2. أضف `API_KEY`.
3. سيقوم النظام تلقائياً بـ `npm run build` ثم `npm start`.
