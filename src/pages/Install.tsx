import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, CheckCircle2, Share, Smartphone, LaptopMinimalCheck, ExternalLink, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePwaInstall } from "@/hooks/usePwaInstall";

type InstallPlatform = "ios" | "android" | "desktop";
type BrowserKind = "chrome" | "edge" | "safari" | "firefox" | "other";

const Install = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { install, isInstalled, canInstall } = usePwaInstall();
  const [showVideo, setShowVideo] = useState(false);

  const platform: InstallPlatform = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "desktop";
  }, []);

  const browser: BrowserKind = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("edg/")) return "edge";
    if (ua.includes("chrome/") && !ua.includes("edg/") && !ua.includes("opr/") && !ua.includes("samsungbrowser/")) return "chrome";
    if (ua.includes("safari/") && !ua.includes("chrome/")) return "safari";
    if (ua.includes("firefox/")) return "firefox";
    return "other";
  }, []);

  const isEmbedded = useMemo(() => {
    try { return window.self !== window.top; } catch { return true; }
  }, []);

  const isPreviewHost = useMemo(
    () => /id-preview--|lovableproject\.com/.test(window.location.hostname),
    []
  );

  const isInstallBlockedContext = isEmbedded || isPreviewHost;

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
            ? "Use browser menu: Chrome/Edge → ⋮ menu → Install app."
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
                    : "Use your browser menu to install the app (address-bar icon may not appear)."}
              </p>
            </div>

            <Button onClick={handleInstall} size="lg" className="w-full gap-2 bg-gradient-to-r from-[hsl(var(--gradient-from))] via-[hsl(var(--gradient-via))] to-[hsl(var(--gradient-to))] text-primary-foreground font-display font-semibold">
              <Download className="w-5 h-5" />
              {canInstall ? "Install Now" : "How to Install"}
            </Button>

            <Button onClick={() => setShowVideo(!showVideo)} size="lg" variant="secondary" className="w-full gap-2">
              <Play className="w-5 h-5" />
              {showVideo ? "Hide" : "Watch"} Install Tutorial
            </Button>

            {showVideo && (
              <div className="rounded-xl overflow-hidden border border-border/60">
                <video
                  src="/install-tutorial.mp4"
                  controls
                  autoPlay
                  playsInline
                  muted
                  className="w-full"
                  style={{ maxHeight: 480 }}
                />
              </div>
            )}

            {isInstallBlockedContext && (
              <Button onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")} size="lg" variant="outline" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" /> Open full page for install
              </Button>
            )}

            {isPreviewHost && !canInstall && (
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-left">
                <p className="text-xs font-medium">Install note</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Install prompt may be blocked in preview. Open your published app URL in a normal browser tab, then use browser menu install.
                </p>
              </div>
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
                  {(browser === "chrome" || browser === "edge") && (
                    <>
                      <li>1. Click <strong className="text-foreground">⋮ menu</strong> in the browser</li>
                      <li>2. Click <strong className="text-foreground">Install app</strong> (or Apps → Install this site)</li>
                      <li>3. Confirm <strong className="text-foreground">Install</strong></li>
                    </>
                  )}
                  {browser === "safari" && (
                    <>
                      <li>1. In Safari, open <strong className="text-foreground">File menu</strong></li>
                      <li>2. Click <strong className="text-foreground">Add to Dock</strong></li>
                    </>
                  )}
                  {browser === "firefox" && (
                    <>
                      <li>1. Firefox desktop does not support full app install prompt</li>
                      <li>2. Open this app in <strong className="text-foreground">Chrome or Edge</strong></li>
                      <li>3. Use <strong className="text-foreground">⋮ menu → Install app</strong></li>
                    </>
                  )}
                  {browser === "other" && (
                    <>
                      <li>1. Open this app in <strong className="text-foreground">Chrome or Edge</strong></li>
                      <li>2. Use <strong className="text-foreground">⋮ menu → Install app</strong></li>
                    </>
                  )}
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
