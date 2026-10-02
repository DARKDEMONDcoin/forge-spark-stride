/** Bounded, evidence-first public website preview. No model calls or account writes. */
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
};

const socialHosts = ["instagram.com", "facebook.com", "tiktok.com", "linkedin.com", "youtube.com", "x.com", "twitter.com", "snapchat.com", "pinterest.com", "wa.me"];
const publicHost = (host: string) => {
  const h = host.toLowerCase().replace(/\.$/, "");
  return h.includes(".") && h.length <= 253 && !h.endsWith(".localhost") && !h.endsWith(".onion") && !h.endsWith(".arpa") && !h.endsWith(".lan") && !h.endsWith(".home") && !h.endsWith(".corp") && !h.endsWith(".localhost.localdomain") && !h.includes("..") && /^[a-z0-9.-]+$/.test(h) && !h.endsWith(".local") && !h.endsWith(".internal") && !h.endsWith(".localhost") && !h.endsWith(".test") && !h.endsWith(".invalid") && !h.endsWith(".example") && !/^\d+(?:\.\d+){3}$/.test(h) && !h.includes(":") && h !== "localhost";
};
export function publicWebsiteUrl(raw: string): URL | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    if (u.protocol !== "https:" || u.username || u.password || u.port || !publicHost(u.hostname) || raw.length > 300) return null;
    u.hash = "";
    return u;
  } catch { return null; }
}

async function readPage(url: URL) {
  let current = url;
  for (let hop = 0; hop < 3; hop++) {
    const res = await fetch(current.toString(), {
      headers: { Accept: "text/html", "User-Agent": "SahlPreview/1.0" },
      redirect: "manual", signal: AbortSignal.timeout(8000),
    });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) throw new Error("تعذر قراءة الموقع.");
      const next = publicWebsiteUrl(new URL(location, current).toString());
      if (!next || next.hostname !== url.hostname) throw new Error("الموقع نقلنا إلى رابط آخر؛ أدخل الرابط النهائي.");
      current = next;
      continue;
    }
    if (!res.ok || !(res.headers.get("content-type") ?? "").toLowerCase().includes("text/html")) throw new Error("لم نتمكن من قراءة صفحات هذا الموقع.");
    const length = Number(res.headers.get("content-length"));
    if (length > 350_000) throw new Error("صفحة الموقع كبيرة جدًا للفحص السريع.");
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
export async function previewWebsite(raw: string): Promise<WelcomePreview> {
  const url = publicWebsiteUrl(raw);
  if (!url) throw new Error("أدخل رابط موقع عام صالح، مثل example.com");
  const first = await readPage(url);
  const { document } = parseHTML(first.html);
  const meta = (selector: string) => clean(document.querySelector(selector)?.getAttribute("content"));
  const name = meta('meta[property="og:site_name"]') || clean(document.querySelector("title")?.textContent?.split(/[|–—]/)[0], 90) || url.hostname;
  const summary = meta('meta[name="description"]') || meta('meta[property="og:description"]');
  const industry = meta('meta[property="product:category"]') || "";
  const headings = unique(Array.from(document.querySelectorAll("h1,h2,h3")).map((el) => clean(el.textContent, 90)), 12);
  const socials: string[] = [];
  const contacts: string[] = [];
  const links: { url: URL; score: number }[] = [];
  for (const a of Array.from(document.querySelectorAll("a[href]"))) {
    const href = a.getAttribute("href") ?? "";
    if (href.startsWith("mailto:") || href.startsWith("tel:")) { contacts.push(clean(href.replace(/^(mailto:|tel:)/, "").split("?")[0], 70)); continue; }
    try {
      const target = new URL(href, first.url);
      if (socialHosts.some((host) => target.hostname === host || target.hostname.endsWith(`.${host}`))) socials.push(target.hostname.replace(/^www\./, ""));
      if (target.origin === new URL(first.url).origin && target.pathname !== url.pathname && !/\.(pdf|png|jpg|webp|zip|svg|mp4)$/i.test(target.pathname)) {
        links.push({ url: target, score: /about|عن|service|خدم|product|منتج|contact|تواصل|pricing|سعر/i.test(`${target.pathname} ${a.textContent}`) ? 2 : 0 });
      }
    } catch { /* ignore malformed links */ }
  }
  const products: string[] = [];
  const locations: string[] = [];
  for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]')).slice(0, 8)) {
    try {
      const data = JSON.parse(script.textContent ?? "");
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        for (const entry of (Array.isArray(node?.["@graph"]) ? node["@graph"] : [node])) {
          if (typeof entry?.name === "string" && /Product|Service/i.test(String(entry["@type"] ?? ""))) products.push(clean(entry.name, 80));
          const address = entry?.address;
          if (address && typeof address === "object") locations.push(clean([address.addressLocality, address.addressRegion, address.addressCountry].filter(Boolean).join("، "), 100));
          if (Array.isArray(entry?.sameAs)) for (const s of entry.sameAs) {
            try { const host = new URL(s).hostname; if (socialHosts.some((h) => host === h || host.endsWith(`.${h}`))) socials.push(host.replace(/^www\./, "")); } catch { /* ignore */ }
          }
        }
      }
    } catch { /* invalid structured data */ }
  }
  const pagesRead = [first.url];
  const seen = new Set([first.url]);
  for (const link of links.sort((a, b) => b.score - a.score)) {
    const key = link.url.toString().split("#")[0];
    if (seen.has(key) || pagesRead.length >= 3) continue;
    seen.add(key);
    try {
      const page = await readPage(link.url);
      pagesRead.push(page.url);
      const parsed = parseHTML(page.html).document;
      headings.push(...Array.from(parsed.querySelectorAll("h1,h2")).map((el) => clean(el.textContent, 90)));
    } catch { /* one inaccessible page must not hide valid evidence */ }
  }
  const html = first.html.slice(0, 150_000);
  const platform = /cdn\.shopify\.com|myshopify/i.test(html) ? "Shopify" : /wp-content|wordpress/i.test(html) ? "WordPress" : /salla\.sa|cdn\.salla/i.test(html) ? "سلة" : /zid\.store|cdn\.zid/i.test(html) ? "زد" : /webflow\.com|data-wf-page/i.test(html) ? "Webflow" : /wixstatic|wix\.com/i.test(html) ? "Wix" : "";
  return { url: first.url, name, summary, industry, products: unique(products, 8), headings: unique(headings, 12), socials: unique(socials, 8), contacts: unique(contacts, 5), locations: unique(locations, 5), platform, language: clean(document.documentElement?.getAttribute("lang"), 20), pagesRead };
}
