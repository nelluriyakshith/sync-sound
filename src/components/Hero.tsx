import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Zap, DollarSign, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      navigate('/install');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background glow effect */}
      <div className="absolute inset-0 hero-glow" />
      
      <div className="container relative z-10 max-w-5xl mx-auto text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path
                d="M2 6C2 6 4 4 12 4C20 4 22 6 22 6M2 10C2 10 4 8 12 8C20 8 22 10 22 10M2 14C2 14 4 12 12 12C20 12 22 14 22 14M2 18C2 18 4 16 12 16C20 16 22 18 22 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text leading-tight">
          Sync Sound Across All Your Devices
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Create a room, connect your Android devices, and enjoy perfectly synchronized audio playback - completely free
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <Badge variant="secondary" className="px-4 py-2 text-base backdrop-blur-sm">
            <Smartphone className="w-4 h-4 mr-2" />
            Multi-Device
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-base backdrop-blur-sm">
            <Zap className="w-4 h-4 mr-2" />
            Zero Lag
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-base backdrop-blur-sm">
            <DollarSign className="w-4 h-4 mr-2" />
            100% Free
          </Badge>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary via-[hsl(var(--gradient-via))] to-accent hover:opacity-90 transition-opacity">
            Create Room
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
            Join Room
          </Button>
        </div>

        {/* Install app link */}
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground transition-all hover:scale-105"
          onClick={handleInstallClick}
        >
          <Download className="w-4 h-4 mr-2" />
          {deferredPrompt ? "Install App Now" : "Install App"}
        </Button>

        {/* Bottom tagline */}
        <p className="mt-12 text-muted-foreground">
          Works with YouTube, Spotify, and all your favorite apps
        </p>
      </div>
    </section>
  );
};

export default Hero;
