interface FloralProps {
  variant?: 1 | 2 | 3
  className?: string
}

function FlowerBlossom({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.12">
        <path d="M60 15 C60 15 45 40 28 40 C12 40 12 25 12 25 C12 25 28 10 45 10 C60 10 60 15 60 15Z" fill="#EFCFC8" />
        <path d="M60 15 C60 15 75 40 92 40 C108 40 108 25 108 25 C108 25 92 10 75 10 C60 10 60 15 60 15Z" fill="#EFCFC8" />
        <path d="M60 15 C60 15 40 45 40 65 C40 65 28 50 28 38 C28 25 60 15 60 15Z" fill="#EFCFC8" />
        <path d="M60 15 C60 15 80 45 80 65 C80 65 92 50 92 38 C92 25 60 15 60 15Z" fill="#EFCFC8" />
        <path d="M60 15 C60 15 50 50 50 70 C50 70 42 55 42 42 C42 30 60 15 60 15Z" fill="#E6C1B8" />
        <path d="M60 15 C60 15 70 50 70 70 C70 70 78 55 78 42 C78 30 60 15 60 15Z" fill="#E6C1B8" />
        <circle cx="60" cy="18" r="5" fill="#F8F3EE" opacity="0.8" />
        <path d="M60 20 C57 35 52 45 44 52" stroke="#EFCFC8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M60 20 C63 35 68 45 76 52" stroke="#EFCFC8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M60 20 C59 30 56 38 50 42" stroke="#EFCFC8" strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M60 20 C61 30 64 38 70 42" stroke="#EFCFC8" strokeWidth="1" strokeLinecap="round" fill="none" />
        <ellipse cx="40" cy="35" rx="7" ry="12" transform="rotate(-30 40 35)" fill="#E6C1B8" opacity="0.5" />
        <ellipse cx="80" cy="35" rx="7" ry="12" transform="rotate(30 80 35)" fill="#E6C1B8" opacity="0.5" />
      </g>
    </svg>
  )
}

function BranchFlowers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.1">
        <path d="M10 150 C40 130 80 120 140 80 C160 65 180 45 190 30" stroke="#EFCFC8" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M60 125 C70 115 80 110 90 115" stroke="#EFCFC8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M100 100 C110 90 120 85 130 90" stroke="#EFCFC8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M140 75 C150 65 155 60 160 65" stroke="#EFCFC8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="90" cy="112" r="8" fill="#EFCFC8" opacity="0.6" />
        <circle cx="90" cy="112" r="3" fill="#F8F3EE" />
        <circle cx="130" cy="87" r="6" fill="#EFCFC8" opacity="0.6" />
        <circle cx="130" cy="87" r="2.5" fill="#F8F3EE" />
        <circle cx="160" cy="62" r="5" fill="#EFCFC8" opacity="0.6" />
        <circle cx="160" cy="62" r="2" fill="#F8F3EE" />
        <circle cx="70" cy="122" r="5" fill="#E6C1B8" opacity="0.5" />
        <circle cx="70" cy="122" r="2" fill="#F8F3EE" />
      </g>
    </svg>
  )
}

function LeafPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.08">
        <path d="M80 0 C75 30 55 50 30 55 C50 60 70 75 80 100 C90 75 110 60 130 55 C105 50 85 30 80 0Z" fill="#EFCFC8" />
        <path d="M80 60 C75 80 60 95 40 100 C55 105 70 115 80 130 C90 115 105 105 120 100 C100 95 85 80 80 60Z" fill="#EFCFC8" />
        <path d="M80 110 C76 125 65 135 50 140 C62 143 72 150 80 160 C88 150 98 143 110 140 C95 135 84 125 80 110Z" fill="#EFCFC8" />
        <circle cx="80" cy="5" r="3" fill="#E6C1B8" />
        <circle cx="80" cy="65" r="2.5" fill="#E6C1B8" />
        <circle cx="80" cy="115" r="2" fill="#E6C1B8" />
      </g>
    </svg>
  )
}

export default function FloralDecor({ variant = 1, className = '' }: FloralProps) {
  switch (variant) {
    case 2: return <BranchFlowers className={className} />
    case 3: return <LeafPattern className={className} />
    default: return <FlowerBlossom className={className} />
  }
}
