import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, CheckCircle2, Share, MoreVertical, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Install = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) setPlatform('ios');
    else if (/android/.test(userAgent)) setPlatform('android');
    else setPlatform('desktop');

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Auto-trigger install prompt when available
  useEffect(() => {
    if (deferredPrompt && !isInstalled) {
      triggerInstall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredPrompt]);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) {
      toast({ title: "Install not available", description: "Use your browser menu to install this app", variant: "destructive" });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      toast({ title: "App installed!", description: "Find Sync Sound on your home screen" });
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, toast]);

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
                {deferredPrompt
                  ? "Tap below to install instantly!"
                  : platform === 'ios'
                    ? "Follow the steps below to install"
                    : "Use your browser menu to install"}
              </p>
            </div>

            {deferredPrompt && (
              <Button
                onClick={triggerInstall}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-[hsl(var(--gradient-from))] via-[hsl(var(--gradient-via))] to-[hsl(var(--gradient-to))] text-primary-foreground font-display font-semibold"
              >
                <Download className="w-5 h-5" /> Install Now
              </Button>
            )}

            {!deferredPrompt && platform === 'ios' && (
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

            {!deferredPrompt && platform === 'android' && (
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

            {!deferredPrompt && platform === 'desktop' && (
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
