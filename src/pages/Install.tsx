import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, CheckCircle2, Share, Smartphone, LaptopMinimalCheck, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type InstallPlatform = "ios" | "android" | "desktop";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

const Install = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("desktop");
  const [isInstalling, setIsInstalling] = useState(false);

  const isDesktop = platform === "desktop";
  const isEmbeddedPreview = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) setPlatform("ios");
    else if (/android/.test(userAgent)) setPlatform("android");
    else setPlatform("desktop");

    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({ title: "Installed!", description: "Sync Sound is ready on your home screen and recent apps." });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [toast]);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) {
      if (platform === "ios") {
        toast({
          title: "Install from Safari",
          description: "Tap Share → Add to Home Screen. iPhone blocks one-tap install prompts.",
        });
        return;
      }

      toast({
        title: "Install from browser menu",
        description: isDesktop
          ? "Click the install icon in the address bar, then confirm Install."
          : "Open the browser menu and tap Install app.",
      });
      return;
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      } else {
        toast({ title: "Install cancelled", description: "You can install again anytime.", variant: "destructive" });
      }
    } finally {
      setDeferredPrompt(null);
      setIsInstalling(false);
    }
  }, [deferredPrompt, isDesktop, platform, toast]);

  if (isInstalled) {
    return (
      <div className="min-h-screen pt-20 px-4 pb-12 flex items-center justify-center">
        <Card className="glass-card glow-border w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-display mb-2">App Installed!</h2>
            <p className="text-muted-foreground mb-6">Sync Sound is now accessible from your home screen and recent apps.</p>
            <Button
              onClick={() => navigate("/")}
              size="lg"
              className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-12 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Card className="glass-card glow-border">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Download className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold font-display mb-2">Install Sync Sound</h1>
              <p className="text-muted-foreground text-sm">
                {deferredPrompt
                  ? "One tap opens the native installer."
                  : platform === "ios"
                    ? "Fast iPhone setup in 3 taps."
                    : isDesktop
                      ? "Use your browser installer for full desktop app mode."
                      : "Install instantly from your browser menu."}
              </p>
            </div>

            <Button
              onClick={triggerInstall}
              size="lg"
              disabled={isInstalling}
              className="w-full gap-2 bg-gradient-to-r from-[hsl(var(--gradient-from))] via-[hsl(var(--gradient-via))] to-[hsl(var(--gradient-to))] text-primary-foreground font-display font-semibold"
            >
              <LaptopMinimalCheck className="w-5 h-5" />
              {isInstalling ? "Opening installer..." : deferredPrompt ? "Install App Now" : "Show Install Steps"}
            </Button>

            {isEmbeddedPreview && (
              <Button
                onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")}
                size="lg"
                variant="outline"
                className="w-full gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Open this page in a new tab
              </Button>
            )}

            {!deferredPrompt && platform === "ios" && (
              <div className="text-left space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Share className="w-4 h-4 text-primary" /> Steps for iPhone/iPad
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Open this app in <strong className="text-foreground">Safari</strong>.</li>
                  <li>2. Tap <strong className="text-foreground">Share</strong> → <strong className="text-foreground">Add to Home Screen</strong>.</li>
                  <li>3. Tap <strong className="text-foreground">Add</strong> to finish install.</li>
                </ol>
              </div>
            )}

            {!deferredPrompt && platform === "android" && (
              <div className="text-left space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" /> Steps for Android
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Tap the <strong className="text-foreground">⋮ menu</strong> in your browser.</li>
                  <li>2. Tap <strong className="text-foreground">Install app</strong>.</li>
                  <li>3. Confirm <strong className="text-foreground">Install</strong>.</li>
                </ol>
              </div>
            )}

            {!deferredPrompt && isDesktop && (
              <div className="text-left space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <LaptopMinimalCheck className="w-4 h-4 text-primary" /> Steps for Desktop
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Click the <strong className="text-foreground">Install icon</strong> in your address bar.</li>
                  <li>2. Confirm <strong className="text-foreground">Install</strong> in the popup dialog.</li>
                </ol>
              </div>
            )}

            <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-left">
              <p className="text-xs font-medium">After install</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• App icon is available on home screen and desktop launcher</li>
                <li>• Opens in standalone app mode, not as a browser tab</li>
                <li>• Reopens quickly from recent apps</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
