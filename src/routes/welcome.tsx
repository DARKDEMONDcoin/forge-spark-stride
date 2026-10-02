import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Globe2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { team } from "@/data/team";
import { Portrait } from "@/components/site/Portrait";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const draftKey = "sahl-welcome-draft";
export type WelcomeDraft = { purpose: string; website: string; industry: string };
const industries = ["التجارة الإلكترونية", "المطاعم والمقاهي", "العيادات والرعاية الصحية", "العقارات", "التعليم والتدريب", "التقنية والتطبيقات", "الخدمات المهنية", "السياحة والضيافة", "التجميل والعناية", "المال والمحاسبة", "التسويق والإعلان", "الأزياء والمنتجات", "الجمعيات والمبادرات", "صناعة المحتوى", "أخرى"];
const employeeDescriptions: Record<string, { headline: string; tasks: string[] }> = {
  sonny: { headline: "محتوى ينطلق من فكرتك، ولا يُنشر إلا بموافقتك.", tasks: ["يضع خطة محتوى تناسب نشاطك", "يكتب المنشورات بلهجة جمهورك", "يجهز المواد لتراجعها قبل النشر"] },
  eva: { headline: "أمَل ترتب يومك، وتترك القرار لك.", tasks: ["تلخص ما يحتاج انتباهك", "تجهز الردود والاجتماعات", "تطلب موافقتك قبل أي إرسال"] },
  sam: { headline: "سالم يحوّل فرص البيع إلى خطوات واضحة.", tasks: ["يبحث عن العملاء المناسبين", "يكتب رسائل تواصل شخصية", "يعرضها عليك قبل إرسالها"] },
  nour: { headline: "نور تكتب ما يبحث عنه عملاؤك فعلًا.", tasks: ["تكتشف أسئلة جمهورك", "تقترح موضوعات ومقالات عربية", "تسلمك مسودة للمراجعة"] },
  dana: { headline: "دانة تحوّل الفكرة إلى تصميم جاهز.", tasks: ["تقترح اتجاهًا بصريًا", "تجهز نسخًا لمقاسات المنصات", "تترك اللمسة الأخيرة لك"] },
  adam: { headline: "آدم يجعل الأرقام قرارًا تفهمه.", tasks: ["يجمع مؤشرات الأداء المتاحة", "يلخص ما تغيّر وما يستحق الانتباه", "يقترح خطوتك التالية"] },
};
const lastStep = 10;

export const Route = createFileRoute("/welcome")({
  ssr: false,
  validateSearch: z.object({ plan: z.enum(["start", "growth"]).optional() }),
  head: () => ({ meta: [
    { title: "تعرّف على فريقك قبل التسجيل | سهل" },
    { name: "description", content: "اكتشف كيف يساعدك فريق سهل بالعربية، واختر نشاطك قبل إنشاء حسابك." },
    { property: "og:title", content: "تعرّف على فريقك الرقمي — سهل" },
    { property: "og:description", content: "جولة تفاعلية قصيرة للتعرف على الموظفين الرقميين واختيار نشاطك قبل التسجيل." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Welcome,
});

function Welcome() {
  const { plan } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [query, setQuery] = useState("");
  const [example, setExample] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved) as Partial<WelcomeDraft>;
        setPurpose(typeof draft.purpose === "string" ? draft.purpose : "");
        setWebsite(typeof draft.website === "string" ? draft.website : "");
        setIndustry(typeof draft.industry === "string" ? draft.industry : "");
      }
    } catch { /* Browsers can disable storage; the tour still works. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify({ purpose, website, industry } satisfies WelcomeDraft)); } catch { /* optional */ }
  }, [ready, purpose, website, industry]);
  useEffect(() => { setExample(false); }, [step]);

  const next = () => { setStep((current) => Math.min(current + 1, lastStep)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const back = () => { setStep((current) => Math.max(current - 1, 0)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const member = step >= 2 && step <= 7 ? team[step - 2] : undefined;
  const description = member ? employeeDescriptions[member.id] : undefined;
  const filtered = industries.filter((item) => item.includes(query.trim()));
  const canContinue = step !== 0 || !!purpose;

  return <div className="welcome-stage min-h-dvh bg-background text-foreground" dir="rtl">
    <header className="welcome-header mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Link to="/" className="font-display text-2xl font-black" aria-label="سهل — الرئيسية">سهل<span className="text-primary">.</span></Link>
      <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">رحلتك مع فريقك تبدأ هنا</span>
      <Link to="/auth" search={{ mode: "signin" }} className="text-sm font-bold text-foreground underline decoration-primary/50 underline-offset-4">لديك حساب؟ ادخل</Link>
    </header>
    <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-6 sm:px-8 sm:pt-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-4 text-xs font-bold text-muted-foreground"><span>تعرّف على سهل</span><span dir="ltr">{step + 1} / {lastStep + 1}</span></div>
        <div className="flex gap-1.5" role="progressbar" aria-label="تقدم الجولة" aria-valuemin={0} aria-valuemax={lastStep + 1} aria-valuenow={step + 1}>
          {Array.from({ length: lastStep + 1 }, (_, index) => <span key={index} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", index <= step ? "bg-primary" : "bg-border")} />)}
        </div>
      </div>
      <div key={step} className="welcome-appear mx-auto mt-12 max-w-3xl sm:mt-16">
        {step === 0 && <section className="text-center">
          <span className="welcome-eyebrow"><Sparkles className="size-4" /> البداية</span>
          <h1 className="welcome-title">كيف ستستخدم فريق سهل؟</h1>
          <p className="welcome-lead">اختر ما يناسبك، وسنعرفك على الفريق قبل أن تنشئ حسابًا.</p>
          <div className="mx-auto mt-10 grid max-w-xl gap-3">
            {[["business", "لإدارة مشروعي", "محتوى، مبيعات، تنظيم، وتصميم في مكان واحد"], ["job", "لعملي اليومي", "فريق يساعدك في المهام ويوفر وقتك"], ["personal", "لاستكشاف ما يمكنني فعله", "ابدأ بجولة، ثم قرر ما يناسبك"]].map(([value, label, hint]) => <Button key={value} type="button" variant="outline" aria-pressed={purpose === value} onClick={() => setPurpose(value)} className={cn("welcome-choice", purpose === value && "welcome-choice-active")}><span className="min-w-0 flex-1 text-start"><strong className="block text-base">{label}</strong><span className="mt-1 block whitespace-normal text-xs font-normal text-muted-foreground">{hint}</span></span><span className="welcome-radio">{purpose === value && <Check className="size-3" />}</span></Button>)}
          </div>
        </section>}
        {step === 1 && <section className="text-center">
          <span className="welcome-eyebrow"><Globe2 className="size-4" /> نشاطك</span>
          <h1 className="welcome-title">هل لديك موقع إلكتروني؟</h1>
          <p className="welcome-lead">أضفه الآن إن أحببت؛ لن نفحصه أو نحفظه في حسابك حتى تكمل إعداد نشاطك بعد التسجيل.</p>
          <label className="mx-auto mt-10 block max-w-xl text-start"><span className="mb-2 block text-sm font-bold">رابط الموقع (اختياري)</span><input className="welcome-input" dir="ltr" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" autoComplete="url" /></label>
          <Button type="button" variant="ghost" className="mt-4 text-muted-foreground" onClick={() => { setWebsite(""); next(); }}>ليس لدي موقع الآن <ChevronLeft /></Button>
        </section>}
        {member && description && <section className="welcome-person grid items-center gap-9 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-14">
          <div className="min-w-0">
            <span className="welcome-eyebrow">تعرّف على فريقك · {step - 1} من ٦</span>
            <p className="mt-6 text-sm font-bold text-primary">{member.role}</p>
            <h1 className="welcome-title !mt-2">{member.name}، معك في كل خطوة.</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">{description.headline}</p>
            <ul className="mt-8 grid gap-3">{description.tasks.map((task) => <li key={task} className="flex items-start gap-3 border-b border-border pb-3 text-sm font-semibold"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><Check className="size-3" /></span>{task}</li>)}</ul>
            <Button type="button" variant="outline" className="mt-7 h-auto min-h-10 whitespace-normal border-primary/30 px-5 py-2 text-primary" onClick={() => setExample(!example)} aria-expanded={example}>{example ? "إخفاء المثال" : "شاهد مثالًا على عمله"} <ArrowLeft /></Button>
            {example && <div className="welcome-sample mt-4" role="region" aria-label={`مثال من ${member.name}`}><span className="text-xs font-bold text-primary">مثال توضيحي · {member.sample[0]?.label}</span><p className="mt-3 text-sm leading-7">{member.sample[0]?.body}</p><span className="mt-4 block text-xs text-muted-foreground">هذا مثال فقط، وليس نتيجة مخصصة لنشاطك.</span></div>}
          </div>
          <div className="welcome-portrait"><Portrait memberId={member.id} name={member.name} eager className="h-full w-full" /><span className="welcome-portrait-label">{member.name} <span>· {member.role}</span></span></div>
        </section>}
        {step === 8 && <section className="text-center">
          <span className="welcome-eyebrow"><Search className="size-4" /> مجال عملك</span>
          <h1 className="welcome-title">ما مجال نشاطك؟</h1>
          <p className="welcome-lead">اختر المجال الأقرب إليك. يمكنك تغييره وإضافة التفاصيل بعد التسجيل.</p>
          <label className="mx-auto mt-8 block max-w-xl"><span className="sr-only">ابحث عن المجال</span><input className="welcome-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن مجالك…" /></label>
          <div className="mt-6 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto p-1 sm:grid-cols-3">{filtered.map((item) => <Button key={item} type="button" variant="outline" aria-pressed={industry === item} onClick={() => setIndustry(item)} className={cn("welcome-industry", industry === item && "welcome-industry-active")}>{item}{industry === item && <Check className="size-4 shrink-0" />}</Button>)}</div>
          {!filtered.length && <p className="mt-6 text-sm text-muted-foreground">لم تجد مجالك؟ اكتبه بنفسك بالأسفل.</p>}
          <label className="mt-6 block text-start text-sm font-bold">أو اكتب مجالك بنفسك<input className="welcome-input mt-2" value={industries.includes(industry) ? "" : industry} onChange={(e) => setIndustry(e.target.value)} placeholder="مثال: استشارات هندسية" /></label>
        </section>}
        {step === 9 && <section className="text-center">
          <span className="welcome-eyebrow"><Sparkles className="size-4" /> الصورة العامة</span>
          <h1 className="welcome-title">لنبدأ بما يناسب {industry || "مجالك"}.</h1>
          <p className="welcome-lead">هذه نقطة انطلاق، وليست مقارنة فعلية بالسوق. بعد التسجيل يمكنك إضافة موقعك وبياناتك ليعمل الفريق على سياقك الحقيقي.</p>
          <div className="mx-auto mt-10 grid max-w-xl gap-0 text-start">{["تحديد مجال عملك وما يهم جمهورك", "اختيار المخرجات التي تحتاجها", "مراجعة كل مادة قبل نشرها أو إرسالها"].map((item, i) => <div key={item} className="flex items-center gap-4 border-b border-border py-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-foreground">{i + 1}</span><span className="font-semibold">{item}</span></div>)}</div>
        </section>}
        {step === 10 && <section className="text-center">
          <span className="welcome-eyebrow"><Check className="size-4" /> جاهز للانطلاق</span>
          <h1 className="welcome-title">فريقك جاهز للتعرّف عليك.</h1>
          <p className="welcome-lead">قابل سِراج وأمَل وسالم ونور ودانة وآدم، ثم أخبرهم بما تحتاجه. أنت صاحب القرار دائمًا.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-2">{team.map((person) => <div key={person.id} className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 ps-1.5 pe-4 text-sm font-bold"><Portrait memberId={person.id} name={person.name} className="size-8 rounded-full" />{person.name}</div>)}</div>
          <div className="mx-auto mt-10 max-w-sm"><Button asChild className="h-13 w-full rounded-md text-base font-bold"><Link to="/auth" search={{ mode: "signup", plan }}>أنشئ حسابك وقابل فريقك <ArrowLeft /></Link></Button><p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" /> لن يُنشر أو يُرسل شيء دون موافقتك</p></div>
        </section>}
      </div>
      {step < lastStep && <div className="mx-auto mt-10 flex max-w-3xl items-center justify-between gap-4 border-t border-border pt-6"><Button type="button" variant="ghost" disabled={step === 0} onClick={back} className="font-semibold"><ArrowRight /> السابق</Button><Button type="button" disabled={!canContinue} onClick={next} className="h-11 min-w-32 font-bold">متابعة <ArrowLeft /></Button></div>}
      {step === lastStep && <div className="mx-auto mt-8 flex max-w-3xl justify-start"><Button type="button" variant="ghost" onClick={back}><ArrowRight /> السابق</Button></div>}
      {step < lastStep && <p className="mt-8 text-center text-xs text-muted-foreground">جولة مجانية · لا تحتاج إلى حساب للمتابعة</p>}
    </main>
  </div>;
}
