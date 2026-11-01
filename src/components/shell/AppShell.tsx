import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNavigation } from "./MobileNavigation";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { useAuth } from "../../contexts/AuthContext";

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const { signOut } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-[var(--color-canvas)] relative">
      {/* Liquid glass mesh background effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-blue-400/10 blur-[100px]" />
        <div className="absolute right-[-5%] top-[20%] h-[30%] w-[30%] rounded-full bg-[var(--color-accent)]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[40%] w-[50%] rounded-full bg-purple-400/5 blur-[120px]" />
      </div>
      <div className="hidden lg:block">
        <Sidebar onSignOut={signOut} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onSignOut={signOut} />
        <main className="flex-1 overflow-y-auto">
          <div
            key={location.pathname}
            className="animate-fade-rise mx-auto w-full max-w-[1240px] px-3.5 pb-24 pt-3.5 sm:px-8 sm:pt-8 lg:pb-14"
          >
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNavigation onMore={() => setMenuOpen(true)} />
      <MobileMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} onSignOut={signOut} />
    </div>
  );
}
