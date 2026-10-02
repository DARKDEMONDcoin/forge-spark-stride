import type { RecommendationInput, WelcomeRecommendation } from "./welcome-recommendation.server";

/** Useful next actions while the personalized suggestion is unavailable. */
export function fallbackRecommendation(input: RecommendationInput): WelcomeRecommendation {
  const subject = input.site?.products[0] || input.industry;
  const action = input.site?.actions[0];
  return {
    insight: input.site
      ? `وجدنا في الموقع ${subject}؛ الخطوة الأولى هي التأكد مما يطلبه العميل قبل اقتراح محتوى أو رسالة بيع. هذه فرضية أولية، وليست نتيجة عن أداء نشاطك.`
      : `لن نحدد فرص نمو ${input.industry} من الاسم وحده. البداية الصحيحة هي تحديد ما تقدمه، ولمن، وما الذي تريد تحسينه أولاً.`,
    actions: [
      { employee: "سِراج", text: `يجهّز مسودة منشور تشرح قيمة ${subject} لجمهور واحد تحدده، قبل التفكير في النشر.` },
      { employee: "نور", text: `يجمع أسئلة الباحثين عن ${subject} ويحوّل سؤالاً واضحاً إلى مسودة صفحة أو مقال.` },
      { employee: "سالم", text: action ? `يفحص مسار «${action}» ويقترح تحسين خطوة التواصل دون إرسال شيء.` : `يصوغ سؤالاً يكشف احتياج العميل قبل اقتراح رسالة تواصل مناسبة.` },
    ],
    firstMove: `بعد التسجيل: أخبر الفريق من عميل ${input.industry} وما أول نتيجة تريدها؛ ثم راجع المسودات قبل أي نشر أو إرسال.`,
  };
}