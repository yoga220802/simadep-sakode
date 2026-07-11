"use client";

import Header from "@/src/components/dashboard/Header";
import Sidebar from "@/src/components/dashboard/Sidebar";
import { SidebarProvider } from "@/src/context/SidebarContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background-light">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
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
