import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Radio, Settings, Download, Menu, X } from "lucide-react";
import Logo from "./Logo";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/room", label: "Rooms", icon: Radio },
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/install", label: "Install", icon: Download },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 font-bold text-lg font-display">
          <Logo size={28} />
          <span className="gradient-text">Sync Sound</span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Button
                key={link.to}
                variant={isActive(link.to) ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate(link.to)}
                className={`gap-2 font-medium ${isActive(link.to) ? "glow-border" : ""}`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Button>
            );
          })}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.to}
                onClick={() => { navigate(link.to); setMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-6 py-3.5 text-left transition-colors ${
                  isActive(link.to) ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
