import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Volume2, Wifi, Palette, Info } from "lucide-react";

const SettingsPage = () => {
  const [nickname, setNickname] = useState("My Device");
  const [autoConnect, setAutoConnect] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

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
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="My Device" className="bg-secondary/50" />
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
                <p className="text-sm text-muted-foreground">Uses more bandwidth</p>
              </div>
              <Switch checked={highQuality} onCheckedChange={setHighQuality} />
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
              <Switch checked={autoConnect} onCheckedChange={setAutoConnect} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Alert when devices connect</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
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
                <p className="text-sm text-muted-foreground">Always on in this version</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
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
