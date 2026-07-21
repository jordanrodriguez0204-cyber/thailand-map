export function CityIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8}
      fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 17.5h15" />
      <path d="M4 17.5V9.5h3.5v8" />
      <path d="M8.5 17.5V4.5H12v13" />
      <path d="M13.5 17.5V7.5H16.5v10" />
      <path d="M5.75 12h.01M10.25 8h.01M10.25 11.5h.01M15 10.5h.01M15 13.5h.01" strokeWidth={1.4} />
    </svg>
  )
}
