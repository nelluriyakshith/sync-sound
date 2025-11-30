import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2, Share, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('desktop');

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture install prompt
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
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <Download className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Install Sync Sound
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Install our app for the best experience. Works offline and loads instantly from your home screen.
          </p>
        </div>

        {isInstalled ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border mb-8">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">App Installed!</h2>
              <p className="text-muted-foreground mb-6">
                You can now use Sync Sound from your home screen
              </p>
              <Button onClick={() => navigate('/')} size="lg">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Install Button - Android/Desktop */}
            {deferredPrompt && platform !== 'ios' && (
              <Card className="bg-card/50 backdrop-blur-sm border-border mb-8">
                <CardContent className="p-8 text-center">
                  <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Quick Install</h2>
                  <p className="text-muted-foreground mb-6">
                    Install Sync Sound with one click
                  </p>
                  <Button onClick={handleInstallClick} size="lg" className="bg-gradient-to-r from-primary via-[hsl(var(--gradient-via))] to-accent">
                    <Download className="w-5 h-5 mr-2" />
                    Install App
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Manual Instructions */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Installation Instructions</h2>

              {/* iOS Instructions */}
              {platform === 'ios' && (
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                        <Share className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Install on iPhone/iPad</h3>
                        <ol className="space-y-3 text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">1.</span>
                            <span>Tap the <strong>Share button</strong> in Safari (square with arrow pointing up)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">2.</span>
                            <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">3.</span>
                            <span>Tap <strong>"Add"</strong> in the top right corner</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">4.</span>
                            <span>Find the Sync Sound icon on your home screen!</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Android Instructions */}
              {platform === 'android' && !deferredPrompt && (
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                        <MoreVertical className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Install on Android</h3>
                        <ol className="space-y-3 text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">1.</span>
                            <span>Tap the <strong>menu button</strong> (three dots) in your browser</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">2.</span>
                            <span>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">3.</span>
                            <span>Tap <strong>"Install"</strong> or <strong>"Add"</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">4.</span>
                            <span>Launch Sync Sound from your home screen!</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Desktop Instructions */}
              {platform === 'desktop' && !deferredPrompt && (
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                        <Download className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Install on Desktop</h3>
                        <ol className="space-y-3 text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">1.</span>
                            <span>Look for the <strong>install icon</strong> in your browser's address bar</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">2.</span>
                            <span>Click <strong>"Install"</strong> or <strong>"Add"</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">3.</span>
                            <span>The app will be added to your applications</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Why Install?</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Works Offline</strong> - Use the app even without internet</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Faster Loading</strong> - Instant access from your home screen</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Full Screen</strong> - No browser UI taking up space</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Native Feel</strong> - Feels just like a real app</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
