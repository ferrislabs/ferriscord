import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  users: string[]
  className?: string
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`
    } else if (users.length === 3) {
      return `${users[0]}, ${users[1]}, and ${users[2]} are typing...`
    } else {
      return `${users[0]}, ${users[1]}, and ${users.length - 2} others are typing...`
    }
  }

  return (
    <div className={cn('flex items-center space-x-2 px-4 py-1', className)}>
      <svg
        width='42'
        height='24'
        viewBox='0 0 42 24'
        aria-hidden='true'
        className='shrink-0 text-muted-foreground'
      >
        <g transform='translate(2 2)'>
          <ellipse
            cx='17'
            cy='14'
            rx='10'
            ry='6.5'
            fill='currentColor'
            opacity='0.14'
          />
          <g
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeWidth='1.8'
          >
            <path d='M8 12c-2-1.2-3.8-3.3-4.8-5.8'>
              <animateTransform
                attributeName='transform'
                type='rotate'
                values='-8 8 12;6 8 12;-8 8 12'
                dur='1.2s'
                repeatCount='indefinite'
              />
            </path>
            <path d='M26 12c2-1.2 3.8-3.3 4.8-5.8'>
              <animateTransform
                attributeName='transform'
                type='rotate'
                values='8 26 12;-6 26 12;8 26 12'
                dur='1.2s'
                repeatCount='indefinite'
              />
            </path>
          </g>
          <g fill='currentColor'>
            <circle cx='14' cy='7' r='2.1' />
            <circle cx='20' cy='7' r='2.1' />
            <circle cx='14' cy='7' r='0.8' fill='hsl(var(--background))'>
              <animate
                attributeName='cy'
                values='7;7.4;7'
                dur='1.2s'
                repeatCount='indefinite'
              />
            </circle>
            <circle cx='20' cy='7' r='0.8' fill='hsl(var(--background))'>
              <animate
                attributeName='cy'
                values='7;7.4;7'
                dur='1.2s'
                repeatCount='indefinite'
              />
            </circle>
          </g>
          <path
            d='M13.4 14.8c.9.8 2.1 1.2 3.6 1.2s2.7-.4 3.6-1.2'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.6'
            strokeLinecap='round'
            opacity='0.8'
          >
            <animate
              attributeName='d'
              values='
                M13.4 14.8c.9.8 2.1 1.2 3.6 1.2s2.7-.4 3.6-1.2;
                M13.1 15.2c1-.1 2.3-.2 3.9-.2s2.9.1 3.9.2;
                M13.4 14.8c.9.8 2.1 1.2 3.6 1.2s2.7-.4 3.6-1.2
              '
              dur='1.2s'
              repeatCount='indefinite'
            />
          </path>
          <g
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeWidth='1.5'
            opacity='0.72'
          >
            <path d='M11 17.5 8.8 19.5' />
            <path d='M14.2 18.4 12.9 20.3' />
            <path d='M23 17.5 25.2 19.5' />
            <path d='M19.8 18.4 21.1 20.3' />
          </g>
        </g>
      </svg>
      <span className='text-sm italic text-muted-foreground'>
        {getTypingText()}
      </span>
    </div>
  )
}
