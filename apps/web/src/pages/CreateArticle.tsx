import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shell } from "../components/Shell";
import { api } from "../lib/api";
import { Button, Card, Input, SectionTitle, Textarea } from "../components/ui";
import { hasRole, useAuth } from "../lib/auth";

const typeOptions = [
  { value: "RUNBOOK", label: "Runbook" },
  { value: "TROUBLESHOOTING", label: "Troubleshooting / Known Error" },
  { value: "SOP", label: "SOP" },
  { value: "HOW_TO", label: "How-To" },
  { value: "ARCHITECTURE", label: "Architecture" },
  { value: "CHANGE_PROCEDURE", label: "Change Procedure" },
];

export default function CreateArticle() {
  const nav = useNavigate();
  const { user } = useAuth();
  const canCreate = useMemo(() => hasRole(user, ["ADMIN", "CONTRIBUTOR", "APPROVER"]), [user]);

  const [spaces, setSpaces] = useState<any[]>([]);
  const [spaceId, setSpaceId] = useState("");
  const [collectionId, setCollectionId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("RUNBOOK");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.listSpaces().then((r) => {
      setSpaces(r.spaces || []);
      if (r.spaces?.length) setSpaceId(r.spaces[0].id);
    }).catch(() => {});
  }, []);

  const collections = useMemo(() => {
    const s = spaces.find((x) => x.id === spaceId);
    return s?.collections || [];
  }, [spaces, spaceId]);

  if (!canCreate) {
    return (
      <Shell>
        <div className="text-sm text-slate-400">You do not have permission to create articles.</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <SectionTitle title="Create article" subtitle="Create a new knowledge base entry with tags and markdown content." />

      {err ? <div className="mt-4 rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</div> : null}

      <Card className="mt-4 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <div className="mb-1 text-xs text-slate-400">Space</div>
            <select
              value={spaceId}
              onChange={(e) => { setSpaceId(e.target.value); setCollectionId(""); }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            >
              {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-400">Collection (optional)</div>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            >
              <option value="">None</option>
              {collections.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-1 text-xs text-slate-400">Title</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., VPN issue - certificate expired" />
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-400">Type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            >
              {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-400">Tags</div>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vpn, windows, ad" />
          </div>

          <div className="lg:col-span-2">
            <div className="mb-1 text-xs text-slate-400">Content (Markdown)</div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14} className="font-mono" placeholder="# Summary

## Steps

1.
2.
" />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="ghost" onClick={() => nav(-1)}>Cancel</Button>
          <Button
            onClick={async () => {
              setErr(null);
              try {
                const res = await api.createArticle({
                  spaceId,
                  collectionId: collectionId || null,
                  title,
                  type,
                  content,
                  tags: tags.split(",").map((x) => x.trim()).filter(Boolean),
                });
                nav(`/articles/${res.article.id}`);
              } catch (e: any) {
                setErr(e.message || "Create failed");
              }
            }}
          >
            Create
          </Button>
        </div>
      </Card>
    </Shell>
  );
}
