import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../lib/auth";
import Login from "./Login";
import Setup from "./Setup";
import Dashboard from "./Dashboard";
import SpaceView from "./SpaceView";
import ArticleView from "./ArticleView";
import ArticleEdit from "./ArticleEdit";
import CreateArticle from "./CreateArticle";
import Search from "./Search";
import Audit from "./Audit";
import AdminUsers from "./AdminUsers";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-slate-300">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/spaces/:slug"
          element={
            <RequireAuth>
              <SpaceView />
            </RequireAuth>
          }
        />

        <Route
          path="/articles/:id"
          element={
            <RequireAuth>
              <ArticleView />
            </RequireAuth>
          }
        />

        <Route
          path="/articles/:id/edit"
          element={
            <RequireAuth>
              <ArticleEdit />
            </RequireAuth>
          }
        />

        <Route
          path="/create"
          element={
            <RequireAuth>
              <CreateArticle />
            </RequireAuth>
          }
        />

        <Route
          path="/search"
          element={
            <RequireAuth>
              <Search />
            </RequireAuth>
          }
        />

        <Route
          path="/audit"
          element={
            <RequireAuth>
              <Audit />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <AdminUsers />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
