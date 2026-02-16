const steps = [
  {
    number: "01",
    title: "Create a Room",
    description: "Start by creating a new sync room. You'll get a unique room code to share with others.",
  },
  {
    number: "02",
    title: "Connect Devices",
    description: "Open the app on your other devices and join using the room code. It's instant.",
  },
  {
    number: "03",
    title: "Start Playing",
    description: "Play audio from any app — YouTube, Spotify, or anything. All devices stay in perfect sync.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent font-medium mb-3 text-sm tracking-widest uppercase">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
            Three Simple Steps
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in under a minute
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="glass-card rounded-2xl p-8 h-full hover:border-primary/30 transition-all duration-300">
                <div className="text-7xl font-bold gradient-text mb-4 opacity-40 font-display select-none">
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold mb-3 font-display">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/60 to-accent/60" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
