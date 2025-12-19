import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Shell } from "../components/Shell";
import { api } from "../lib/api";
import { Button, Card, Input, Pill, SectionTitle, Textarea } from "../components/ui";
import { marked } from "marked";
import { hasRole, useAuth } from "../lib/auth";

const templates: Record<string, string> = {
  RUNBOOK: `# Summary\n\n- **Service:** \\n- **Impact:** \\n- **Owner:** \\n\n## Preconditions\n\n## Step-by-step\n\n1. \n2. \n\n## Validation\n\n## Rollback\n\n## References\n`,
  TROUBLESHOOTING: `# Symptoms\n\n# Scope\n\n# Quick checks\n\n- \n\n# Root cause\n\n# Workaround\n\n# Permanent fix\n\n# Verification\n`,
  SOP: `# Purpose\n\n# Scope\n\n# Procedure\n\n# Exceptions\n\n# References\n`,
};

export default function ArticleEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [status, setStatus] = useState<string>("DRAFT");
  const [err, setErr] = useState<string | null>(null);

  const canPublish = useMemo(() => hasRole(user, ["ADMIN", "APPROVER"]), [user]);

  async function load() {
    if (!id) return;
    const res = await api.getArticle(id);
    setArticle(res.article);
    setTitle(res.article.title || "");
    setContent(res.article.content || "");
    setTags((res.article.tags || []).join(", "));
    setStatus(res.article.status || "DRAFT");
  }

  useEffect(() => {
    load().catch(() => {});
  }, [id]);

  const html = useMemo(() => marked.parse(content || ""), [content]);

  if (!article) {
    return (
      <Shell>
        <div className="text-sm text-slate-400">Loading...</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-start justify-between gap-4">
        <SectionTitle title="Edit article" subtitle="Markdown editor with preview + versioning" />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => nav(`/articles/${article.id}`)}>Cancel</Button>
          <Button
            onClick={async () => {
              setErr(null);
              try {
                await api.updateArticle(article.id, {
                  title,
                  content,
                  tags: tags.split(",").map((x) => x.trim()).filter(Boolean),
                  status: canPublish ? status : undefined,
                  changeSummary: changeSummary || undefined,
                });
                nav(`/articles/${article.id}`);
              } catch (e: any) {
                setErr(e.message || "Save failed");
              }
            }}
          >
            Save
          </Button>
        </div>
      </div>

      {err ? <div className="mt-4 rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="mb-1 text-xs text-slate-400">Title</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <div className="mb-1 text-xs text-slate-400">Tags (comma-separated)</div>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vpn, dns, ad, o365" />
            </div>

            <div className="flex items-center gap-2">
              <Pill>{article.type}</Pill>
              <Pill>Current: {article.status}</Pill>
            </div>

            {canPublish ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs text-slate-400">Status</div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DEPRECATED">DEPRECATED</option>
                  </select>
                </div>
                <div>
                  <div className="mb-1 text-xs text-slate-400">Change summary</div>
                  <Input value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} placeholder="Short reason for update" />
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-1 text-xs text-slate-400">Change summary</div>
                <Input value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} placeholder="Short reason for update" />
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs text-slate-400">Content (Markdown)</div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      const t = templates[article.type] || templates.RUNBOOK;
                      if (!content.trim()) setContent(t);
                    }}
                  >
                    Insert template
                  </Button>
                </div>
              </div>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} className="font-mono" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-100">Preview</div>
          <div className="mt-3 prose prose-invert max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
            <div dangerouslySetInnerHTML={{ __html: html as any }} />
          </div>
        </Card>
      </div>
    </Shell>
  );
}
