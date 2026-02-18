import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Users, Copy, ArrowLeft, Wifi, Upload, Music, ListMusic, X, CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

/* ─── types ─────────────────────────────────────── */
interface Track {
  id: string;
  name: string;
  artist: string;
  duration: number; // seconds
  url: string;
  isLocal: boolean;
}

interface Device {
  id: string;
  name: string;
  joinedAt: number;
  isHost: boolean;
}

/* ─── helpers ───────────────────────────────────── */
const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const deviceNames = [
  "Galaxy S24", "iPhone 15 Pro", "Pixel 8", "iPad Air",
  "OnePlus 12", "MacBook Pro", "Surface Pro", "Redmi Note 13",
];

const randomName = () => deviceNames[Math.floor(Math.random() * deviceNames.length)];

/* ─── component ─────────────────────────────────── */
const Player = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* playback state */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [currentSec, setCurrentSec] = useState(0);
  const [volume, setVolume] = useState([80]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  /* queue */
  const [queue, setQueue] = useState<Track[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  /* devices */
  const [devices, setDevices] = useState<Device[]>([
    { id: "host", name: "This Device", joinedAt: Date.now(), isHost: true },
  ]);
  const [showDevices, setShowDevices] = useState(false);

  const currentTrack = queue[currentTrackIndex] ?? null;

  /* ── simulate devices joining ── */
  useEffect(() => {
    const t1 = setTimeout(() => {
      setDevices(d => [...d, { id: "d2", name: randomName(), joinedAt: Date.now(), isHost: false }]);
    }, 3500);
    const t2 = setTimeout(() => {
      setDevices(d => [...d, { id: "d3", name: randomName(), joinedAt: Date.now(), isHost: false }]);
    }, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* ── audio element sync ── */
  useEffect(() => {
    if (!currentTrack) return;
    const audio = new Audio(currentTrack.url);
    audio.volume = isMuted ? 0 : volume[0] / 100;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentSec(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    const onEnded = () => handleNext();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    if (isPlaying) audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  /* ── volume ── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
  }, [volume, isMuted]);

  /* ── play/pause ── */
  useEffect(() => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
  }, [isPlaying]);

  const handlePlayPause = () => setIsPlaying(p => !p);

  const handleNext = useCallback(() => {
    setProgress(0);
    setCurrentSec(0);
    setCurrentTrackIndex(i => (i + 1) % Math.max(queue.length, 1));
  }, [queue.length]);

  const handlePrev = useCallback(() => {
    setProgress(0);
    setCurrentSec(0);
    setCurrentTrackIndex(i => (i - 1 + Math.max(queue.length, 1)) % Math.max(queue.length, 1));
  }, [queue.length]);

  const handleSeek = (v: number[]) => {
    if (!audioRef.current || !currentTrack) return;
    const t = (v[0] / 100) * audioRef.current.duration;
    audioRef.current.currentTime = t;
    setProgress(v[0]);
    setCurrentSec(t);
  };

  /* ── local file upload ── */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newTracks: Track[] = files
      .filter(f => f.type.startsWith("audio/"))
      .map(f => {
        const url = URL.createObjectURL(f);
        const name = f.name.replace(/\.[^.]+$/, "");
        const parts = name.split(" - ");
        return {
          id: `${f.name}-${f.lastModified}`,
          name: parts[1] ?? name,
          artist: parts[0] ?? "Unknown Artist",
          duration: 0,
          url,
          isLocal: true,
        };
      });

    if (!newTracks.length) {
      toast({ title: "No audio files", description: "Please select valid audio files", variant: "destructive" });
      return;
    }

    setQueue(q => {
      const merged = [...q, ...newTracks];
      if (q.length === 0) setCurrentTrackIndex(0);
      return merged;
    });

    toast({ title: `${newTracks.length} track${newTracks.length > 1 ? "s" : ""} added`, description: "Added to queue" });
    e.target.value = "";
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode ?? "");
    toast({ title: "Copied!", description: "Room code copied to clipboard" });
  };

  const removeTrack = (id: string) => {
    setQueue(q => {
      const idx = q.findIndex(t => t.id === id);
      const newQ = q.filter(t => t.id !== id);
      if (idx <= currentTrackIndex && currentTrackIndex > 0) setCurrentTrackIndex(i => i - 1);
      return newQ;
    });
  };

  /* ─── render ─────────────────────────────────── */
  return (
    <div className="min-h-screen pt-16 pb-12 bg-background">
      {/* Top bar */}
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-2xl mx-auto flex items-center justify-between h-12 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/room")} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              LIVE
            </span>
            <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-1.5 font-mono text-xs h-7 px-2">
              <Copy className="w-3 h-3" /> {roomCode}
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 pt-6 space-y-4">

        {/* ── Album art / now playing ── */}
        <div className="glass-card rounded-2xl overflow-hidden glow-border">
          {/* Art */}
          <div className="relative bg-gradient-to-br from-[hsl(var(--gradient-from)/0.3)] via-secondary to-[hsl(var(--gradient-to)/0.2)] aspect-square max-h-72 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15)_0%,transparent_70%)]" />
            {currentTrack ? (
              <div className="relative z-10 text-center space-y-3 p-8">
                <div className="w-28 h-28 mx-auto rounded-full glass-card flex items-center justify-center glow-border">
                  <Music className="w-12 h-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display truncate max-w-xs">{currentTrack.name}</h2>
                  <p className="text-sm text-muted-foreground">{currentTrack.artist}</p>
                </div>
                {currentTrack.isLocal && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary rounded-full px-2.5 py-1">
                    <CheckCircle2 className="w-3 h-3" /> Offline
                  </span>
                )}
              </div>
            ) : (
              <div className="relative z-10 text-center space-y-4 p-8">
                <div className="w-28 h-28 mx-auto rounded-full glass-card flex items-center justify-center glow-border">
                  <Logo size={56} />
                </div>
                <div>
                  <p className="text-lg font-semibold font-display">No track loaded</p>
                  <p className="text-sm text-muted-foreground">Upload local files to start listening</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-5 space-y-4">
            {/* Progress */}
            <div className="space-y-1.5">
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="cursor-pointer"
                disabled={!currentTrack}
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{formatTime(currentSec)}</span>
                <span>{currentTrack ? formatTime(audioRef.current?.duration ?? 0) : "0:00"}</span>
              </div>
            </div>

            {/* Playback buttons */}
            <div className="flex items-center justify-center gap-6">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="text-muted-foreground hover:text-foreground" disabled={!currentTrack}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                disabled={!currentTrack}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 hover:scale-105 transition-all"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNext} className="text-muted-foreground hover:text-foreground" disabled={!currentTrack}>
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsMuted(m => !m)}>
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
        </div>

        {/* ── Row: Upload + Devices + Queue ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Upload */}
          <label className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer border border-border/50 hover:border-primary/40 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-center">Add Music</span>
            <span className="text-[10px] text-muted-foreground text-center">Local files</span>
            <input type="file" accept="audio/*" multiple className="hidden" onChange={handleFileUpload} />
          </label>

          {/* Devices */}
          <button
            onClick={() => { setShowDevices(d => !d); setShowQueue(false); }}
            className={`glass-card rounded-xl p-4 flex flex-col items-center gap-2 border transition-colors ${showDevices ? "border-primary/50 glow-border" : "border-border/50 hover:border-primary/40"}`}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
              <Users className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {devices.length}
              </span>
            </div>
            <span className="text-xs font-medium">Devices</span>
            <span className="text-[10px] text-muted-foreground">{devices.length} connected</span>
          </button>

          {/* Queue */}
          <button
            onClick={() => { setShowQueue(q => !q); setShowDevices(false); }}
            className={`glass-card rounded-xl p-4 flex flex-col items-center gap-2 border transition-colors ${showQueue ? "border-primary/50 glow-border" : "border-border/50 hover:border-primary/40"}`}
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center relative">
              <ListMusic className="w-5 h-5 text-accent" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
                {queue.length}
              </span>
            </div>
            <span className="text-xs font-medium">Queue</span>
            <span className="text-[10px] text-muted-foreground">{queue.length} tracks</span>
          </button>
        </div>

        {/* ── Devices panel ── */}
        {showDevices && (
          <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h3 className="font-semibold font-display text-sm flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" /> Connected Devices
              </h3>
              <span className="text-xs text-muted-foreground">{devices.length} online</span>
            </div>
            <div className="divide-y divide-border/30">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold font-display text-foreground">
                      {device.name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{device.name}</p>
                    <p className="text-xs text-muted-foreground">{device.isHost ? "Host · This device" : "Listener"}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-primary font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Synced
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Queue panel ── */}
        {showQueue && (
          <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h3 className="font-semibold font-display text-sm flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-accent" /> Queue
              </h3>
              {queue.length === 0 && (
                <span className="text-xs text-muted-foreground">Upload files to add tracks</span>
              )}
            </div>
            {queue.length === 0 ? (
              <div className="py-10 text-center">
                <Music className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tracks yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Tap "Add Music" to load local files</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30 max-h-72 overflow-y-auto">
                {queue.map((track, idx) => (
                  <div
                    key={track.id}
                    onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); setProgress(0); setCurrentSec(0); }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      idx === currentTrackIndex ? "bg-primary/10" : "hover:bg-secondary/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      {idx === currentTrackIndex && isPlaying ? (
                        <span className="flex gap-0.5 items-end h-4">
                          {[1, 2, 3].map(i => (
                            <span key={i} className="w-1 rounded-full bg-primary animate-bounce" style={{ height: `${40 + i * 20}%`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${idx === currentTrackIndex ? "text-primary" : ""}`}>{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Sync status bar ── */}
        <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Wifi className="w-4 h-4 text-primary" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary border border-card animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-medium">Synced · ~12ms latency</p>
              <p className="text-[10px] text-muted-foreground">Room: {roomCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{devices.length} device{devices.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Player;
