export function TransitIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8}
      fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17.5 10c0 .8-.7 1.5-1.5 1.5h-4.5l-3.5 5H6l1.75-5H4.5l-1.5 1.5H1.5l1-3-1-3H3l1.5 1.5h3.25L6 3.5h2l3.5 5H16c.8 0 1.5.7 1.5 1.5Z" />
    </svg>
  )
}
