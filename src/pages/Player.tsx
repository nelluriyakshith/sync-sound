import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Users, Copy, ArrowLeft, Wifi, Upload, Music, ListMusic, X, CheckCircle2, Youtube,
  Shield, UserMinus, VolumeOff, Volume1, ShieldPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import YouTubePlayer from "@/components/player/YouTubePlayer";
import YouTubeEmbed from "@/components/player/YouTubeEmbed";

/* ─── types ─────────────────────────────────── */
interface Track {
  id: string;
  name: string;
  artist: string;
  duration: number;
  url: string;
  isLocal: boolean;
  youtubeId?: string;
  dbId?: string; // room_queue row id
  position?: number;
  addedBy?: string;
}

interface RoomMember {
  id: string;
  user_id: string;
  device_name: string;
  role: string;
  is_muted: boolean;
  is_online: boolean;
  joined_at: string;
  last_seen: string;
}

/* ─── helpers ───────────────────────────────── */
const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const getDeviceName = () => {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) {
    const buildMatch = ua.match(/;\s*([^;)]+)\s*Build/);
    if (buildMatch) return buildMatch[1].trim();
    const androidMatch = ua.match(/Android[^;]*;\s*([^;)]+)/);
    if (androidMatch) return androidMatch[1].trim();
    return "Android Device";
  }
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/CrOS/.test(ua)) return "Chromebook";
  if (/Linux/.test(ua)) return "Linux PC";
  if (/Chrome/.test(ua)) return "Chrome Browser";
  if (/Firefox/.test(ua)) return "Firefox Browser";
  if (/Safari/.test(ua)) return "Safari Browser";
  return "Device";
};

const dedupeMembers = (memberList: RoomMember[]) => {
  const byUser = new Map<string, RoomMember>();
  memberList.forEach((member) => {
    const existing = byUser.get(member.user_id);
    if (!existing) {
      byUser.set(member.user_id, member);
      return;
    }

    if (member.is_online !== existing.is_online) {
      byUser.set(member.user_id, member.is_online ? member : existing);
      return;
    }

    const existingTs = new Date(existing.last_seen || existing.joined_at).getTime();
    const memberTs = new Date(member.last_seen || member.joined_at).getTime();
    byUser.set(member.user_id, memberTs >= existingTs ? member : existing);
  });

  return Array.from(byUser.values());
};

/* ─── component ─────────────────────────────── */
const Player = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  /* playback state */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSec, setCurrentSec] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [volume, setVolume] = useState([80]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [ytSeekTo, setYtSeekTo] = useState<number | null>(null);

  /* queue */
  const [queue, setQueue] = useState<Track[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);

  /* room & devices */
  const [roomId, setRoomId] = useState<string | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDevices, setShowDevices] = useState(false);

  /* flag to prevent echo when we ourselves update playback state */
  const isLocalUpdate = useRef(false);

  const currentTrack = queue[currentTrackIndex] ?? null;
  const isYouTube = !!currentTrack?.youtubeId;
  const onlineMembers = members.filter(m => m.is_online);

  /* ── Load room, members, queue, and playback state ── */
  useEffect(() => {
    if (!roomCode || !user) return;

    const loadRoom = async () => {
      const { data: room } = await supabase
        .from("rooms")
        .select("id, created_by")
        .eq("code", roomCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!room) {
        toast({ title: "Room not found", variant: "destructive" });
        navigate("/room");
        return;
      }

      setRoomId(room.id);

      // Ensure user is an online member when entering player (important for cross-device sync)
      const { data: existingMember } = await supabase
        .from("room_members")
        .select("id, role")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        const { error: memberUpdateError } = await supabase
          .from("room_members")
          .update({
            is_online: true,
            device_name: getDeviceName(),
            last_seen: new Date().toISOString(),
          })
          .eq("id", existingMember.id);

        if (memberUpdateError) {
          toast({ title: "Sync warning", description: memberUpdateError.message, variant: "destructive" });
        }
      } else {
        const { error: memberInsertError } = await supabase
          .from("room_members")
          .insert({
            room_id: room.id,
            user_id: user.id,
            device_name: getDeviceName(),
            role: room.created_by === user.id ? "admin" : "member",
            is_online: true,
            last_seen: new Date().toISOString(),
          });

        if (memberInsertError) {
          toast({ title: "Sync warning", description: memberInsertError.message, variant: "destructive" });
        }
      }

      setIsAdmin(room.created_by === user.id || existingMember?.role === "admin");

      // Load members
      const { data: mems } = await supabase
        .from("room_members")
        .select("*")
        .eq("room_id", room.id);
      if (mems) setMembers(dedupeMembers(mems as RoomMember[]));

      // Load queue
      const { data: queueData } = await supabase
        .from("room_queue")
        .select("*")
        .eq("room_id", room.id)
        .order("position", { ascending: true });

      if (queueData && queueData.length > 0) {
        setQueue(queueData.map((q: any) => ({
          id: q.track_id || `track-${q.id}`,
          name: q.name,
          artist: q.artist,
          url: q.url,
          isLocal: q.is_local,
          youtubeId: q.youtube_id || undefined,
          duration: 0,
          dbId: q.id,
          position: q.position,
          addedBy: q.added_by,
        })));
      }

      // Load playback state
      const { data: ps } = await supabase
        .from("room_playback_state")
        .select("*")
        .eq("room_id", room.id)
        .maybeSingle();

      if (ps) {
        setCurrentTrackIndex(ps.current_track_index);
        setIsPlaying(ps.is_playing);
        if (ps.current_time_seconds > 0) {
          setCurrentSec(ps.current_time_seconds);
          setYtSeekTo(ps.current_time_seconds);
        }
      }
    };

    loadRoom();
  }, [roomCode, user, navigate, toast]);

  /* ── Real-time subscription for members ── */
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMember = payload.new as RoomMember;
            setMembers(prev => dedupeMembers([...prev, newMember]));
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as RoomMember;
            setMembers(prev => dedupeMembers([...prev.filter(m => m.id !== updated.id), updated]));
            // Check if current user got promoted
            if (updated.user_id === user?.id && updated.role === "admin") {
              setIsAdmin(true);
            }
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setMembers(prev => dedupeMembers(prev.filter(m => m.id !== old.id)));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, user]);

  /* ── Real-time subscription for queue ── */
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-queue-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_queue", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const q = payload.new as any;
            const newTrack: Track = {
              id: q.track_id || `track-${q.id}`,
              name: q.name,
              artist: q.artist,
              url: q.url,
              isLocal: q.is_local,
              youtubeId: q.youtube_id || undefined,
              duration: 0,
              dbId: q.id,
              position: q.position,
              addedBy: q.added_by,
            };
            setQueue(prev => {
              if (prev.find(t => t.dbId === q.id)) return prev;
              return [...prev, newTrack].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            });
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setQueue(prev => {
              const nextQueue = prev.filter(t => t.dbId !== old.id);
              setCurrentTrackIndex(prevIndex => Math.max(0, Math.min(prevIndex, Math.max(0, nextQueue.length - 1))));
              if (nextQueue.length === 0) {
                setIsPlaying(false);
                setProgress(0);
                setCurrentSec(0);
                setTotalDuration(0);
              }
              return nextQueue;
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  /* ── Real-time subscription for playback state ── */
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-playback-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_playback_state", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (isLocalUpdate.current) {
            isLocalUpdate.current = false;
            return;
          }
          const ps = payload.new as any;
          if (ps.updated_by === user?.id) return; // ignore own updates
          setCurrentTrackIndex(ps.current_track_index);
          setIsPlaying(ps.is_playing);
          if (ps.current_time_seconds > 0) {
            setCurrentSec(ps.current_time_seconds);
            setYtSeekTo(ps.current_time_seconds);
            if (audioRef.current) {
              audioRef.current.currentTime = ps.current_time_seconds;
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, user]);

  /* ── Sync playback state to DB ── */
  const syncPlaybackState = useCallback(async (overrides?: { is_playing?: boolean; current_track_index?: number; current_time_seconds?: number }) => {
    if (!roomId || !user) return;
    const data = {
      room_id: roomId,
      is_playing: overrides?.is_playing ?? isPlaying,
      current_track_index: overrides?.current_track_index ?? currentTrackIndex,
      current_time_seconds: overrides?.current_time_seconds ?? currentSec,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };
    isLocalUpdate.current = true;
    await supabase
      .from("room_playback_state")
      .upsert(data, { onConflict: "room_id" });
  }, [roomId, user, isPlaying, currentTrackIndex, currentSec]);

  /* ── Mark offline on unmount ── */
  useEffect(() => {
    if (!roomId || !user) return;
    return () => {
      supabase
        .from("room_members")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .then();
    };
  }, [roomId, user]);

  /* ── Admin actions ── */
  const handleKick = async (memberId: string) => {
    if (!isAdmin) return;
    const { error } = await supabase.from("room_members").delete().eq("id", memberId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "User removed" });
  };

  const handleToggleMute = async (memberId: string, currentMuted: boolean) => {
    if (!isAdmin) return;
    const { error } = await supabase.from("room_members").update({ is_muted: !currentMuted }).eq("id", memberId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const handlePromoteToAdmin = async (memberId: string) => {
    if (!isAdmin) return;
    const { error } = await supabase.from("room_members").update({ role: "admin" }).eq("id", memberId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Promoted to Admin" });
  };

  /* ── audio element sync (local tracks only) ── */
  useEffect(() => {
    if (!currentTrack || isYouTube) return;
    const audio = new Audio(currentTrack.url);
    audio.volume = isMuted ? 0 : volume[0] / 100;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentSec(audio.currentTime);
      setTotalDuration(audio.duration || 0);
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

  /* ── volume (local) ── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
  }, [volume, isMuted]);

  /* ── play/pause (local) ── */
  useEffect(() => {
    if (!audioRef.current || isYouTube) return;
    isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
  }, [isPlaying, isYouTube]);

  const handlePlayPause = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    if (!currentTrack?.isLocal) {
      syncPlaybackState({ is_playing: next, current_time_seconds: currentSec });
    }
  };

  const handleNext = useCallback(() => {
    setProgress(0); setCurrentSec(0); setTotalDuration(0);
    const nextIdx = (currentTrackIndex + 1) % Math.max(queue.length, 1);
    setCurrentTrackIndex(nextIdx);
    if (!queue[nextIdx]?.isLocal) {
      syncPlaybackState({ current_track_index: nextIdx, current_time_seconds: 0, is_playing: true });
    }
  }, [queue, currentTrackIndex, syncPlaybackState]);

  const handlePrev = useCallback(() => {
    setProgress(0); setCurrentSec(0); setTotalDuration(0);
    const prevIdx = (currentTrackIndex - 1 + Math.max(queue.length, 1)) % Math.max(queue.length, 1);
    setCurrentTrackIndex(prevIdx);
    if (!queue[prevIdx]?.isLocal) {
      syncPlaybackState({ current_track_index: prevIdx, current_time_seconds: 0, is_playing: true });
    }
  }, [queue, currentTrackIndex, syncPlaybackState]);

  const handleSeek = (v: number[]) => {
    if (isYouTube && totalDuration) {
      const t = (v[0] / 100) * totalDuration;
      setYtSeekTo(t); setProgress(v[0]); setCurrentSec(t);
      syncPlaybackState({ current_time_seconds: t });
    } else if (audioRef.current && currentTrack) {
      const t = (v[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = t; setProgress(v[0]); setCurrentSec(t);
      if (!currentTrack.isLocal) {
        syncPlaybackState({ current_time_seconds: t });
      }
    }
  };

  /* ── YouTube callbacks ── */
  const handleYtTimeUpdate = useCallback((ct: number, dur: number) => {
    setCurrentSec(ct); setTotalDuration(dur);
    setProgress(dur ? (ct / dur) * 100 : 0);
  }, []);

  const handleYtReady = useCallback((dur: number) => { setTotalDuration(dur); }, []);

  /* ── local file upload ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !roomId || !user) return;
    const newTracks: Track[] = files
      .filter(f => f.type.startsWith("audio/"))
      .map(f => {
        const url = URL.createObjectURL(f);
        const name = f.name.replace(/\.[^.]+$/, "");
        const parts = name.split(" - ");
        return { id: `${f.name}-${f.lastModified}`, name: parts[1] ?? name, artist: parts[0] ?? "Unknown Artist", duration: 0, url, isLocal: true };
      });
    if (!newTracks.length) {
      toast({ title: "No audio files", description: "Please select valid audio files", variant: "destructive" });
      return;
    }

    // Add metadata to DB so other devices can see the queue entry.
    // Playback for local files remains device-only.
    for (let i = 0; i < newTracks.length; i++) {
      const t = newTracks[i];
      const { data, error } = await supabase
        .from("room_queue")
        .insert({
          room_id: roomId,
          track_id: t.id,
          name: t.name,
          artist: t.artist,
          url: "",
          is_local: true,
          position: queue.length + i,
          added_by: user.id,
        })
        .select()
        .single();
      if (error) {
        toast({ title: "Failed to add track", description: error.message, variant: "destructive" });
        continue;
      }
      if (data) t.dbId = data.id;
    }

    toast({ title: `${newTracks.length} track${newTracks.length > 1 ? "s" : ""} added` });
    e.target.value = "";
  };

  /* ── YouTube track add ── */
  const handleYoutubeAdd = async (track: { id: string; name: string; artist: string; url: string; youtubeId: string }) => {
    if (!roomId || !user) return;
    const { data, error } = await supabase
      .from("room_queue")
      .insert({
        room_id: roomId,
        track_id: track.id,
        name: track.name,
        artist: track.artist,
        url: track.url,
        youtube_id: track.youtubeId,
        is_local: false,
        position: queue.length,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to add YouTube track", description: error.message, variant: "destructive" });
      return;
    }

    if (data && queue.length === 0) {
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      syncPlaybackState({ is_playing: true, current_track_index: 0, current_time_seconds: 0 });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode ?? "");
    toast({ title: "Copied!", description: "Room code copied to clipboard" });
  };

  const removeTrack = async (track: Track) => {
    if (!track.dbId) return;
    const { error } = await supabase.from("room_queue").delete().eq("id", track.dbId);
    if (error) {
      toast({ title: "Failed to remove track", description: error.message, variant: "destructive" });
    }
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
            {isAdmin && (
              <span className="flex items-center gap-1 text-xs text-accent font-medium">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}
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

        {/* ── Album art / now playing / YouTube embed ── */}
        <div className="glass-card rounded-2xl overflow-hidden glow-border">
          {isYouTube && currentTrack?.youtubeId ? (
            <div className="relative">
              <YouTubeEmbed
                videoId={currentTrack.youtubeId}
                isPlaying={isPlaying}
                volume={volume[0]}
                isMuted={isMuted}
                onTimeUpdate={handleYtTimeUpdate}
                onEnded={handleNext}
                onReady={handleYtReady}
                seekTo={ytSeekTo}
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] text-white font-medium">YouTube</span>
              </div>
            </div>
          ) : (
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
                      <CheckCircle2 className="w-3 h-3" /> Local File
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
                    <p className="text-sm text-muted-foreground">Upload files or add YouTube links</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {isYouTube && currentTrack && (
            <div className="px-5 pt-3 pb-1">
              <h2 className="text-base font-bold font-display truncate">{currentTrack.name}</h2>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          )}

          {/* Controls */}
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Slider value={[progress]} onValueChange={handleSeek} max={100} step={0.1} className="cursor-pointer" disabled={!currentTrack} />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{formatTime(currentSec)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="text-muted-foreground hover:text-foreground" disabled={!currentTrack}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button size="icon" disabled={!currentTrack} className="w-16 h-16 rounded-full bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 hover:scale-105 transition-all" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNext} className="text-muted-foreground hover:text-foreground" disabled={!currentTrack}>
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsMuted(m => !m)}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider value={isMuted ? [0] : volume} onValueChange={(v) => { setVolume(v); setIsMuted(false); }} max={100} step={1} />
            </div>
          </div>
        </div>

        {/* ── Row: Upload + YouTube + Devices + Queue ── */}
        <div className="grid grid-cols-4 gap-2">
          <label className="glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer border border-border/50 hover:border-primary/40 transition-colors group">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-medium text-center">Local</span>
            <input type="file" accept="audio/*" multiple className="hidden" onChange={handleFileUpload} />
          </label>

          <button
            onClick={() => { setShowYoutube(y => !y); setShowDevices(false); setShowQueue(false); }}
            className={`glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 border transition-colors ${showYoutube ? "border-red-500/50 glow-border" : "border-border/50 hover:border-red-500/40"}`}
          >
            <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
              <Youtube className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-[10px] font-medium">YouTube</span>
          </button>

          <button
            onClick={() => { setShowDevices(d => !d); setShowQueue(false); setShowYoutube(false); }}
            className={`glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 border transition-colors ${showDevices ? "border-primary/50 glow-border" : "border-border/50 hover:border-primary/40"}`}
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center relative">
              <Users className="w-4 h-4 text-primary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {onlineMembers.length}
              </span>
            </div>
            <span className="text-[10px] font-medium">{onlineMembers.length} online</span>
          </button>

          <button
            onClick={() => { setShowQueue(q => !q); setShowDevices(false); setShowYoutube(false); }}
            className={`glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 border transition-colors ${showQueue ? "border-primary/50 glow-border" : "border-border/50 hover:border-primary/40"}`}
          >
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center relative">
              <ListMusic className="w-4 h-4 text-accent" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
                {queue.length}
              </span>
            </div>
            <span className="text-[10px] font-medium">{queue.length} tracks</span>
          </button>
        </div>

        {/* ── YouTube panel ── */}
        {showYoutube && <YouTubePlayer onTrackAdd={handleYoutubeAdd} />}

        {/* ── Devices panel ── */}
        {showDevices && (
          <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h3 className="font-semibold font-display text-sm flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" /> Connected Devices
              </h3>
              <span className="text-xs text-muted-foreground">{onlineMembers.length} online</span>
            </div>
            <div className="divide-y divide-border/30">
              {members.map((member) => (
                <div key={member.id} className={`flex items-center gap-3 px-4 py-3 ${!member.is_online ? "opacity-40" : ""}`}>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold font-display text-foreground">
                      {member.device_name.charAt(0)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${member.is_online ? "bg-primary" : "bg-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                      {member.device_name}
                      {member.is_muted && <VolumeOff className="w-3 h-3 text-destructive" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.role === "admin" ? "Admin · Host" : "Listener"}
                      {member.user_id === user?.id ? " · You" : ""}
                      {!member.is_online ? " · Offline" : ""}
                    </p>
                  </div>
                  {member.is_online && (
                    <div className="flex items-center gap-1.5 text-[10px] text-primary font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Synced
                    </div>
                  )}
                  {/* Admin controls */}
                  {isAdmin && member.user_id !== user?.id && member.is_online && (
                    <div className="flex items-center gap-1">
                      {member.role !== "admin" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handlePromoteToAdmin(member.id)} title="Promote to Admin">
                          <ShieldPlus className="w-3.5 h-3.5 text-accent" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleToggleMute(member.id, member.is_muted)} title={member.is_muted ? "Unmute" : "Mute"}>
                        {member.is_muted ? <Volume1 className="w-3.5 h-3.5 text-primary" /> : <VolumeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => handleKick(member.id)} title="Remove user">
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No devices connected</div>
              )}
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
              {queue.length === 0 && <span className="text-xs text-muted-foreground">Add tracks to get started</span>}
            </div>
            {queue.length === 0 ? (
              <div className="py-10 text-center">
                <Music className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tracks yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add local files or YouTube links</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30 max-h-72 overflow-y-auto">
                {queue.map((track, idx) => (
                  <div
                    key={track.dbId ?? `${track.id}-${idx}`}
                    onClick={() => {
                      setCurrentTrackIndex(idx);
                      setProgress(0);
                      setCurrentSec(0);
                      setTotalDuration(0);

                      if (track.isLocal) {
                        setIsPlaying(true);
                        if (track.addedBy !== user?.id) {
                          setIsPlaying(false);
                          toast({
                            title: "Local file unavailable",
                            description: "This local file can only play on the device that uploaded it.",
                            variant: "destructive",
                          });
                        }
                        return;
                      }

                      setIsPlaying(true);
                      syncPlaybackState({ current_track_index: idx, is_playing: true, current_time_seconds: 0 });
                    }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${idx === currentTrackIndex ? "bg-primary/10" : "hover:bg-secondary/40"}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      {idx === currentTrackIndex && isPlaying ? (
                        <span className="flex gap-0.5 items-end h-4">
                          {[1, 2, 3].map(i => (
                            <span key={i} className="w-1 rounded-full bg-primary animate-bounce" style={{ height: `${40 + i * 20}%`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </span>
                      ) : track.youtubeId ? (
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${idx === currentTrackIndex ? "text-primary" : ""}`}>{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeTrack(track); }}>
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
              <p className="text-xs font-medium">Synced · Real-time</p>
              <p className="text-[10px] text-muted-foreground">Room: {roomCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{onlineMembers.length} device{onlineMembers.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
