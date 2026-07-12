"use client";

import Header from "@/src/components/dashboard/Header";
import Sidebar from "@/src/components/dashboard/Sidebar";
import { SidebarProvider } from "@/src/context/SidebarContext";
import type { SessionDisplayUser } from "@/src/features/identity/session-client";
import type { NavigationCapabilities } from "@/src/features/navigation";

type AppShellProps = {
  children: React.ReactNode;
  navigationCapabilities: NavigationCapabilities;
  user: SessionDisplayUser;
};

export default function AppShell({
  children,
  navigationCapabilities,
  user,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background-light">
        <Header userId={user.id} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar capabilities={navigationCapabilities} user={user} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
