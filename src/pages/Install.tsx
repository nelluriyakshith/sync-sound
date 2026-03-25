import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, CheckCircle2, Share, MoreVertical, Smartphone, FolderDown, LaptopMinimalCheck } from "lucide-react";
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

  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      excludeAcceptAllOption?: boolean;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<{
      createWritable: () => Promise<{
        write: (data: string) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  }
}

const Install = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("desktop");
  const [isSavingShortcut, setIsSavingShortcut] = useState(false);

  const canChooseSaveLocation = useMemo(() => typeof window.showSaveFilePicker === "function", []);
  const isDesktop = platform === "desktop";

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) setPlatform("ios");
    else if (/android/.test(userAgent)) setPlatform("android");
    else setPlatform("desktop");

    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) {
      toast({ title: "Install not available", description: "Use your browser menu to install this app", variant: "destructive" });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      toast({ title: "Installed!", description: "Sync Sound is now on your home screen and in recent apps" });
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, toast]);

  const saveDesktopShortcut = useCallback(async () => {
    if (!isDesktop) return;

    setIsSavingShortcut(true);
    const shortcutContents = `[InternetShortcut]\nURL=${window.location.origin}\nIconFile=${window.location.origin}/pwa-192x192.png\nIconIndex=0\n`;

    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: "Sync Sound.url",
          types: [{
            description: "Web shortcut",
            accept: {
              "application/internet-shortcut": [".url"],
              "text/plain": [".url"],
            },
          }],
        });

        const writable = await handle.createWritable();
        await writable.write(shortcutContents);
        await writable.close();
      } else {
        const blob = new Blob([shortcutContents], { type: "text/plain" });
        const href = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.download = "Sync Sound.url";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(href);
      }

      toast({
        title: "Shortcut downloaded",
        description: "Open the saved file to launch Sync Sound quickly from your desktop",
      });
    } catch {
      toast({
        title: "Download cancelled",
        description: "No changes were made",
        variant: "destructive",
      });
    } finally {
      setIsSavingShortcut(false);
    }
  }, [isDesktop, toast]);

  if (isInstalled) {
    return (
      <div className="min-h-screen pt-20 px-4 pb-12 flex items-center justify-center">
        <Card className="glass-card glow-border w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-display mb-2">App Installed!</h2>
            <p className="text-muted-foreground mb-6">
              You can now use Sync Sound from your home screen
            </p>
            <Button onClick={() => navigate('/')} size="lg" className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground">
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
                {isDesktop
                  ? "Save a quick-launch shortcut or install the full app in one click"
                  : deferredPrompt
                    ? "Tap once to install instantly"
                    : platform === "ios"
                      ? "Follow the simple iPhone steps below"
                      : "Use your browser menu to install"}
              </p>
            </div>

            {isDesktop && (
              <div className="space-y-3">
                <Button
                  onClick={saveDesktopShortcut}
                  size="lg"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isSavingShortcut}
                >
                  <FolderDown className="w-5 h-5" />
                  {isSavingShortcut ? "Opening save dialog..." : canChooseSaveLocation ? "Choose save location" : "Download shortcut"}
                </Button>

                {deferredPrompt && (
                  <Button
                    onClick={triggerInstall}
                    size="lg"
                    className="w-full gap-2 bg-gradient-to-r from-[hsl(var(--gradient-from))] via-[hsl(var(--gradient-via))] to-[hsl(var(--gradient-to))] text-primary-foreground font-display font-semibold"
                  >
                    <LaptopMinimalCheck className="w-5 h-5" /> Install Desktop App
                  </Button>
                )}
              </div>
            )}

            {!isDesktop && deferredPrompt && (
              <Button
                onClick={triggerInstall}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-[hsl(var(--gradient-from))] via-[hsl(var(--gradient-via))] to-[hsl(var(--gradient-to))] text-primary-foreground font-display font-semibold"
              >
                <Download className="w-5 h-5" /> Install Now
              </Button>
            )}

            {!deferredPrompt && platform === "ios" && (
              <div className="text-left space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Share className="w-4 h-4 text-primary" /> Steps for iPhone/iPad
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Tap the <strong className="text-foreground">Share button</strong> in Safari</li>
                  <li>2. Scroll down → <strong className="text-foreground">"Add to Home Screen"</strong></li>
                  <li>3. Tap <strong className="text-foreground">"Add"</strong></li>
                </ol>
              </div>
            )}

            {!deferredPrompt && platform === "android" && (
              <div className="text-left space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" /> Steps for Android
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Tap the <strong className="text-foreground">⋮ menu</strong> in your browser</li>
                  <li>2. Select <strong className="text-foreground">"Install app"</strong> or <strong className="text-foreground">"Add to Home Screen"</strong></li>
                  <li>3. Tap <strong className="text-foreground">"Install"</strong></li>
                </ol>
              </div>
            )}

            {!deferredPrompt && platform === "desktop" && !canChooseSaveLocation && (
              <div className="text-left space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <MoreVertical className="w-4 h-4 text-primary" /> Steps for Desktop
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Look for the <strong className="text-foreground">install icon</strong> in the address bar</li>
                  <li>2. Click <strong className="text-foreground">"Install"</strong></li>
                </ol>
              </div>
            )}

            <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-left">
              <p className="text-xs font-medium">Quick access after install</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Home-screen icon appears automatically after install</li>
                <li>• App opens in standalone mode and shows in recent apps</li>
                <li>• Reopen quickly without returning to the browser tab</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
