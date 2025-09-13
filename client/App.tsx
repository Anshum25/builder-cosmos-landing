import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import { PermissionsProvider } from "./context/PermissionsContext";
import { ChatProvider } from "./context/ChatContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient();

function Header() {
  const loc = useLocation();
  const active = (path: string) =>
    loc.pathname === path ? "text-primary" : "text-foreground/70";
  const toggle = () => {
    const el = document.documentElement;
    el.classList.toggle("dark");
    localStorage.setItem(
      "finance.theme",
      el.classList.contains("dark") ? "dark" : "light",
    );
  };
  useEffect(() => {
    const pref = localStorage.getItem("finance.theme");
    if (pref === "dark") document.documentElement.classList.add("dark");
  }, []);
  return (
    <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
      <div className="container flex items-center justify-between h-14">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold"
          aria-label="AI Finance Home"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6">
            <defs>
              <linearGradient id="g" x1="0" x2="1">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#g)" />
          </svg>
          <span>AI Finance</span>
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          <Link
            to="/"
            className={cn("px-3 py-2 text-sm font-medium", active("/"))}
          >
            Dashboard
          </Link>
          <Link
            to="/chat"
            className={cn("px-3 py-2 text-sm font-medium", active("/chat"))}
          >
            Chat
          </Link>
          <button
            onClick={toggle}
            className="px-3 py-2 text-sm text-foreground/60 hover:text-foreground"
            aria-label="Toggle theme"
          >
            Theme
          </button>
          <a
            href="https://builder.io"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-sm text-foreground/60 hover:text-foreground"
          >
            Help
          </a>
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}

function MobileNav() {
  const loc = useLocation();
  const [open, setOpen] = (React as any).useState(false);
  return (
    <div className="md:hidden">
      <button
        aria-label="Open menu"
        className="p-2"
        onClick={() => setOpen(true)}
      >
        <span className="i">☰</span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      {open && (
        <div className="fixed right-0 top-0 z-50 h-full w-64 bg-background border-l shadow-xl p-4">
          <button
            className="mb-4"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
          <nav className="flex flex-col">
            <Link
              to="/"
              className="px-3 py-2"
              onClick={() => setOpen(false)}
              aria-current={loc.pathname === "/"}
            >
              Dashboard
            </Link>
            <Link
              to="/chat"
              className="px-3 py-2"
              onClick={() => setOpen(false)}
              aria-current={loc.pathname === "/chat"}
            >
              Chat
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PermissionsProvider>
          <ChatProvider>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ChatProvider>
        </PermissionsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
