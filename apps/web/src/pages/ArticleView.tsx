import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Shell } from "../components/Shell";
import { api } from "../lib/api";
import { Button, Card, Input, Pill, SectionTitle, Textarea } from "../components/ui";
import { marked } from "marked";
import { hasRole, useAuth } from "../lib/auth";

export default function ArticleView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<any | null>(null);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const canEdit = useMemo(() => hasRole(user, ["ADMIN", "CONTRIBUTOR", "APPROVER"]), [user]);
  const canPublish = useMemo(() => hasRole(user, ["ADMIN", "APPROVER"]), [user]);

  async function load() {
    if (!id) return;
    const res = await api.getArticle(id);
    setArticle(res.article);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [id]);

  const html = useMemo(() => {
    const c = article?.content || "";
    return marked.parse(c);
  }, [article?.content]);

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
        <div>
          <div className="flex items-center gap-2">
            <SectionTitle title={article.title} subtitle={`${article.space?.name}${article.collection?.name ? " • " + article.collection.name : ""}`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill>{article.status}</Pill>
            <Pill>{article.type}</Pill>
            {article.tags?.slice(0, 10).map((t: string) => <Pill key={t}>#{t}</Pill>)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Created {new Date(article.createdAt).toLocaleString()} • Updated {new Date(article.updatedAt).toLocaleString()}
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit ? <Button variant="ghost" onClick={() => nav(`/articles/${article.id}/edit`)}>Edit</Button> : null}
          {canPublish ? (
            <Button
              onClick={async () => {
                setErr(null);
                try {
                  const next = article.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
                  await api.updateArticle(article.id, { status: next, changeSummary: `Status -> ${next}` });
                  await load();
                } catch (e: any) {
                  setErr(e.message || "Failed");
                }
              }}
            >
              {article.status === "PUBLISHED" ? "Unpublish" : "Publish"}
            </Button>
          ) : null}
        </div>
      </div>

      {err ? <div className="mt-4 rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="p-4 lg:col-span-3">
          <div className="prose prose-invert max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-code:text-slate-100">
            <div dangerouslySetInnerHTML={{ __html: html as any }} />
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-1">
          <Card className="p-4">
            <div className="text-sm font-semibold text-slate-100">Versions</div>
            <div className="mt-3 space-y-2">
              {(article.versions || []).map((v: any) => (
                <div key={v.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-slate-100">v{v.versionNumber}</div>
                    {canPublish ? (
                      <button
                        className="text-xs text-sky-300 hover:text-sky-200"
                        onClick={async () => {
                          await api.restoreArticleVersion(article.id, v.versionNumber);
                          await load();
                        }}
                      >
                        Restore
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(v.createdAt).toLocaleString()}</div>
                  {v.changeSummary ? <div className="mt-1 text-xs text-slate-400">{v.changeSummary}</div> : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-semibold text-slate-100">Comments</div>
            <div className="mt-3 space-y-3">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." />
              <Button
                className="w-full"
                onClick={async () => {
                  if (!comment.trim()) return;
                  await api.addComment(article.id, { body: comment.trim() });
                  setComment("");
                  await load();
                }}
              >
                Post
              </Button>

              <div className="space-y-2">
                {(article.comments || []).map((c: any) => (
                  <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                    <div className="text-xs text-slate-500">{c.user?.name || c.user?.email} • {new Date(c.createdAt).toLocaleString()}</div>
                    <div className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">{c.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Link to={`/spaces/${article.space?.slug}`} className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to {article.space?.name}
        </Link>
      </div>
    </Shell>
  );
}
