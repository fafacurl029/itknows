import React, { useEffect, useMemo, useState } from "react";
import { Shell } from "../components/Shell";
import { api } from "../lib/api";
import { Button, Card, Pill, SectionTitle } from "../components/ui";
import { hasRole, useAuth } from "../lib/auth";

const allRoles = ["ADMIN", "APPROVER", "CONTRIBUTOR", "READER"];

export default function AdminUsers() {
  const { user } = useAuth();
  const isAdmin = useMemo(() => hasRole(user, ["ADMIN"]), [user]);
  const [users, setUsers] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const r = await api.adminUsers();
    setUsers(r.users || []);
  }

  useEffect(() => {
    if (!isAdmin) return;
    load().catch(() => {});
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Shell>
        <div className="text-sm text-slate-400">Admin only.</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <SectionTitle title="Users" subtitle="Manage roles for access control (RBAC)." />
      {err ? <div className="mt-4 rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</div> : null}
      <Card className="p-4">
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">{u.name || u.email}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.roles.map((r: string) => <Pill key={r}>{r}</Pill>)}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {allRoles.map((r) => {
                  const active = u.roles.includes(r);
                  return (
                    <button
                      key={r}
                      className={`rounded-xl border px-3 py-1 text-xs ${
                        active ? "border-sky-700 bg-sky-950/40 text-sky-200" : "border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-900/60"
                      }`}
                      onClick={() => {
                        const next = active ? u.roles.filter((x: string) => x !== r) : [...u.roles, r];
                        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, roles: next } : x)));
                      }}
                    >
                      {active ? "✓ " : ""}{r}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <Button
                  variant="ghost"
                  onClick={async () => {
                    setErr(null);
                    try {
                      const current = users.find((x) => x.id === u.id)?.roles || u.roles;
                      if (!current.length) throw new Error("User must have at least one role.");
                      await api.adminUpdateRoles(u.id, current);
                      await load();
                    } catch (e: any) {
                      setErr(e.message || "Update failed");
                    }
                  }}
                >
                  Save roles
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
