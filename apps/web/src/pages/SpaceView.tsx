import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Shell } from "../components/Shell";
import { api } from "../lib/api";
import { Button, Card, Input, Pill, SectionTitle } from "../components/ui";
import { hasRole, useAuth } from "../lib/auth";

export default function SpaceView() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [space, setSpace] = useState<any | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [articles, setArticles] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const s = await api.listSpaces();
      setSpaces(s.spaces || []);
      const found = (s.spaces || []).find((x: any) => x.slug === slug);
      setSpace(found || null);
      setSelectedCollectionId("");
    })().catch(() => {});
  }, [slug]);

  useEffect(() => {
    (async () => {
      if (!space) return;
      const params: any = { spaceId: space.id };
      if (selectedCollectionId) params.collectionId = selectedCollectionId;
      if (q.trim()) params.q = q.trim();
      const a = await api.listArticles(params);
      setArticles(a.articles || []);
    })().catch(() => {});
  }, [space, selectedCollectionId, q]);

  const canCreate = useMemo(() => hasRole(user, ["ADMIN", "CONTRIBUTOR", "APPROVER"]), [user]);

  return (
    <Shell>
      <div className="flex items-start justify-between gap-4">
        <SectionTitle title={space?.name || "Space"} subtitle={space?.description || "Collections and articles"} />
        {canCreate ? <Link to="/create"><Button>Create article</Button></Link> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="p-4 lg:col-span-1">
          <div className="text-sm font-semibold text-slate-100">Collections</div>
          <div className="mt-3 space-y-2">
            <button
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${!selectedCollectionId ? "bg-slate-900 text-slate-100" : "text-slate-300 hover:bg-slate-900/60"}`}
              onClick={() => setSelectedCollectionId("")}
            >
              All
            </button>
            {(space?.collections || []).map((c: any) => (
              <button
                key={c.id}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selectedCollectionId === c.id ? "bg-slate-900 text-slate-100" : "text-slate-300 hover:bg-slate-900/60"}`}
                onClick={() => setSelectedCollectionId(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-1 text-xs text-slate-400">Filter</div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search within this space..." />
          </div>
        </Card>

        <Card className="p-4 lg:col-span-3">
          <div className="text-sm font-semibold text-slate-100">Articles</div>
          <div className="mt-3 space-y-3">
            {articles.length ? articles.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <Link to={`/articles/${a.id}`} className="font-medium text-slate-100 hover:text-sky-200">
                    {a.title}
                  </Link>
                  <Pill>{a.status}</Pill>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {a.collection?.name ? `${a.collection.name} • ` : ""}{a.type} • updated {new Date(a.updatedAt).toLocaleString()}
                </div>
                {a.tags?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.tags.slice(0, 6).map((t: string) => <Pill key={t}>#{t}</Pill>)}
                  </div>
                ) : null}
              </div>
            )) : <div className="text-sm text-slate-400">No matching articles.</div>}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
