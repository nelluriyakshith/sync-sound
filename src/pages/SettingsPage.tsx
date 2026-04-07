import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Volume2, Wifi, Palette, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppSettings, loadAppSettings, saveAppSettings } from "@/lib/app-settings";

const SettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [savedSettings, setSavedSettings] = useState<AppSettings>(() => loadAppSettings());
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(savedSettings) !== JSON.stringify(settings),
    [savedSettings, settings]
  );

  const handleSave = async () => {
    const nextSettings: AppSettings = {
      ...settings,
      nickname: settings.nickname.trim() || savedSettings.nickname,
    };

    setSaving(true);

    try {
      saveAppSettings(nextSettings);
      setSettings(nextSettings);
      setSavedSettings(nextSettings);

      if (user) {
        const { error } = await supabase
          .from("room_members")
          .update({
            device_name: nextSettings.nickname,
            last_seen: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("is_online", true);

        if (error) {
          toast({
            title: "Saved on this device",
            description: "Your new device name will appear the next time you join a room.",
          });
          return;
        }
      }

      toast({
        title: "Settings saved",
        description: "Your device name and room preferences have been updated.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-12">
      <div className="container max-w-lg mx-auto space-y-5">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-2xl glass-card glow-border">
              <Settings className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 font-display">Settings</h1>
          <p className="text-muted-foreground">Customize your Sync Sound experience</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <User className="w-5 h-5 text-primary" /> Device Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Device Nickname</label>
              <Input
                value={settings.nickname}
                onChange={(e) => setSettings((current) => ({ ...current, nickname: e.target.value }))}
                placeholder="My Device"
                className="bg-secondary/50"
              />
              <p className="mt-2 text-xs text-muted-foreground">This saved name is what other devices will see in your room.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Volume2 className="w-5 h-5 text-accent" /> Audio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">High Quality Audio</p>
                <p className="text-sm text-muted-foreground">Saved on this device and used when supported</p>
              </div>
              <Switch checked={settings.highQuality} onCheckedChange={(checked) => setSettings((current) => ({ ...current, highQuality: checked }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Wifi className="w-5 h-5 text-primary" /> Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Reconnect</p>
                <p className="text-sm text-muted-foreground">Rejoin last room automatically</p>
              </div>
              <Switch checked={settings.autoConnect} onCheckedChange={(checked) => setSettings((current) => ({ ...current, autoConnect: checked }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Alert when devices connect</p>
              </div>
              <Switch checked={settings.notifications} onCheckedChange={(checked) => setSettings((current) => ({ ...current, notifications: checked }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Palette className="w-5 h-5 text-accent" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Preference saved on this device</p>
              </div>
              <Switch checked={settings.darkMode} onCheckedChange={(checked) => setSettings((current) => ({ ...current, darkMode: checked }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card glow-border">
          <CardContent className="pt-6 space-y-3">
            <Button onClick={handleSave} disabled={!hasChanges || saving} className="w-full font-display font-semibold" size="lg">
              {saving ? "Saving..." : hasChanges ? "Save Settings" : "Settings Saved"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">Save after changing the device name so the same name shows in your room.</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Info className="w-5 h-5 text-primary" /> About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Sync Sound v1.0.0</p>
            <p>Synchronized audio playback across devices</p>
            <p>© 2026 Sync Sound. All rights reserved.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
