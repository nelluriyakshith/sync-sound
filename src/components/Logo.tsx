const Logo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer ring */}
    <circle cx="24" cy="24" r="22" stroke="url(#logoGrad)" strokeWidth="2.5" opacity="0.3" />
    {/* Inner pulsing rings */}
    <circle cx="24" cy="24" r="16" stroke="url(#logoGrad)" strokeWidth="2" opacity="0.5" />
    <circle cx="24" cy="24" r="10" stroke="url(#logoGrad)" strokeWidth="2.5" opacity="0.8" />
    {/* Center dot */}
    <circle cx="24" cy="24" r="4" fill="url(#logoGrad)" />
    {/* Sound wave arcs - left */}
    <path d="M12 18C9 20 9 28 12 30" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M8 15C4 19 4 29 8 33" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    {/* Sound wave arcs - right */}
    <path d="M36 18C39 20 39 28 36 30" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M40 15C44 19 44 29 40 33" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(170 80% 50%)" />
        <stop offset="0.5" stopColor="hsl(200 85% 55%)" />
        <stop offset="1" stopColor="hsl(260 80% 65%)" />
      </linearGradient>
    </defs>
  </svg>
);

export default Logo;
