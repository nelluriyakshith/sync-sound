import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube, Search, X, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface YouTubePlayerProps {
  onTrackAdd: (track: { id: string; name: string; artist: string; url: string; youtubeId: string }) => void;
}

/* Extract YouTube video ID from various URL formats */
const extractVideoId = (input: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
};

const YouTubePlayer = ({ onTrackAdd }: YouTubePlayerProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = () => {
    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      toast({ title: "Invalid URL", description: "Please paste a valid YouTube link or video ID", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    // We use noembed to get video title without an API key
    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
      .then(r => r.json())
      .then(data => {
        const title = data.title || "YouTube Video";
        const author = data.author_name || "YouTube";
        onTrackAdd({
          id: `yt-${videoId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: title,
          artist: author,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          youtubeId: videoId,
        });
        toast({ title: "Added!", description: `"${title}" added to queue` });
        setUrl("");
      })
      .catch(() => {
        // Fallback: add with generic name
        onTrackAdd({
          id: `yt-${videoId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: "YouTube Video",
          artist: "YouTube",
          url: `https://www.youtube.com/watch?v=${videoId}`,
          youtubeId: videoId,
        });
        toast({ title: "Added!", description: "Video added to queue" });
        setUrl("");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <Youtube className="w-4 h-4 text-red-500" />
        <h3 className="font-semibold font-display text-sm">Play from YouTube</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste YouTube link or video ID"
              className="pl-9 bg-secondary/50 text-sm"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            {url && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6"
                onClick={() => setUrl("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          <Button
            onClick={handleAdd}
            disabled={!url.trim() || isLoading}
            className="gap-1.5 bg-red-600 hover:bg-red-700 text-white shrink-0"
            size="sm"
          >
            <Youtube className="w-4 h-4" />
            {isLoading ? "Adding..." : "Add"}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Supports youtube.com/watch, youtu.be, shorts, and video IDs
        </p>
      </div>
    </div>
  );
};

export default YouTubePlayer;
