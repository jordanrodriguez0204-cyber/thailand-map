export function ExcursionIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8}
      fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="m13 7-1.8 4.2L7 13l1.8-4.2z" fill="currentColor" stroke="none" />
    </svg>
  )
}
