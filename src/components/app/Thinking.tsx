import { Portrait } from "@/components/site/Portrait";
import { cn } from "@/lib/utils";
import type { BrowserEvent } from "@/lib/employee-stream";
import { Check, Globe, ExternalLink } from "lucide-react";

/**
 * مؤشر عمل الموظف لحظة بلحظة: سجل الخطوات الحقيقية التي نفّذها (مثل Manus/Claude)،
 * نافذة المتصفح الحيّ وهو يبحث، ثم نص الرد وهو يُكتب.
 */
export function Thinking({
  memberId,
  name,
  className,
  step,
  steps = [],
  browser,
  text,
}: {
  memberId: string;
  name: string;
  className?: string;
  step?: string | null;
  steps?: string[];
  browser?: BrowserEvent | null;
  text?: string;
  request?: string;
  imageRequested?: boolean;
  attachments?: number;
}) {
  const streaming = Boolean(text && text.trim());
  const log = steps.length ? steps : step ? [step] : [];
  const active = log.length > 0 || Boolean(browser) || streaming;
  let host = "";
  try {
    host = browser?.url ? new URL(browser.url).hostname.replace(/^www\./, "") : "";
  } catch {
    host = "";
  }

  return (
    <div
      className={cn("chat-thinking-row flex min-w-0 justify-end gap-3 animate-bubble-in", className)}
      role="status"
      aria-live="polite"
      aria-label={`${name} يعمل على طلبك`}
    >
      <span className="order-2 block size-9 shrink-0 overflow-hidden rounded-xl shadow-sm">
        <Portrait memberId={memberId} name={name} className="size-full" />
      </span>

      <div
        className={cn(
          "order-1 min-w-0 [overflow-wrap:anywhere] rounded-3xl rounded-se-lg border border-border bg-card px-4 py-3 shadow-sm",
          active ? "chat-thinking-content w-[min(46rem,82%)]" : "",
        )}
      >
        {log.length ? (
          <ol className="mb-2 space-y-1.5" dir="auto">
            {log.map((label, i) => {
              const current = i === log.length - 1 && !streaming;
              return (
                <li
                  key={`${i}-${label}`}
                  className={cn(
                    "flex min-w-0 items-start gap-2 text-[0.75rem] leading-5",
                    current ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {current ? (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary think-dot" aria-hidden />
                  ) : (
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  )}
                  <span className="min-w-0">{label}</span>
                </li>
              );
            })}
          </ol>
        ) : null}

        {browser ? (
          <div className="mb-3 overflow-hidden rounded-2xl border border-border bg-muted">
            <div className="flex min-w-0 items-center gap-2 border-b border-border bg-background px-3 py-1.5 text-[0.7rem] text-muted-foreground">
              <Globe className="size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate" dir="ltr">
                {host || "متصفح حقيقي"}
              </span>
              {!browser.done ? (
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <span className="size-1.5 rounded-full bg-primary think-dot" aria-hidden />
                  مباشر
                </span>
              ) : (
                <span>انتهى التصفح</span>
              )}
              {browser.liveUrl && !browser.done ? (
                <a
                  href={browser.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  aria-label="افتح الشاشة الحيّة"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
            <div className="relative aspect-video w-full">
              {browser.screenshotUrl ? (
                <img
                  src={browser.screenshotUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover object-top"
                />
              ) : null}
              {browser.liveUrl && !browser.done ? (
                <iframe
                  src={browser.liveUrl}
                  title="المتصفح الحي"
                  className="pointer-events-none absolute inset-0 size-full"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : browser.screenshotUrl ? null : (
                <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                  يفتح المتصفح…
                </div>
              )}
            </div>
            {browser.title ? (
              <p className="truncate px-3 py-1.5 text-[0.7rem] text-muted-foreground" dir="auto">
                {browser.title}
              </p>
            ) : null}
          </div>
        ) : null}

        {streaming ? (
          <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-7">
            {text}
            <span className="typewriter-caret align-middle" aria-hidden="true" />
          </p>
        ) : log.length || browser ? null : (
          <span className="flex items-center gap-1.5 py-0.5">
            <span className="size-2 rounded-full bg-primary think-dot" aria-hidden />
            <span className="size-2 rounded-full bg-primary think-dot [animation-delay:0.18s]" aria-hidden />
            <span className="size-2 rounded-full bg-primary think-dot [animation-delay:0.36s]" aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
}
