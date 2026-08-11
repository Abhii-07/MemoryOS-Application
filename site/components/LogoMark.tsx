/**
 * LogoMark — abstract memory-network symbol (spec §6).
 * Simplified enough for 16/24/32px + favicon. Idle: static network.
 */
export function LogoMark({ size = 22, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      <circle cx="16" cy="5" r="2.1" fill="currentColor" />
      <circle cx="7" cy="20" r="2.1" fill="currentColor" />
      <circle cx="25" cy="20" r="2.1" fill="currentColor" />
      <circle cx="16" cy="28" r="2.1" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.4" opacity="0.9">
        <line x1="14.6" y1="6.6" x2="8" y2="18.2" />
        <line x1="17.4" y1="6.6" x2="24" y2="18.2" />
        <line x1="8.2" y1="20" x2="23.8" y2="20" />
        <line x1="8.2" y1="20" x2="14.6" y2="26.6" />
        <line x1="23.8" y1="20" x2="17.4" y2="26.6" />
      </g>
      {active && (
        <line x1="14.6" y1="6.6" x2="8" y2="18.2" stroke="currentColor" strokeWidth="1.8" opacity="0" />
      )}
    </svg>
  );
}
