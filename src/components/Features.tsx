import { Card, CardContent } from "@/components/ui/card";
import { Link2, Radio, Layers, Clock, Sliders, Shield } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Easy Device Linking",
    description: "Connect multiple Android devices with just a simple room code - no complicated setup required",
  },
  {
    icon: Radio,
    title: "Room-Based Sync",
    description: "Create or join rooms instantly. Each room keeps your devices perfectly in sync",
  },
  {
    icon: Layers,
    title: "Universal Compatibility",
    description: "Works seamlessly with YouTube, Spotify, podcasts, and any audio source on your device",
  },
  {
    icon: Clock,
    title: "Real-Time Sync",
    description: "Advanced synchronization technology ensures zero-lag audio across all connected devices",
  },
  {
    icon: Sliders,
    title: "Simple Controls",
    description: "Play, pause, and control audio from any device in the room with intuitive controls",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your audio stays on your devices. We only sync playback timing, never your content",
  },
];

const Features = () => {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need for Perfect Audio Sync
          </h2>
          <p className="text-xl text-muted-foreground">
            Built for simplicity, designed for performance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <CardContent className="p-6">
                  <div className="mb-4 p-3 rounded-xl bg-primary/10 w-fit">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
