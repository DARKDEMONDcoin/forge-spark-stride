import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { WelcomePreview } from "./welcome-preview.server";

export const getWelcomePreview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ url: z.string().trim().min(4).max(300) }).parse(input))
  .handler(async ({ data }): Promise<WelcomePreview> => {
    const { publicWebsiteUrl, previewWebsite } = await import("./welcome-preview.server");
    if (!publicWebsiteUrl(data.url)) throw new Error("أدخل رابط موقع عام صالح.");
    const { isRateLimited, requestIdentifier } = await import("./rate-limit.server");
    if (await isRateLimited("welcome-preview", requestIdentifier(getRequest()), 3, 3600)) throw new Error("وصلت للحد المؤقت للفحص. يمكنك المتابعة وإضافة الموقع بعد التسجيل.");
    return previewWebsite(data.url);
  });
