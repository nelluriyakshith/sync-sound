import { useState, useEffect, useCallback } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Capture the prompt globally so it's available from any component
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    if (!prompt) return "unavailable";

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    globalDeferredPrompt = null;
    setDeferredPrompt(null);
    if (outcome === "accepted") setIsInstalled(true);
    return outcome;
  }, [deferredPrompt]);

  return { install, isInstalled, canInstall: !!(deferredPrompt || globalDeferredPrompt) };
};
