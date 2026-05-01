'use client'

import Link from 'next/link'

type Action =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never }

type Props = {
  icon: string
  title: string
  subtitle: string
  action?: Action
}

export default function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-[64px] leading-none mb-5 select-none">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-7 max-w-xs leading-relaxed">{subtitle}</p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#16a34a] hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#16a34a] hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
