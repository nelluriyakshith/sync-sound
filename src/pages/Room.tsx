import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Plus, LogIn, Copy, Users, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

const generateRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const Room = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const handleCreate = () => {
    const code = generateRoomCode();
    setCreatedCode(code);
    toast({ title: "Room Created!", description: `Room code: ${code}` });
  };

  const handleCopy = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      toast({ title: "Copied!", description: "Room code copied to clipboard" });
    }
  };

  const handleJoin = () => {
    const code = createdCode || joinCode.trim().toUpperCase();
    if (code.length < 4) {
      toast({ title: "Invalid Code", description: "Please enter a valid room code", variant: "destructive" });
      return;
    }
    navigate(`/player/${code}`);
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-12">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-2xl glass-card glow-border">
              <Logo size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 font-display">Sync Rooms</h1>
          <p className="text-muted-foreground">Create or join a room to sync audio across devices</p>
        </div>

        <Card className="glass-card glow-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-display">
              <Plus className="w-5 h-5 text-primary" />
              Create a Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {createdCode ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Room Created</span>
                </div>
                <div className="text-4xl font-mono font-bold tracking-[0.3em] gradient-text">
                  {createdCode}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={handleCopy} className="gap-2">
                    <Copy className="w-4 h-4" /> Copy Code
                  </Button>
                  <Button onClick={handleJoin} className="gap-2 bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground">
                    <Users className="w-4 h-4" /> Enter Room
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleCreate} className="w-full gap-2 bg-gradient-to-r from-[hsl(var(--gradient-from))] via-[hsl(var(--gradient-via))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 font-display font-semibold" size="lg">
                <Plus className="w-5 h-5" /> Create New Room
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-display">
              <LogIn className="w-5 h-5 text-accent" />
              Join a Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="text-center text-xl tracking-[0.2em] font-mono uppercase bg-secondary/50"
              maxLength={6}
            />
            <Button
              onClick={handleJoin}
              variant="outline"
              className="w-full gap-2 border-2 font-display"
              size="lg"
              disabled={joinCode.trim().length < 4}
            >
              <LogIn className="w-5 h-5" /> Join Room
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Room;
