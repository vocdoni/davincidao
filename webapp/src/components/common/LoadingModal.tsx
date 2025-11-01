import { useState, useEffect } from 'react'

interface LoadingModalProps {
  isOpen: boolean
  message?: string
}

const LOADING_MESSAGES = [
  'SCANNING BLOCKCHAIN...',
  'DECODING NFT METADATA...',
  'QUERYING ALCHEMY API...',
  'VERIFYING OWNERSHIP...',
  'INDEXING COLLECTIONS...',
  'CALCULATING VOTING POWER...',
  'RECONSTRUCTING MERKLE TREE...',
  'SYNCING WITH SUBGRAPH...',
  'VALIDATING DELEGATIONS...',
  'COMPILING CENSUS DATA...',
]

const ASCII_FRAMES = [
  `
   ▓▓▓░░░░░░░
   ░░░▓▓▓░░░░
   ░░░░░░▓▓▓░
  `,
  `
   ░▓▓▓░░░░░░
   ░░░░▓▓▓░░░
   ░░░░░░░▓▓▓
  `,
  `
   ░░▓▓▓░░░░░
   ▓░░░░▓▓▓░░
   ░░░░░░░░▓▓
  `,
  `
   ░░░▓▓▓░░░░
   ░▓░░░░▓▓▓░
   ▓▓░░░░░░░▓
  `,
]

export const LoadingModal = ({ isOpen, message }: LoadingModalProps) => {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [dots, setDots] = useState('.')

  useEffect(() => {
    if (!isOpen) return

    // Rotate loading messages
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 2000)

    // Animate ASCII frames
    const frameInterval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % ASCII_FRAMES.length)
    }, 150)

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.'
        return prev + '.'
      })
    }, 500)

    return () => {
      clearInterval(messageInterval)
      clearInterval(frameInterval)
      clearInterval(dotsInterval)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

        {/* Modal */}
        <div className="relative bg-black border-2 border-white w-full max-w-lg">
          {/* ASCII Art Animation */}
          <div className="border-b-2 border-white p-8 text-center bg-black">
            <pre className="text-white font-mono text-sm leading-tight whitespace-pre terminal-accent select-none">
              {ASCII_FRAMES[currentFrame]}
            </pre>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Main Loading Message */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-white bg-black">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-white font-mono text-xs uppercase tracking-wider">
                  {message || LOADING_MESSAGES[currentMessage]}
                </span>
              </div>
            </div>

            {/* Progress Text */}
            <div className="space-y-2 mb-6">
              <div className="text-white font-mono text-xs opacity-70">
                &gt; INITIALIZING NFT DISCOVERY{dots}
              </div>
              <div className="text-white font-mono text-xs opacity-70">
                &gt; THIS MAY TAKE A FEW MOMENTS{dots}
              </div>
            </div>

            {/* Fun ASCII Art */}
            <div className="border-t-2 border-white pt-6">
              <pre className="text-white font-mono text-xs opacity-50 select-none">
{`
    ╔═══════════════╗
    ║   LOADING...  ║
    ╚═══════════════╝
         ╱|、
        (˚ˎ 。7
         |、˜〵
        じしˍ,)ノ
`}
              </pre>
            </div>

            {/* Blinking Cursor */}
            <div className="mt-4">
              <span className="text-white font-mono text-sm terminal-accent animate-pulse">▊</span>
            </div>
          </div>

          {/* Bottom Border Effect */}
          <div className="border-t-2 border-white bg-black p-3">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
              <span className="text-white font-mono text-xs opacity-50">[ PLEASE WAIT ]</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
