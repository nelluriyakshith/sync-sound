import { useEffect, useRef, useState } from "react";

interface YouTubeEmbedProps {
  videoId: string;
  isPlaying: boolean;
  volume: number; // 0-100
  isMuted: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onReady?: (duration: number) => void;
  seekTo?: number | null;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

const loadYouTubeAPI = (): Promise<void> => {
  if (apiReady) return Promise.resolve();
  return new Promise((resolve) => {
    if (apiLoaded) {
      readyCallbacks.push(resolve);
      return;
    }
    apiLoaded = true;
    readyCallbacks.push(resolve);
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      readyCallbacks.forEach(cb => cb());
      readyCallbacks.length = 0;
    };
  });
};

const YouTubeEmbed = ({
  videoId, isPlaying, volume, isMuted,
  onTimeUpdate, onEnded, onReady, seekTo,
}: YouTubeEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Create player
  useEffect(() => {
    let destroyed = false;

    loadYouTubeAPI().then(() => {
      if (destroyed || !containerRef.current) return;

      // Clear container
      containerRef.current.innerHTML = "";
      const div = document.createElement("div");
      div.id = `yt-player-${videoId}`;
      containerRef.current.appendChild(div);

      playerRef.current = new window.YT.Player(div.id, {
        videoId,
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            const dur = e.target.getDuration?.() || 0;
            onReady?.(dur);
            e.target.setVolume(isMuted ? 0 : volume);
            if (isPlaying) e.target.playVideo();

            // Time update interval
            intervalRef.current = setInterval(() => {
              if (!playerRef.current?.getCurrentTime) return;
              const ct = playerRef.current.getCurrentTime();
              const d = playerRef.current.getDuration();
              onTimeUpdate?.(ct, d);
            }, 250);
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              onEnded?.();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Play/pause
  useEffect(() => {
    if (!playerRef.current?.playVideo) return;
    isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
  }, [isPlaying]);

  // Volume
  useEffect(() => {
    if (!playerRef.current?.setVolume) return;
    playerRef.current.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Seek
  useEffect(() => {
    if (seekTo == null || !playerRef.current?.seekTo) return;
    playerRef.current.seekTo(seekTo, true);
  }, [seekTo]);

  return (
    <div ref={containerRef} className="w-full aspect-video rounded-lg overflow-hidden bg-black" />
  );
};

export default YouTubeEmbed;
