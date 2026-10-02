import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { WelcomePreview } from "./welcome-preview.server";

// Local defense in depth when the shared limiter is temporarily unavailable.
const attempts = new Map<string, { count: number; expires: number }>();

export const getWelcomePreview = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ url: z.string().trim().min(4).max(300) }).parse(input))
  .handler(async ({ data }): Promise<WelcomePreview> => {
    const { publicWebsiteUrl, previewWebsite } = await import("./welcome-preview.server");
    if (!publicWebsiteUrl(data.url)) throw new Error("أدخل رابط موقع عام صالح.");
    const { isRateLimited, requestIdentifier } = await import("./rate-limit.server");
    const id = requestIdentifier(getRequest());
    const key = `${id}:${new URL(publicWebsiteUrl(data.url)?.toString() ?? data.url).hostname}`;
    const now = Date.now();
    const entry = attempts.get(key);
    if (attempts.size > 5000) for (const [k, v] of attempts) if (v.expires < now) attempts.delete(k);
    if (entry && entry.expires > now && entry.count >= 3) throw new Error("وصلت للحد المؤقت للفحص. يمكنك المتابعة وإضافة الموقع بعد التسجيل.");
    attempts.set(key, { count: (entry && entry.expires > now ? entry.count : 0) + 1, expires: entry && entry.expires > now ? entry.expires : now + 3600_000 });
    if (await isRateLimited("welcome-preview", id, 3, 3600)) throw new Error("وصلت للحد المؤقت للفحص. يمكنك المتابعة وإضافة الموقع بعد التسجيل.");
    return previewWebsite(data.url);
  });
