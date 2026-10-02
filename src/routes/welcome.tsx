import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Globe2, Loader2, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { team } from "@/data/team";
import { Portrait } from "@/components/site/Portrait";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getWelcomePreview } from "@/lib/welcome-preview.functions";
import type { WelcomePreview } from "@/lib/welcome-preview.server";

const draftKey = "sahl-welcome-draft";
export type WelcomeDraft = { purpose: string; website: string; industry: string; step?: number };
const industries = ["التجارة الإلكترونية", "المطاعم والمقاهي", "العيادات والرعاية الصحية", "العقارات", "التعليم والتدريب", "التقنية والتطبيقات", "الخدمات المهنية", "السياحة والضيافة", "التجميل والعناية", "المال والمحاسبة", "التسويق والإعلان", "الأزياء والمنتجات", "الجمعيات والمبادرات", "صناعة المحتوى", "أخرى"];
const descriptions: Record<string, { headline: string; tasks: string[] }> = {
  sonny: { headline: "محتوى ينطلق من فكرتك، ولا يُنشر إلا بموافقتك.", tasks: ["خطة محتوى تناسب نشاطك", "منشورات بلهجة جمهورك", "مواد جاهزة لمراجعتك"] },
  eva: { headline: "أمَل ترتب يومك، وتترك القرار لك.", tasks: ["ما يحتاج انتباهك", "ردود واجتماعات جاهزة", "موافقتك قبل أي إرسال"] },
  sam: { headline: "سالم يحوّل فرص البيع إلى خطوات واضحة.", tasks: ["العملاء المناسبون", "رسائل تواصل شخصية", "مراجعتك قبل الإرسال"] },
  nour: { headline: "نور تكتب ما يبحث عنه عملاؤك فعلًا.", tasks: ["أسئلة جمهورك", "موضوعات ومقالات عربية", "مسودات للمراجعة"] },
  dana: { headline: "دانة تحوّل الفكرة إلى تصميم جاهز.", tasks: ["اتجاه بصري مميز", "مقاسات منصات مختلفة", "اللمسة الأخيرة لك"] },
  adam: { headline: "آدم يجعل الأرقام قرارًا تفهمه.", tasks: ["مؤشرات الأداء المتاحة", "ما تغيّر وما يستحق الانتباه", "خطوتك التالية"] },
};
const lastStep = 10;

export const Route = createFileRoute("/welcome")({
  ssr: false,
  validateSearch: z.object({ plan: z.enum(["start", "growth"]).optional() }),
  head: () => ({ meta: [
    { title: "تعرّف على فريقك قبل التسجيل | سهل" },
    { name: "description", content: "اكتشف فريق سهل وحلّل موقعك واختَر نشاطك قبل إنشاء حسابك." },
    { property: "og:title", content: "تعرّف على فريقك الرقمي — سهل" },
    { property: "og:description", content: "جولة تفاعلية للتعرف على فريق سهل واكتشاف نشاطك من موقعك قبل التسجيل." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Welcome,
});

function Welcome() {
  const { plan } = Route.useSearch();
  const inspect = useServerFn(getWelcomePreview);
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [query, setQuery] = useState("");
  const [example, setExample] = useState(false);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState<WelcomePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved) as Partial<WelcomeDraft>;
        setPurpose(typeof draft.purpose === "string" ? draft.purpose : "");
        setWebsite(typeof draft.website === "string" ? draft.website : "");
        setIndustry(typeof draft.industry === "string" ? draft.industry : "");
        if (typeof draft.step === "number" && Number.isInteger(draft.step) && draft.step >= 0 && draft.step <= lastStep) setStep(draft.step);
      }
    } catch { /* Storage is optional. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify({ purpose, website, industry, step } satisfies WelcomeDraft)); } catch { /* Storage is optional. */ }
  }, [ready, purpose, website, industry, step]);
  useEffect(() => { setExample(false); }, [step]);
  const next = () => setStep((current) => Math.min(current + 1, lastStep));
  const back = () => setStep((current) => Math.max(current - 1, 0));
  const member = step >= 2 && step <= 7 ? team[step - 2] : undefined;
  const description = member ? descriptions[member.id] : undefined;
  const filtered = industries.filter((item) => item.includes(query.trim()));
  const canContinue = step !== 0 || Boolean(purpose);
  const showPreview = preview && preview.url === website.trim();

  async function scan() {
    if (!website.trim() || loading) return;
    setError(""); setLoading(true); setPreview(null);
    try {
      const result = await inspect({ data: { url: website.trim() } });
      setPreview(result);
      setWebsite(result.url);
      if (result.industry && !industry) setIndustry(result.industry);
    } catch (e) { setError(e instanceof Error ? e.message : "تعذّر فحص الموقع الآن. يمكنك المتابعة دون فحص."); }
    finally { setLoading(false); }
  }

  return <div className="welcome-stage" dir="rtl">
    <header className="welcome-header">
      <Link to="/" className="font-display text-xl font-black" aria-label="سهل — الرئيسية">سهل<span className="text-primary">.</span></Link>
      <span className="welcome-header-note">مساحة تبدأ منك</span>
      <Link to="/auth" search={{ mode: "signin" }} className="text-xs font-bold text-foreground underline decoration-primary/50 underline-offset-4">لديك حساب؟ ادخل</Link>
    </header>
    <main className="welcome-main">
      <div className="welcome-progress"><div className="flex justify-between text-xs font-bold text-muted-foreground"><span>{step < 2 ? "اكتشف نشاطك" : step < 8 ? "تعرّف على فريقك" : "لنبدأ معًا"}</span><span dir="ltr">{String(step + 1).padStart(2, "0")} / 11</span></div><div className="welcome-progress-track" role="progressbar" aria-label="تقدم الجولة" aria-valuemin={0} aria-valuemax={11} aria-valuenow={step + 1}><span style={{ width: `${((step + 1) / 11) * 100}%` }} /></div></div>
      <div key={step} className="welcome-appear welcome-content">
        {step === 0 && <section className="welcome-centered">
          <span className="welcome-eyebrow"><Sparkles className="size-4" /> البداية</span>
          <h1 className="welcome-title">فريقك يبدأ من قصتك.</h1>
          <p className="welcome-lead">كيف تريد أن يساعدك سهل؟</p>
          <div className="welcome-choices">{[["business", "لإدارة مشروعي", "تسويق ومبيعات وتنظيم في مكان واحد"], ["job", "لعملي اليومي", "فريق يساعدك في المهام ويوفر وقتك"], ["personal", "لاستكشاف الإمكانيات", "تعرّف على الفريق ثم قرر"]].map(([value, label, hint]) => <Button key={value} type="button" variant="outline" aria-pressed={purpose === value} onClick={() => setPurpose(value ?? "")} className={cn("welcome-choice", purpose === value && "welcome-choice-active")}><span className="min-w-0 flex-1 text-start"><strong className="block text-sm sm:text-base">{label}</strong><span className="block whitespace-normal text-xs font-normal text-muted-foreground">{hint}</span></span><span className="welcome-radio">{purpose === value && <Check className="size-3" />}</span></Button>)}</div>
        </section>}
        {step === 1 && <section className="welcome-centered welcome-website">
          <span className="welcome-eyebrow"><Globe2 className="size-4" /> اعرف نشاطك</span>
          <h1 className="welcome-title">موقعك يحكي لنا الكثير.</h1>
          <p className="welcome-lead">أدخل الرابط لنقرأ ما هو منشور للعامة: نشاطك، خدماتك، منصتك، وطرق التواصل.</p>
          <form className="welcome-url-form" onSubmit={(e) => { e.preventDefault(); void scan(); }}><label className="sr-only" htmlFor="welcome-url">رابط موقعك</label><input id="welcome-url" className="welcome-input" dir="ltr" type="text" inputMode="url" value={website} onChange={(e) => { setWebsite(e.target.value); setError(""); setPreview(null); }} placeholder="yourbusiness.com" autoComplete="url" /><Button type="submit" disabled={!website.trim() || loading} className="welcome-scan-btn">{loading ? <Loader2 className="animate-spin" /> : <Search />}<span>{loading ? "نفحص…" : "اكتشف"}</span></Button></form>
          {loading && <p className="welcome-status" role="status">نقرأ الصفحات العامة لموقعك…</p>}
          {error && <p className="welcome-error" role="alert">{error}</p>}
          {showPreview && <div className="welcome-findings" aria-label="نتائج فحص الموقع"><div className="welcome-findings-head"><span className="welcome-findings-icon"><Globe2 className="size-5" /></span><div><strong>{preview.name}</strong><span dir="ltr">{new URL(preview.url).hostname}</span></div><Check className="ms-auto size-5 text-jade" /></div><p className="welcome-findings-summary">{preview.summary || "لم ينشر الموقع وصفًا واضحًا؛ سنكمل فهم نشاطك معك بعد التسجيل."}</p><div className="welcome-facts">{preview.platform && <span>المنصة · {preview.platform}</span>}{preview.language && <span>اللغة · {preview.language}</span>}<span>صفحات مقروءة · {preview.pagesRead.length}</span>{preview.socials.length > 0 && <span>حسابات · {preview.socials.join("، ")}</span>}{preview.products.length > 0 && <span>منتجات · {preview.products.join("، ")}</span>}{preview.locations.length > 0 && <span>أماكن · {preview.locations.join("، ")}</span>}{preview.contacts.length > 0 && <span>تواصل · {preview.contacts.join("، ")}</span>}{preview.headings.length > 0 && <span>موضوعات · {preview.headings.slice(0, 3).join("، ")}</span>}</div></div>}
          <p className="welcome-disclaimer">هذه قراءة أولية لما يظهر علنًا، وقد تغيب معلومات عن صفحات محمية أو غير متاحة. الفحص الأعمق بعد التسجيل.</p>
          <Button type="button" variant="ghost" className="welcome-skip" onClick={() => { setWebsite(""); setPreview(null); next(); }}>ليس لدي موقع الآن <ChevronLeft /></Button>
        </section>}
        {member && description && <section className="welcome-person"><div className="welcome-person-copy"><span className="welcome-eyebrow">فريقك · {step - 1} / ٦</span><p className="welcome-role">{member.role}</p><h1 className="welcome-title">{member.name}، إلى جانبك.</h1><p className="welcome-person-lead">{description.headline}</p><ul className="welcome-tasks">{description.tasks.map((task) => <li key={task}><Check className="size-4 text-jade" />{task}</li>)}</ul><Button type="button" variant="outline" className="welcome-example-toggle" onClick={() => setExample(!example)} aria-expanded={example}>{example ? "إخفاء المثال" : "شاهد مثالًا"} {example ? <X /> : <ArrowLeft />}</Button>{example && <div className="welcome-sample" role="region" aria-label={`مثال من ${member.name}`}><span className="text-xs font-bold text-primary">مثال توضيحي · {member.sample[0]?.label}</span><p>{member.sample[0]?.body}</p><small>مثال غير مخصص لنشاطك.</small></div>}</div><div className="welcome-portrait"><Portrait memberId={member.id} name={member.name} eager className="h-full w-full" /><span className="welcome-portrait-label">{member.name} <span>· {member.role}</span></span></div></section>}
        {step === 8 && <section className="welcome-centered"><span className="welcome-eyebrow"><Search className="size-4" /> مجالك</span><h1 className="welcome-title">في أي مجال تعمل؟</h1><p className="welcome-lead">اختر الأقرب إليك؛ يمكنك تعديله لاحقًا.</p><label className="welcome-industry-search"><span className="sr-only">ابحث عن المجال</span><Search className="size-4" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن مجالك…" /></label><div className="welcome-industries">{filtered.map((item) => <Button key={item} type="button" variant="outline" aria-pressed={industry === item} onClick={() => setIndustry(item)} className={cn("welcome-industry", industry === item && "welcome-industry-active")}>{item}{industry === item && <Check className="size-4 shrink-0" />}</Button>)}</div><label className="welcome-custom-label">أو اكتب مجالك بنفسك<input className="welcome-input" value={industries.includes(industry) ? "" : industry} onChange={(e) => setIndustry(e.target.value)} placeholder="مثال: استشارات هندسية" /></label></section>}
        {step === 9 && <section className="welcome-centered"><span className="welcome-eyebrow"><Sparkles className="size-4" /> نقطة انطلاقك</span><h1 className="welcome-title">خطوة أقرب إلى {industry || "هدفك"}.</h1><p className="welcome-lead">{showPreview ? `من صفحات ${preview.name}، وجدنا إشارات تساعد فريقك على البدء. ستراجع التفاصيل وتكملها بعد التسجيل.` : "اخترنا لك بداية مرنة. بعد التسجيل يمكن لفريقك فهم نشاطك بالتفصيل."}</p><div className="welcome-checklist">{[showPreview ? `قراءة ${preview.pagesRead.length} صفحات من موقعك` : "تحديد مجال عملك", "اختيار ما تريد إنجازه", "مراجعتك قبل أي نشر أو إرسال"].map((item, i) => <div key={item}><span>{String(i + 1).padStart(2, "0")}</span><strong>{item}</strong><Check className="size-4 text-jade" /></div>)}</div><p className="welcome-disclaimer">لا نزعم مقارنة بالسوق أو تحليل بيانات خاصة دون ربطها.</p></section>}
        {step === 10 && <section className="welcome-centered"><span className="welcome-eyebrow"><Check className="size-4" /> البداية الحقيقية</span><h1 className="welcome-title">فريقك ينتظرك.</h1><p className="welcome-lead">ستة متخصصين يعملون معك، وأنت صاحب القرار دائمًا.</p><div className="welcome-team">{team.map((person) => <div key={person.id}><Portrait memberId={person.id} name={person.name} className="size-9 rounded-full" /><span>{person.name}</span></div>)}</div><Button asChild className="welcome-signup"><Link to="/auth" search={{ mode: "signup", plan }}>أنشئ حسابك وقابل فريقك <ArrowLeft /></Link></Button><p className="welcome-trust"><ShieldCheck className="size-4" /> لن يُنشر أو يُرسل شيء دون موافقتك</p></section>}
      </div>
      <footer className="welcome-footer"><Button type="button" variant="ghost" disabled={step === 0} onClick={back} className="welcome-back"><ArrowRight /> السابق</Button><span className="welcome-footer-dots" aria-hidden="true">{Array.from({ length: 11 }, (_, i) => <span key={i} className={i === step ? "is-active" : ""} />)}</span>{step < lastStep ? <Button type="button" disabled={!canContinue || loading} onClick={next} className="welcome-next">متابعة <ArrowLeft /></Button> : <span className="welcome-footer-spacer" />}</footer>
    </main>
  </div>;
}
