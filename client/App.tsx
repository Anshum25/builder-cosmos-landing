import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
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
  const active = (path: string) => (loc.pathname === path ? "text-primary" : "text-foreground/70");
  return (
    <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
      <div className="container flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
          <span>AI Finance</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/" className={cn("px-3 py-2 text-sm font-medium", active("/"))}>
            Dashboard
          </Link>
          <Link to="/chat" className={cn("px-3 py-2 text-sm font-medium", active("/chat"))}>
            Chat
          </Link>
          <a
            href="https://builder.io"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-sm text-foreground/60 hover:text-foreground"
          >
            Help
          </a>
        </nav>
      </div>
    </header>
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
