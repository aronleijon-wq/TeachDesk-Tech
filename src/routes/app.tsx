import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { displayName, useAuth } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Remember where the visitor was headed; the path changes once the redirect starts.
  const [requestedPath] = useState(pathname);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" search={{ redirect: requestedPath }} replace />;
  }

  return (
    // Keyed by user so switching accounts loads that teacher's own saved workspace.
    <StoreProvider key={user.id} userId={user.id} account={{ name: displayName(user), email: user.email ?? "" }}>
      <AppShell>
        <Outlet />
      </AppShell>
    </StoreProvider>
  );
}
