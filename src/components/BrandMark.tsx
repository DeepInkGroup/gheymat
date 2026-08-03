export default function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4136" />
          <stop offset="25%" stopColor="#F7941D" />
          <stop offset="50%" stopColor="#FFD200" />
          <stop offset="72%" stopColor="#39B54A" />
          <stop offset="100%" stopColor="#2E9DF7" />
        </linearGradient>
      </defs>
      <path
        d="M 11.94 67.75 A 42 42 0 1 1 32.25 88.06 L 37.32 77.19 A 30 30 0 1 0 22.81 62.68 Z"
        fill="url(#brandGrad)"
      />
      <text
        x="50"
        y="67"
        fontSize="48"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="url(#brandGrad)"
      >
        $
      </text>
    </svg>
  );
}
