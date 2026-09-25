import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StoreProvider } from "@/lib/store";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function AppLayout() {
  return (
    <StoreProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </StoreProvider>
  );
}
