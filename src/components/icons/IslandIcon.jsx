export function IslandIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8}
      fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 14V7" />
      <path d="M10 7Q6.5 6.5 5 3.5q4-.5 5 3.5" />
      <path d="M10 7q3.5-.5 5-3.5-4-.5-5 3.5" />
      <path d="M2 16.5q2-1.5 4 0t4 0 4 0 4 0" />
    </svg>
  )
}
