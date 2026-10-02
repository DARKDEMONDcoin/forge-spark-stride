/** Bounded public-site evidence for the introduction. No model calls or account writes. */
import { parseHTML } from "linkedom";

export type WelcomePreview = {
  url: string;
  name: string;
  summary: string;
  industry: string;
  products: string[];
  headings: string[];
  socials: string[];
  contacts: string[];
  locations: string[];
  platform: string;
  language: string;
  pagesRead: string[];
  offers: string[];
  actions: string[];
  policies: string[];
  signals: string[];
  tone: string;
};

const socialHosts = ["instagram.com", "facebook.com", "tiktok.com", "linkedin.com", "youtube.com", "x.com", "twitter.com", "snapchat.com", "pinterest.com", "wa.me", "t.me"];
const publicHost = (host: string) => {
  const h = host.toLowerCase().replace(/\.$/, "");
  return h.includes(".") && h.length <= 253 && !h.includes("..") && /^[a-z0-9.-]+$/.test(h) && !/^(?:\d+\.)+\d+$/.test(h) && !/^(?:0x[0-9a-f]+|\d+)$/i.test(h) && !["localhost", "local", "internal", "test", "invalid", "example", "onion", "arpa", "lan", "home", "corp", "metadata", "cloud", "localdomain"].some((suffix) => h === suffix || h.endsWith(`.${suffix}`)) && h !== "metadata.google.internal";
};
export function publicWebsiteUrl(raw: string): URL | null {
  try {
    const input = raw.trim();
    if (!input || input.length > 300 || /[\u0000-\u001f\u007f]/.test(input)) return null;
    const u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (u.protocol !== "https:" || u.username || u.password || u.port || !publicHost(u.hostname)) return null;
    u.hash = "";
    return u;
  } catch { return null; }
}

async function readPage(url: URL, root: string) {
  let current = url;
  for (let hop = 0; hop < 3; hop++) {
    const res = await fetch(current.toString(), {
      headers: { Accept: "text/html", "User-Agent": "SahlPreview/1.0" },
      redirect: "manual", signal: AbortSignal.timeout(6500),
    });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) throw new Error("تعذر قراءة الموقع.");
      const next = publicWebsiteUrl(new URL(location, current).toString());
      if (!next || next.hostname.replace(/^www\./, "") !== root) throw new Error("الموقع نقلنا إلى رابط آخر؛ أدخل الرابط النهائي.");
      current = next;
      continue;
    }
    if (!res.ok || !(res.headers.get("content-type") ?? "").toLowerCase().includes("text/html")) throw new Error("لم نتمكن من قراءة صفحات هذا الموقع.");
    if (Number(res.headers.get("content-length")) > 350_000) throw new Error("صفحة الموقع كبيرة جدًا للفحص السريع.");
    const reader = res.body?.getReader();
    if (!reader) throw new Error("لم نتمكن من قراءة هذا الموقع.");
    let bytes = 0;
    const decoder = new TextDecoder();
    let html = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 350_000) { await reader.cancel(); throw new Error("صفحة الموقع كبيرة جدًا للفحص السريع."); }
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();
    } finally { reader.releaseLock(); }
    return { html, url: current.toString() };
  }
  throw new Error("تعذر الوصول للموقع بعد إعادة التوجيه.");
}

const clean = (value: string | null | undefined, max = 180) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const unique = (values: string[], max: number) => [...new Set(values.filter(Boolean))].slice(0, max);
const types = (value: unknown) => Array.isArray(value) ? value.join(" ") : String(value ?? "");

export async function previewWebsite(raw: string): Promise<WelcomePreview> {
  const url = publicWebsiteUrl(raw);
  if (!url) throw new Error("أدخل رابط موقع عام صالح، مثل example.com");
  const root = url.hostname.replace(/^www\./, "");
  const first = await readPage(url, root);
  const { document } = parseHTML(first.html);
  const meta = (selector: string) => clean(document.querySelector(selector)?.getAttribute("content"));
  const name = meta('meta[property="og:site_name"]') || clean(document.querySelector("title")?.textContent?.split(/[|–—]/)[0], 90) || url.hostname;
  const summary = meta('meta[name="description"]') || meta('meta[property="og:description"]');
  const industry = meta('meta[property="product:category"]') || "";
  const headings: string[] = [];
  const products: string[] = [];
  const socials: string[] = [];
  const contacts: string[] = [];
  const locations: string[] = [];
  const offers: string[] = [];
  const actions: string[] = [];
  const policies: string[] = [];
  const signals: string[] = [];
  const samples: string[] = [];
  const links: { url: URL; score: number }[] = [];
  const visited = new Set<string>();

  function collect(html: string, pageUrl: string) {
    const doc = parseHTML(html).document;
    const anchors = Array.from(doc.querySelectorAll("a[href]"));
    doc.querySelectorAll("script,style,nav,footer,header,noscript").forEach((el) => el.remove());
    const content = doc.querySelector("main") ?? doc.querySelector("article") ?? doc.body;
    const text = clean(content?.textContent, 1500);
    if (text) samples.push(text);
    headings.push(...Array.from(content?.querySelectorAll("h1,h2,h3") ?? []).map((el) => clean(el.textContent, 90)));
    for (const el of Array.from(content?.querySelectorAll("a,button") ?? [])) {
      const label = clean(el.textContent, 65);
      if (label.length >= 3 && label.length <= 55 && /^(احجز|اشتر|اطلب|تواصل|ابدأ|اشترك|جرّب|احصل|تسوق|تسوّق|book|buy|shop|contact|subscribe|get started|start|request|try)/i.test(label)) actions.push(label);
    }
    for (const a of anchors) {
      const href = a.getAttribute("href") ?? "";
      if (/^(mailto:|tel:)/i.test(href)) { contacts.push(clean(href.replace(/^(mailto:|tel:)/i, "").split("?")[0], 70)); continue; }
      try {
        const target = new URL(href, pageUrl);
        if (socialHosts.some((host) => target.hostname === host || target.hostname.endsWith(`.${host}`))) {
          socials.push(clean(`${target.hostname.replace(/^www\./, "")}${target.pathname.replace(/\/$/, "")}`, 90));
        }
        if (target.protocol !== "https:" || target.hostname.replace(/^www\./, "") !== root) continue;
        target.search = ""; target.hash = "";
        const path = decodeURIComponent(target.pathname);
        if (/\.(pdf|png|jpe?g|webp|zip|svg|mp4|xml|json)$/i.test(path) || /\/(?:cart|checkout|login|signin|account|admin|wp-admin|api)(?:\/|$)/i.test(path)) continue;
        if (/privacy|خصوصية|terms|شروط|return|استرجاع|shipping|شحن/i.test(`${path} ${a.textContent}`)) policies.push(clean(a.textContent, 55) || clean(path, 55));
        if (target.toString() === pageUrl || visited.has(target.toString())) continue;
        const label = `${path} ${a.textContent}`;
        const score = /about|عنّا|من نحن|service|خدم|product|منتج|catalog|متجر|shop/i.test(label) ? 4 : /pricing|سعر|أسعار|price|contact|تواصل|faq|أسئلة/i.test(label) ? 3 : /blog|مدون/i.test(label) ? 1 : 0;
        if (score) links.push({ url: target, score });
      } catch { /* malformed link */ }
    }
    for (const script of Array.from(parseHTML(html).document.querySelectorAll('script[type="application/ld+json"]')).slice(0, 8)) {
      try {
        const parsed: unknown = JSON.parse(script.textContent ?? "");
        const queue: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];
        let processed = 0;
        while (queue.length && processed++ < 35) {
          const item = queue.shift();
          if (!item || typeof item !== "object" || Array.isArray(item)) continue;
          const entry = item as Record<string, unknown>;
          if (Array.isArray(entry["@graph"])) queue.push(...entry["@graph"].slice(0, 20));
          if (Array.isArray(entry["itemListElement"])) queue.push(...entry["itemListElement"].slice(0, 20));
          if (/Product|Service|Offer/i.test(types(entry["@type"])) && typeof entry["name"] === "string") products.push(clean(entry["name"], 80));
          if (typeof entry["price"] === "string" || typeof entry["price"] === "number") {
            const currency = typeof entry["priceCurrency"] === "string" ? entry["priceCurrency"] : "";
            if (/^\d{1,8}(?:[.,]\d{1,2})?$/.test(String(entry["price"]))) offers.push(clean(`${entry["price"]} ${currency}`, 40));
          }
          const address = entry["address"];
          if (address && typeof address === "object" && !Array.isArray(address)) {
            const a = address as Record<string, unknown>;
            locations.push(clean([a["addressLocality"], a["addressRegion"], a["addressCountry"]].filter((v) => typeof v === "string").join("، "), 100));
          }
          if (typeof entry["telephone"] === "string") contacts.push(clean(entry["telephone"], 70));
          if (Array.isArray(entry["sameAs"])) for (const s of entry["sameAs"].slice(0, 12)) {
            if (typeof s !== "string") continue;
            try { const target = new URL(s); if (socialHosts.some((h) => target.hostname === h || target.hostname.endsWith(`.${h}`))) socials.push(clean(`${target.hostname}${target.pathname.replace(/\/$/, "")}`, 90)); } catch { /* malformed social */ }
          }
        }
      } catch { /* invalid structured data */ }
    }
  }

  collect(first.html, first.url);
  visited.add(first.url);
  const candidates = links.sort((a, b) => b.score - a.score).filter(({ url: candidate }) => {
    const key = candidate.toString();
    if (visited.has(key)) return false;
    visited.add(key);
    return true;
  }).slice(0, 4);
  const more = await Promise.all(candidates.map(({ url: candidate }) => readPage(candidate, root).catch(() => null)));
  const pagesRead = [first.url];
  for (const page of more) if (page) { pagesRead.push(page.url); collect(page.html, page.url); }

  const html = first.html.slice(0, 150_000);
  const platform = /cdn\.shopify\.com|myshopify/i.test(html) ? "Shopify" : /woocommerce/i.test(html) ? "WooCommerce" : /wp-content|wordpress/i.test(html) ? "WordPress" : /salla\.sa|cdn\.salla/i.test(html) ? "سلة" : /zid\.store|cdn\.zid/i.test(html) ? "زد" : /webflow\.com|data-wf-page/i.test(html) ? "Webflow" : /wixstatic|wix\.com/i.test(html) ? "Wix" : /ghost\.io|ghost-url/i.test(html) ? "Ghost" : "";
  if (/googletagmanager\.com|gtag\(|google-analytics\.com/i.test(html)) signals.push("قياس Google");
  if (/connect\.facebook\.net\/.*fbevents|fbq\(['"]init/i.test(html)) signals.push("Meta Pixel");
  if (/search\.google\.com\/search-console|google-site-verification/i.test(html)) signals.push("توثيق Google");
  const tone = /[\u0600-\u06ff]/.test(samples.join(" ")) ? "العربية" : /[a-z]/i.test(samples.join(" ")) ? "الإنجليزية" : "";
  return { url: first.url, name, summary, industry, products: unique(products, 10), headings: unique(headings, 16), socials: unique(socials, 10), contacts: unique(contacts, 6), locations: unique(locations, 6), platform, language: clean(document.documentElement?.getAttribute("lang"), 20) || tone, pagesRead: unique(pagesRead, 5), offers: unique(offers, 5), actions: unique(actions, 7), policies: unique(policies, 5), signals: unique(signals, 5), tone };
}