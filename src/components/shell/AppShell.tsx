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
    <div className="relative flex min-h-screen min-h-[100dvh] w-full flex-col bg-[var(--color-canvas)] lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Liquid glass mesh background effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[-10%] h-[45%] w-[45%] rounded-full bg-[#8c9a6e]/12 blur-[120px]" />
        <div className="absolute right-[-5%] top-[15%] h-[35%] w-[35%] rounded-full bg-[#a35a40]/8 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[45%] w-[50%] rounded-full bg-[#d8c4a8]/35 blur-[130px]" />
      </div>
      <div className="hidden shrink-0 lg:block">
        <Sidebar onSignOut={signOut} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col w-full">
        <Topbar onSignOut={signOut} />
        <main className="flex-1 w-full min-w-0 lg:overflow-y-auto">
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
