import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Zap, DollarSign, Download, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

const Hero = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      navigate('/install');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      <div className="absolute inset-0 hero-glow" />
      {/* Decorative grid */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.08)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container relative z-10 max-w-5xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-5 rounded-3xl glass-card glow-border animate-pulse">
            <Logo size={56} />
          </div>
        </div>

        <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium border border-primary/20">
          ✨ Free & Open Source
        </Badge>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 font-display leading-[1.05] tracking-tight">
          <span className="gradient-text">Sync Sound</span>
          <br />
          <span className="text-foreground/90">Across All Devices</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Create a room, connect your devices, and enjoy perfectly synchronized audio playback — completely free.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Badge variant="secondary" className="px-4 py-2 text-sm glass-card">
            <Smartphone className="w-4 h-4 mr-2 text-primary" />
            Multi-Device
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm glass-card">
            <Zap className="w-4 h-4 mr-2 text-accent" />
            Zero Lag
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm glass-card">
            <DollarSign className="w-4 h-4 mr-2 text-primary" />
            100% Free
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-[hsl(var(--gradient-from))] via-[hsl(var(--gradient-via))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20 font-display font-semibold"
            onClick={() => navigate('/room')}
          >
            Create Room
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 border-2 border-border hover:border-primary/50 transition-all hover:scale-[1.02] font-display"
            onClick={() => navigate('/room')}
          >
            Join Room
          </Button>
        </div>

        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground transition-all"
          onClick={handleInstallClick}
        >
          <Download className="w-4 h-4 mr-2" />
          {deferredPrompt ? "Install App Now" : "Install App"}
        </Button>

        <p className="mt-14 text-sm text-muted-foreground/70">
          Works with YouTube, Spotify, and all your favorite apps
        </p>
      </div>
    </section>
  );
};

export default Hero;
