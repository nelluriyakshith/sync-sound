import appLogo from "@/assets/app-logo.png";

const Logo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <img
    src={appLogo}
    alt="Sync Sound Logo"
    width={size}
    height={size}
    className={`rounded-full object-cover ${className}`}
    style={{ width: size, height: size }}
  />
);

export default Logo;
