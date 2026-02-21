import Logo from "./Logo";

const Footer = () => (
  <footer className="py-10 px-4 border-t border-border/50 bg-card/30">
    <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2.5">
        <Logo size={20} />
        <span className="font-semibold text-foreground font-display">Sync Sound</span>
      </div>
      <p>© 2026 Sync Sound. All rights reserved. Copyright by Nelluri Yakshith.</p>
    </div>
  </footer>
);

export default Footer;
