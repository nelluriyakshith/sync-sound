import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "Create a Room",
    description: "Start by creating a new sync room. You'll get a unique room code to share",
  },
  {
    number: "02",
    title: "Connect Devices",
    description: "Open the app on your other Android devices and join using the room code",
  },
  {
    number: "03",
    title: "Start Playing",
    description: "Play audio from any app - YouTube, Spotify, or anything else. All devices stay in perfect sync",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="bg-card/50 backdrop-blur-sm border-border h-full">
                <CardContent className="p-6">
                  <div className="text-6xl font-bold gradient-text mb-4 opacity-50">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
              {/* Connection line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-accent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
