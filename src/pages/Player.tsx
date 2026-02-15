import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Users, Copy, ArrowLeft, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // Simulate progress
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

  // Simulate device joining
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/room")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-2">
            <Copy className="w-4 h-4" /> {roomCode}
          </Button>
        </div>

        {/* Sync Status */}
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Wifi className="w-5 h-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-card animate-pulse" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
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

        {/* Now Playing */}
        <Card className="bg-card/50 backdrop-blur-sm border-border overflow-hidden">
          <CardContent className="p-0">
            {/* Album Art Placeholder */}
            <div className="aspect-square bg-gradient-to-br from-primary/30 via-accent/20 to-secondary flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <p className="text-lg font-semibold">Waiting for audio...</p>
                <p className="text-sm text-muted-foreground">Play music from any app on your device</p>
              </div>
            </div>

            {/* Controls */}
            <div className="p-6 space-y-4">
              {/* Song info */}
              <div className="text-center">
                <h2 className="text-xl font-bold">System Audio</h2>
                <p className="text-muted-foreground">All connected devices</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <Slider
                  value={[progress]}
                  onValueChange={(v) => setProgress(v[0])}
                  max={100}
                  step={0.1}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currentTime}</span>
                  <span>{duration}</span>
                </div>
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-center gap-6">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={isMuted ? [0] : volume}
                  onValueChange={(v) => { setVolume(v); setIsMuted(false); }}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Player;
