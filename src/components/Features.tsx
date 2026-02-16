import { Card, CardContent } from "@/components/ui/card";
import { Link2, Radio, Layers, Clock, Sliders, Shield } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Easy Device Linking",
    description: "Connect multiple devices with just a simple room code — no setup required",
    color: "text-primary",
  },
  {
    icon: Radio,
    title: "Room-Based Sync",
    description: "Create or join rooms instantly. Each room keeps your devices perfectly in sync",
    color: "text-accent",
  },
  {
    icon: Layers,
    title: "Universal Compatibility",
    description: "Works seamlessly with YouTube, Spotify, podcasts, and any audio source",
    color: "text-primary",
  },
  {
    icon: Clock,
    title: "Real-Time Sync",
    description: "Advanced synchronization ensures zero-lag audio across all connected devices",
    color: "text-accent",
  },
  {
    icon: Sliders,
    title: "Simple Controls",
    description: "Play, pause, and control audio from any device with intuitive controls",
    color: "text-primary",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your audio stays on your devices. We only sync playback timing, never content",
    color: "text-accent",
  },
];

const Features = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      <div className="container max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <p className="text-primary font-medium mb-3 text-sm tracking-widest uppercase">Features</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
            Everything for Perfect Sync
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Built for simplicity, designed for performance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="glass-card hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group"
              >
                <CardContent className="p-6">
                  <div className={`mb-4 p-3 rounded-xl bg-secondary w-fit group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 font-display">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
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
