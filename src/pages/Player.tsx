import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Users, Copy, ArrowLeft, Wifi, Upload, Music, ListMusic, X, CheckCircle2, Youtube,
  Shield, UserMinus, VolumeOff, Volume1, ShieldPlus, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getSavedDeviceName } from "@/lib/app-settings";
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

interface QueueRow {
  id: string;
  track_id: string;
  name: string;
  artist: string;
  url: string;
  is_local: boolean;
  youtube_id: string | null;
  position: number;
  added_by: string;
}

interface PlaybackStateRow {
  current_time_seconds: number;
  current_track_index: number;
  is_playing: boolean;
  updated_at: string;
  updated_by: string | null;
}

/* ─── helpers ───────────────────────────────── */
const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const sanitizeFileName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "track";

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

const mapQueueRowToTrack = (q: QueueRow): Track => ({
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
});

const clampTrackIndex = (index: number, trackCount: number) => {
  if (trackCount <= 0) return 0;
  return Math.min(Math.max(index, 0), trackCount - 1);
};

const getSyncedPlaybackTime = (playbackState: PlaybackStateRow) => {
  const baseTime = Math.max(0, playbackState.current_time_seconds ?? 0);

  if (!playbackState.is_playing) return baseTime;

  const updatedAtMs = new Date(playbackState.updated_at).getTime();
  if (Number.isNaN(updatedAtMs)) return baseTime;

  return Math.max(0, baseTime + (Date.now() - updatedAtMs) / 1000);
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

  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [needsPlaybackUnlock, setNeedsPlaybackUnlock] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const legacyQueueWarningShown = useRef(false);
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTrack = queue[currentTrackIndex] ?? null;
  const isYouTube = !!currentTrack?.youtubeId;
  const onlineMembers = members.filter(m => m.is_online);

  const loadMembers = useCallback(async (targetRoomId: string) => {
    const { data: mems, error } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", targetRoomId);

    if (error) throw error;
    if (mems) setMembers(dedupeMembers(mems as RoomMember[]));
  }, []);

  const loadQueue = useCallback(async (targetRoomId: string) => {
    const { data: queueData, error } = await supabase
      .from("room_queue")
      .select("*")
      .eq("room_id", targetRoomId)
      .order("position", { ascending: true });

    if (error) throw error;

    const rows = (queueData as QueueRow[] | null) ?? [];
    const validRows = rows.filter((row) => Boolean(row.youtube_id || row.url));
    if (rows.length !== validRows.length && !legacyQueueWarningShown.current) {
      legacyQueueWarningShown.current = true;
      toast({
        title: "Old local tracks skipped",
        description: "Some legacy tracks were added before shared uploads and are unavailable on all devices.",
      });
    }

    const mapped = validRows.map(mapQueueRowToTrack);
    setQueue(mapped);
    setCurrentTrackIndex(prev => {
      if (mapped.length === 0) return 0;
      return Math.max(0, Math.min(prev, mapped.length - 1));
    });
    return mapped;
  }, [toast]);

  const loadPlaybackState = useCallback(async (
    targetRoomId: string,
    options?: { forceSeek?: boolean; trackCount?: number }
  ) => {
    const { data: ps, error } = await supabase
      .from("room_playback_state")
      .select("*")
      .eq("room_id", targetRoomId)
      .maybeSingle();

    if (error) throw error;
    if (!ps) return;

    const playbackState = ps as PlaybackStateRow;
    const nextTrackIndex = clampTrackIndex(
      playbackState.current_track_index,
      options?.trackCount ?? Math.max(queue.length, playbackState.current_track_index + 1)
    );
    const nextCurrentTime = getSyncedPlaybackTime(playbackState);

    const playbackDrift = Math.abs(currentSec - nextCurrentTime);

    setCurrentTrackIndex(nextTrackIndex);
    setIsPlaying(playbackState.is_playing);
    setCurrentSec(nextCurrentTime);

    if (options?.forceSeek || playbackDrift > 0.75 || nextTrackIndex !== currentTrackIndex) {
      setYtSeekTo(nextCurrentTime);
    }

    if (audioRef.current) {
      const duration = Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0;
      const boundedTime = duration > 0 ? Math.min(nextCurrentTime, Math.max(duration - 0.25, 0)) : nextCurrentTime;
      const drift = Math.abs(audioRef.current.currentTime - boundedTime);

      if (options?.forceSeek || drift > 0.75) {
        audioRef.current.currentTime = boundedTime;
      }
    }
  }, [currentSec, currentTrackIndex, queue.length]);

  const syncAllRoomData = useCallback(async (
    targetRoomId: string,
    silent = false,
    forcePlaybackAlignment = false
  ) => {
    const initialResults = await Promise.allSettled([
      loadMembers(targetRoomId),
      loadQueue(targetRoomId),
    ]);

    const queueResult = initialResults[1];
    const trackCount = queueResult.status === "fulfilled" ? queueResult.value.length : queue.length;
    const playbackResults = await Promise.allSettled([
      loadPlaybackState(targetRoomId, { forceSeek: forcePlaybackAlignment, trackCount }),
    ]);
    const results = [...initialResults, ...playbackResults];

    const hasFailures = results.some((result) => result.status === "rejected");
    if (hasFailures) {
      if (!silent) {
        toast({
          title: "Sync failed",
          description: "Could not refresh room data. Please tap Sync again.",
          variant: "destructive",
        });
      }
      return false;
    }

    setLastSyncAt(new Date().toLocaleTimeString());
    return true;
  }, [loadMembers, loadQueue, loadPlaybackState, queue.length, toast]);

  const handleManualSync = useCallback(async () => {
    if (!roomId) return;
    setIsSyncing(true);
    try {
      const ok = await syncAllRoomData(roomId, false, true);
      if (ok) {
        toast({ title: "Synced!", description: "Playback and room data were aligned" });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [roomId, syncAllRoomData, toast]);

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

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("room_members")
        .select("id, role")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .maybeSingle();

      let memberRole = existingMember?.role;
      const deviceName = getSavedDeviceName();

      if (existingMember) {
        await supabase
          .from("room_members")
          .update({
            is_online: true,
            device_name: deviceName,
            last_seen: new Date().toISOString(),
          })
          .eq("id", existingMember.id);
      } else {
        memberRole = room.created_by === user.id ? "admin" : "member";
        const { error: insertErr } = await supabase
          .from("room_members")
          .insert({
            room_id: room.id,
            user_id: user.id,
            device_name: deviceName,
            role: memberRole,
            is_online: true,
            last_seen: new Date().toISOString(),
          });

        if (insertErr) {
          toast({ title: "Sync warning", description: insertErr.message, variant: "destructive" });
          return;
        }
      }

      setIsAdmin(room.created_by === user.id || memberRole === "admin");
      setRoomId(room.id);

      await syncAllRoomData(room.id);
    };

    loadRoom();
  }, [roomCode, user, navigate, toast, syncAllRoomData]);

  /* ── Real-time subscription for members/queue/playback ── */
  useEffect(() => {
    if (!roomId) return;

    const scheduleSync = () => {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = setTimeout(() => {
        syncAllRoomData(roomId, true);
      }, 250);
    };

    const channel = supabase
      .channel(`room-sync-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        scheduleSync
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_queue", filter: `room_id=eq.${roomId}` },
        scheduleSync
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_playback_state", filter: `room_id=eq.${roomId}` },
        scheduleSync
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          scheduleSync();
        }
      });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncAllRoomData(roomId, true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [roomId, syncAllRoomData]);

  /* ── Fallback refresh (protects against dropped realtime events) ── */
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      syncAllRoomData(roomId, true);
    }, 3500);

    return () => clearInterval(interval);
  }, [roomId, syncAllRoomData]);

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
    await supabase
      .from("room_playback_state")
      .upsert(data, { onConflict: "room_id" });
  }, [roomId, user, isPlaying, currentTrackIndex, currentSec]);

  const tryStartLocalPlayback = useCallback(async () => {
    if (!audioRef.current) return false;
    try {
      await audioRef.current.play();
      setNeedsPlaybackUnlock(false);
      return true;
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setNeedsPlaybackUnlock(true);
      }
      return false;
    }
  }, []);

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
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.volume = isMuted ? 0 : volume[0] / 100;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentSec(audio.currentTime);
      setTotalDuration(audio.duration || 0);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    const onLoadedMetadata = () => {
      const duration = audio.duration || 0;
      const startTime = duration > 0 ? Math.min(currentSec, Math.max(duration - 0.25, 0)) : currentSec;

      setTotalDuration(duration);

      if (startTime > 0) {
        audio.currentTime = startTime;
        setProgress(duration ? (startTime / duration) * 100 : 0);
      }
    };
    const onEnded = () => handleNext();
    const onError = () => {
      setIsPlaying(false);
      toast({
        title: "Playback issue",
        description: "This track could not play on this device. Try Sync or switch to another track.",
        variant: "destructive",
      });
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    if (isPlaying) {
      tryStartLocalPlayback();
    }

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!audioRef.current || isYouTube || !currentTrack) return;

    const duration = Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0;
    const boundedTime = duration > 0 ? Math.min(currentSec, Math.max(duration - 0.25, 0)) : currentSec;

    if (Math.abs(audioRef.current.currentTime - boundedTime) > 0.75) {
      audioRef.current.currentTime = boundedTime;
    }
  }, [currentSec, currentTrack, isYouTube]);

  /* ── volume (local) ── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
  }, [volume, isMuted]);

  /* ── play/pause (local) ── */
  useEffect(() => {
    if (!audioRef.current || isYouTube) return;
    if (isPlaying) {
      tryStartLocalPlayback();
      return;
    }

    audioRef.current.pause();
  }, [isPlaying, isYouTube, tryStartLocalPlayback]);

  const handleUnlockAudio = async () => {
    const started = await tryStartLocalPlayback();
    if (!started) {
      toast({
        title: "Tap play to unlock audio",
        description: "Your browser requires one interaction before audio can start.",
      });
      return;
    }

    setIsPlaying(true);
    if (currentTrack && !currentTrack.isLocal) {
      await syncPlaybackState({
        is_playing: true,
        current_time_seconds: audioRef.current?.currentTime ?? currentSec,
      });
    }
    toast({ title: "Audio unlocked", description: "This device is now synced for playback" });
  };

  const handlePlayPause = () => {
    const next = !isPlaying;
    const playbackTime = isYouTube ? currentSec : audioRef.current?.currentTime ?? currentSec;

    setCurrentSec(playbackTime);
    setIsPlaying(next);
    if (!currentTrack?.isLocal) {
      syncPlaybackState({ is_playing: next, current_time_seconds: playbackTime });
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

  /* ── shared audio upload (cross-device) ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !roomId || !user) return;
    const audioFiles = files.filter(f => f.type.startsWith("audio/"));

    if (!audioFiles.length) {
      toast({ title: "No audio files", description: "Please select valid audio files", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const queueRows: {
        room_id: string;
        track_id: string;
        name: string;
        artist: string;
        url: string;
        is_local: boolean;
        position: number;
        added_by: string;
      }[] = [];

      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        const cleanName = file.name.replace(/\.[^.]+$/, "");
        const parts = cleanName.split(" - ");
        const artist = parts[0] ?? "Unknown Artist";
        const name = parts[1] ?? cleanName;

        const trackId = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
        const objectPath = `${user.id}/${roomId}/${Date.now()}-${i}-${sanitizeFileName(file.name)}`;

        const { error: uploadError } = await supabase.storage
          .from("room-audio")
          .upload(objectPath, file, {
            upsert: false,
            contentType: file.type || "audio/mpeg",
            cacheControl: "3600",
          });

        if (uploadError) {
          toast({ title: `Upload failed (${file.name})`, description: uploadError.message, variant: "destructive" });
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from("room-audio").getPublicUrl(objectPath);

        if (!publicUrlData?.publicUrl) {
          toast({ title: `Upload failed (${file.name})`, description: "Could not create playback URL", variant: "destructive" });
          continue;
        }

        queueRows.push({
          room_id: roomId,
          track_id: trackId,
          name,
          artist,
          url: publicUrlData.publicUrl,
          is_local: false,
          position: queue.length + queueRows.length,
          added_by: user.id,
        });
      }

      if (!queueRows.length) return;

      const { error: insertError } = await supabase.from("room_queue").insert(queueRows);

      if (insertError) {
        toast({ title: "Failed to add uploaded tracks", description: insertError.message, variant: "destructive" });
        return;
      }

      if (queue.length === 0) {
        setCurrentTrackIndex(0);
        setIsPlaying(true);
        await syncPlaybackState({ is_playing: true, current_track_index: 0, current_time_seconds: 0 });
      }

      await loadQueue(roomId);
      toast({
        title: `${queueRows.length} track${queueRows.length > 1 ? "s" : ""} uploaded`,
        description: "Now available on all devices in this room",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
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

    await loadQueue(roomId);
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
      return;
    }

    await loadQueue(roomId!);
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

            {needsPlaybackUnlock && !isYouTube && currentTrack && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleUnlockAudio}
              >
                Tap once to enable sound on this device
              </Button>
            )}
          </div>
        </div>

        {/* ── Row: Upload + YouTube + Devices + Queue ── */}
        <div className="grid grid-cols-4 gap-2">
          <label className="glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer border border-border/50 hover:border-primary/40 transition-colors group">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-medium text-center">{isUploading ? "Uploading..." : "Shared"}</span>
            <input type="file" accept="audio/*" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
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
              <p className="text-[10px] text-muted-foreground">
                Room: {roomCode}{lastSyncAt ? ` · Updated ${lastSyncAt}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-7 px-2 text-xs"
              onClick={handleManualSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync"}
            </Button>
            <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{onlineMembers.length} device{onlineMembers.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
