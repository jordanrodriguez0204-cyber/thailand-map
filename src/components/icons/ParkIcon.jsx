export function ParkIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8}
      fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 16.5 7.5 6l3.2 6" />
      <path d="M2 16.5h16" />
      <path d="M14.5 16.5V13" />
      <path d="m14.5 4-3 4.5h1.5l-2 3.5h7l-2-3.5H17Z" />
    </svg>
  )
}
