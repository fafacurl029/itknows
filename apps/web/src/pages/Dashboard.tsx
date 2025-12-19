import React, { useEffect, useState } from "react";
import { Shell } from "../components/Shell";
import { api } from "../lib/api";
import { Card, SectionTitle } from "../components/ui";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const s = await api.listSpaces();
      setSpaces(s.spaces || []);
      // show latest updated across spaces (simple)
      const a = await api.listArticles({ q: "" });
      setRecent((a.articles || []).slice(0, 8));
    })().catch(() => {});
  }, []);

  return (
    <Shell>
      <SectionTitle title="Dashboard" subtitle="Quick access to spaces and recently updated articles." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="text-sm font-semibold text-slate-100">Recently updated</div>
          <div className="mt-3 space-y-3">
            {recent.length ? recent.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <Link to={`/articles/${a.id}`} className="font-medium text-slate-100 hover:text-sky-200">{a.title}</Link>
                  <div className="text-xs text-slate-500">{a.status}</div>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {a.space?.name}{a.collection?.name ? ` • ${a.collection.name}` : ""} • updated {new Date(a.updatedAt).toLocaleString()}
                </div>
              </div>
            )) : <div className="text-sm text-slate-400">No articles yet.</div>}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-100">Spaces</div>
          <div className="mt-3 space-y-2">
            {spaces.map((s) => (
              <Link key={s.id} to={`/spaces/${s.slug}`} className="block rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/60">
                {s.name}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
