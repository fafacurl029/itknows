import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Shell } from "../components/Shell";
import { api } from "../lib/api";
import { Card, Pill, SectionTitle } from "../components/ui";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const r = await api.listArticles({ q });
      setResults(r.articles || []);
    })().catch(() => {});
  }, [q]);

  const subtitle = useMemo(() => q ? `Results for "${q}"` : "Enter a query to search.", [q]);

  return (
    <Shell>
      <SectionTitle title="Search" subtitle={subtitle} />

      <Card className="p-4">
        <div className="space-y-3">
          {results.length ? results.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <Link to={`/articles/${a.id}`} className="font-medium text-slate-100 hover:text-sky-200">{a.title}</Link>
                <Pill>{a.status}</Pill>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {a.space?.name}{a.collection?.name ? ` • ${a.collection.name}` : ""} • {a.type}
              </div>
            </div>
          )) : <div className="text-sm text-slate-400">No results.</div>}
        </div>
      </Card>
    </Shell>
  );
}
