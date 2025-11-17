import { ManifestoMetadata } from '~/types'

interface ManifestoDisplayProps {
  metadata: ManifestoMetadata | null
  loading?: boolean
  darkMode?: boolean
  totalPledges?: number
}

// Parse manifesto text with proper paragraph handling
function parseManifestoText(text: string, darkMode: boolean = false) {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let currentParagraph: string[] = []
  let elementIndex = 0
  const baseTextClass = darkMode ? 'text-gray-100' : 'text-gray-800'
  const strongTextClass = darkMode ? 'text-white' : 'text-gray-900'
  const headingTextClass = darkMode ? 'text-gray-100' : 'text-gray-900'
  const subheadingTextClass = darkMode ? 'text-gray-100' : 'text-gray-800'

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join('\n')
      const parts = paragraphText.split(/(\*\*.*?\*\*)/)

      elements.push(
        <p key={`p-${elementIndex++}`} className={`mb-4 text-left ${baseTextClass}`} style={{
          fontFamily: "'EB Garamond', serif",
          fontSize: '1.125rem',
          lineHeight: '1.4em',
          fontWeight: 400
        }}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className={strongTextClass} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>
            }
            // Replace \n with <br> for line breaks within paragraph
            return part.split('\n').map((segment, j, arr) => (
              <span key={`${i}-${j}`}>
                {segment}
                {j < arr.length - 1 && <br />}
              </span>
            ))
          })}
        </p>
      )
      currentParagraph = []
    }
  }

  lines.forEach((line) => {
    // Handle headers (lines starting with #)
    if (line.startsWith('# ')) {
      flushParagraph()
      const title = line.replace('# ', '')
      elements.push(
        <div key={`h-wrapper-${elementIndex++}`}>
          <h1
            className={`text-center mb-4 mt-2 ${headingTextClass}`}
            style={{
              fontFamily: "'EB Garamond', serif",
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              lineHeight: '1.3em',
              textShadow: 'none',
              wordWrap: 'break-word',
              hyphens: 'auto'
            }}
          >
            {title}
          </h1>
          <div className={`mb-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
        </div>
      )
    }
    // Handle subheaders (lines starting with ##)
    else if (line.startsWith('## ')) {
      flushParagraph()
      elements.push(
        <h4 key={`h4-${elementIndex++}`} className={`text-2xl mt-8 mb-4 text-left ${subheadingTextClass}`} style={{
          fontFamily: "'EB Garamond', serif",
          fontWeight: 600,
          lineHeight: '1.2em',
          letterSpacing: '0.01em'
        }}>
          {line.replace('## ', '')}
        </h4>
      )
    }
    // Handle empty lines (paragraph separator)
    else if (line.trim() === '') {
      flushParagraph()
    }
    // Accumulate lines for current paragraph
    else {
      currentParagraph.push(line)
    }
  })

  // Flush any remaining paragraph
  flushParagraph()

  return elements
}

export function ManifestoDisplay({ metadata, loading, darkMode = false, totalPledges }: ManifestoDisplayProps) {
  const containerClasses =
    'relative rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] p-6 md:p-10 shadow-xl transition-colors duration-300 mx-auto'

  if (loading) {
    return (
      <div className={containerClasses} style={{ width: '100%' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200/80 dark:bg-white/10 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200/80 dark:bg-white/10 rounded w-1/2 mx-auto"></div>
          <div className="space-y-3 pt-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200/70 dark:bg-white/10 rounded" style={{ width: `${65 + Math.random() * 25}%`, margin: '0 auto' }}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!metadata) {
    return (
      <div className={containerClasses} style={{ width: '100%' }}>
        <p className="text-center text-gray-600 dark:text-gray-300">Loading manifesto...</p>
      </div>
    )
  }

  return (
    <div className={containerClasses} style={{ width: '100%' }}>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        {typeof totalPledges === 'number' && (
          <div className="min-w-[220px] rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-50 to-white dark:from-[#181818] dark:to-[#111111] p-4 text-center shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Signatures</p>
            <p className="text-4xl font-semibold text-gray-900 dark:text-white mt-1 leading-none">
              {totalPledges.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Verified on-chain with Self</p>
          </div>
        )}
      </div>
      <div style={{ fontSize: '1.125rem', textShadow: 'none' }}>{parseManifestoText(metadata.manifestoText, darkMode)}</div>
    </div>
  )
}
