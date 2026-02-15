import { Radio } from "lucide-react";

const Footer = () => (
  <footer className="py-8 px-4 border-t border-border bg-secondary/20">
    <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground">Sync Sound</span>
      </div>
      <p>© 2026 Sync Sound. Synchronized audio for everyone.</p>
    </div>
  </footer>
);

export default Footer;
