import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth, hasRole } from "../lib/auth";
import { Button, Input } from "./ui";

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const res = await api.listSpaces();
    setSpaces(res.spaces || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <div className="fixed inset-y-0 left-0 w-72 border-r border-slate-900 bg-slate-950/60 backdrop-blur">
        <div className="px-5 py-5">
          <Link to="/" className="text-base font-semibold text-slate-100">
            IT Knowledge Base
          </Link>
          <div className="mt-2 text-xs text-slate-500">L2 Ops-ready • Postgres • RBAC</div>
        </div>

        <div className="px-4">
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spaces</div>
          </div>
          <nav className="space-y-1">
            {spaces.map((s) => (
              <NavLink
                key={s.id}
                to={`/spaces/${s.slug}`}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2 text-sm ${isActive ? "bg-slate-900 text-slate-100" : "text-slate-300 hover:bg-slate-900/60"}`
                }
              >
                {s.name}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 border-t border-slate-900 pt-4">
            <NavLink to="/audit" className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/60">
              Audit feed
            </NavLink>
            {hasRole(user, ["ADMIN"]) ? (
              <NavLink to="/admin/users" className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/60">
                Admin: Users
              </NavLink>
            ) : null}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-900 px-4 py-4">
          <div className="text-sm text-slate-200">{user?.name || user?.email}</div>
          <div className="mt-1 text-xs text-slate-500">{user?.roles?.join(", ")}</div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await logout();
                nav("/login");
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="pl-72">
        <div className="sticky top-0 z-10 border-b border-slate-900 bg-slate-950/40 backdrop-blur">
          <div className="flex items-center gap-3 px-6 py-4">
            <form
              className="flex w-full max-w-xl items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
              }}
            >
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search runbooks, SOPs, known errors..." />
              <Button type="submit" className="shrink-0">Search</Button>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => nav("/create")}
                title="Create a new article"
              >
                Create
              </Button>
            </div>
          </div>
        </div>

        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
