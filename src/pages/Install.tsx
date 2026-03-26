import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, CheckCircle2, Share, Smartphone, LaptopMinimalCheck, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePwaInstall } from "@/hooks/usePwaInstall";

type InstallPlatform = "ios" | "android" | "desktop";

const Install = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { install, isInstalled, canInstall } = usePwaInstall();

  const platform: InstallPlatform = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "desktop";
  }, []);

  const isEmbedded = useMemo(() => {
    try { return window.self !== window.top; } catch { return true; }
  }, []);

  const handleInstall = async () => {
    const result = await install();
    if (result === "accepted") {
      toast({ title: "Installed!", description: "Sync Sound is now on your home screen." });
    } else if (result === "dismissed") {
      toast({ title: "Cancelled", description: "You can install anytime.", variant: "destructive" });
    } else {
      // No prompt available — show platform instructions
      if (platform === "ios") {
        toast({ title: "Install from Safari", description: "Tap Share → Add to Home Screen." });
      } else {
        toast({
          title: "Install from browser",
          description: platform === "desktop"
            ? "Click the install icon (⊕) in the address bar."
            : "Open browser menu (⋮) → Install app.",
        });
      }
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen pt-20 px-4 pb-12 flex items-center justify-center">
        <Card className="glass-card glow-border w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-display mb-2">App Installed!</h2>
            <p className="text-muted-foreground mb-6">Sync Sound is on your home screen and recent apps.</p>
            <Button onClick={() => navigate("/")} size="lg" className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground">
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
                {canInstall
                  ? "Tap below to install instantly — the app icon will appear on your home screen / desktop."
                  : platform === "ios"
                    ? "Follow 3 quick steps to add to your home screen."
                    : "Use your browser to install the app."}
              </p>
            </div>

            <Button onClick={handleInstall} size="lg" className="w-full gap-2 bg-gradient-to-r from-[hsl(var(--gradient-from))] via-[hsl(var(--gradient-via))] to-[hsl(var(--gradient-to))] text-primary-foreground font-display font-semibold">
              <Download className="w-5 h-5" />
              {canInstall ? "Install Now" : "How to Install"}
            </Button>

            {isEmbedded && (
              <Button onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")} size="lg" variant="outline" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" /> Open in browser to install
              </Button>
            )}

            {!canInstall && platform === "ios" && (
              <div className="text-left space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2"><Share className="w-4 h-4 text-primary" /> iPhone / iPad</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Open in <strong className="text-foreground">Safari</strong></li>
                  <li>2. Tap <strong className="text-foreground">Share</strong> → <strong className="text-foreground">Add to Home Screen</strong></li>
                  <li>3. Tap <strong className="text-foreground">Add</strong></li>
                </ol>
              </div>
            )}

            {!canInstall && platform === "android" && (
              <div className="text-left space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" /> Android</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Tap <strong className="text-foreground">⋮ menu</strong></li>
                  <li>2. Tap <strong className="text-foreground">Install app</strong></li>
                  <li>3. Confirm <strong className="text-foreground">Install</strong></li>
                </ol>
              </div>
            )}

            {!canInstall && platform === "desktop" && (
              <div className="text-left space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2"><LaptopMinimalCheck className="w-4 h-4 text-primary" /> Desktop</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Click the <strong className="text-foreground">install icon (⊕)</strong> in the address bar</li>
                  <li>2. Click <strong className="text-foreground">Install</strong></li>
                </ol>
              </div>
            )}

            <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-left">
              <p className="text-xs font-medium">After install</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• App icon appears on home screen / desktop</li>
                <li>• Opens in full-screen app mode (no browser bar)</li>
                <li>• Available in recent apps for quick access</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">Back to Home</Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
