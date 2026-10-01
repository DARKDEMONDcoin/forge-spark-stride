import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addKnowledge, deleteKnowledge, listKnowledge } from "@/lib/knowledge.functions";

/** مكتبة المعرفة: مستندات وروابط يقرأها كل الموظفين ويستحضرون منها الفقرة المناسبة تلقائياً. */
export function KnowledgeLibrary({ workspaceId }: { workspaceId?: string | undefined }) {
  const qc = useQueryClient();
  const list = useServerFn(listKnowledge);
  const add = useServerFn(addKnowledge);
  const del = useServerFn(deleteKnowledge);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const key = ["knowledge", workspaceId];

  const { data: items = [], isLoading } = useQuery({
    queryKey: key,
    enabled: Boolean(workspaceId),
    queryFn: () => list({ data: { workspaceId: workspaceId! } }),
  });

  const save = useMutation({
    mutationFn: (input: { url?: string; text?: string }) => add({ data: { workspaceId: workspaceId!, ...input } }),
    onSuccess: (r) => {
      toast.success(`حُفظ «${r.title}» في ${r.chunks} مقطع — الفريق يستخدمه الآن`);
      setUrl("");
      setText("");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (source: string) => del({ data: { workspaceId: workspaceId!, source } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h2 className="font-display text-lg font-black">مكتبة المعرفة الذكية</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        أضف كتيّب منتجاتك، سياساتك، أو أي صفحة — وكل موظف يستحضر الفقرة المناسبة تلقائياً وقت الرد.
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) save.mutate({ url: url.trim() });
        }}
      >
        <Input dir="ltr" type="url" placeholder="https://example.com/policy" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button type="submit" disabled={!url.trim() || save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : "أضف رابطاً"}
        </Button>
      </form>

      <Textarea
        className="mt-3 min-h-28"
        placeholder="أو الصق نص المستند هنا (أول سطر يصبح العنوان)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        className="mt-2"
        variant="secondary"
        disabled={text.trim().length < 20 || save.isPending}
        onClick={() => save.mutate({ text })}
      >
        احفظ النص في الذاكرة
      </Button>

      <ul className="mt-4 divide-y divide-border">
        {isLoading && <li className="py-3 text-sm text-muted-foreground">جارٍ التحميل…</li>}
        {!isLoading && !items.length && <li className="py-3 text-sm text-muted-foreground">لا توجد مستندات بعد.</li>}
        {items.map((it) => (
          <li key={it.source} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{it.title}</p>
              <p className="truncate text-xs text-muted-foreground">{it.chunks} مقطع · {it.source.startsWith("text:") ? "نص" : it.source}</p>
            </div>
            <Button size="icon" variant="ghost" aria-label="حذف" disabled={remove.isPending} onClick={() => remove.mutate(it.source)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
