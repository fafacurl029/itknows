import React, { useEffect, useState } from "react";
import { Shell } from "../components/Shell";
import { api } from "../lib/api";
import { Card, SectionTitle } from "../components/ui";

export default function Audit() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    api.audit().then((r) => setEvents(r.events || [])).catch(() => {});
  }, []);

  return (
    <Shell>
      <SectionTitle title="Audit feed" subtitle="Recent activity across the knowledge base." />
      <Card className="p-4">
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-slate-100">{e.action}</div>
                <div className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {e.actor ? (e.actor.name || e.actor.email) : "System"} • {e.entityType} • {e.entityId}
              </div>
            </div>
          ))}
          {!events.length ? <div className="text-sm text-slate-400">No events yet.</div> : null}
        </div>
      </Card>
    </Shell>
  );
}
