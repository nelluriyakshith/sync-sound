import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Users, Copy, ArrowLeft, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

const Player = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState(1);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration] = useState("3:45");

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { setIsPlaying(false); return 0; }
        const next = prev + 0.44;
        const totalSeconds = Math.floor((next / 100) * 225);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        setCurrentTime(`${mins}:${secs.toString().padStart(2, "0")}`);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const timeout = setTimeout(() => setConnectedDevices(2), 5000);
    return () => clearTimeout(timeout);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode || "");
    toast({ title: "Copied!", description: "Room code copied to clipboard" });
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-12">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/room")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-2 font-mono">
            <Copy className="w-4 h-4" /> {roomCode}
          </Button>
        </div>

        <Card className="glass-card glow-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Wifi className="w-5 h-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-card bg-primary animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium">Synced</p>
                <p className="text-xs text-muted-foreground">Latency: ~12ms</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{connectedDevices} device{connectedDevices > 1 ? "s" : ""}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-square bg-gradient-to-br from-primary/20 via-secondary to-accent/10 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.1)_0%,transparent_70%)]" />
              <div className="text-center relative z-10">
                <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-secondary/80 flex items-center justify-center border border-primary/20 glow-border">
                  <Logo size={56} />
                </div>
                <p className="text-lg font-semibold font-display">Waiting for audio...</p>
                <p className="text-sm text-muted-foreground">Play music from any app on your device</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold font-display">System Audio</h2>
                <p className="text-muted-foreground text-sm">All connected devices</p>
              </div>

              <div className="space-y-2">
                <Slider value={[progress]} onValueChange={(v) => setProgress(v[0])} max={100} step={0.1} className="cursor-pointer" />
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{currentTime}</span>
                  <span>{duration}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 transition-all hover:scale-105"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider value={isMuted ? [0] : volume} onValueChange={(v) => { setVolume(v); setIsMuted(false); }} max={100} step={1} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Player;
