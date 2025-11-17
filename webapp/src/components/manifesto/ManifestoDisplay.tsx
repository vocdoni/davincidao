import { ManifestoMetadata } from '~/types'

interface ManifestoDisplayProps {
  metadata: ManifestoMetadata | null
  loading?: boolean
  darkMode?: boolean
}

// Parse manifesto text with proper paragraph handling
// Returns { title, content } where title is the main heading and content is everything else
function parseManifestoText(text: string, darkMode: boolean = false) {
  const lines = text.split('\n')
  const titleElements: JSX.Element[] = []
  const contentElements: JSX.Element[] = []
  let currentParagraph: string[] = []
  let elementIndex = 0
  let titleFound = false

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join('\n')
      const parts = paragraphText.split(/(\*\*.*?\*\*)/)

      const paragraph = (
        <p key={`p-${elementIndex++}`} className="mb-4 text-left text-base sm:text-lg" style={{
          fontFamily: "'EB Garamond', serif",
          lineHeight: '1.6em',
          color: darkMode ? '#e8d4b8' : '#1a1410',
          fontWeight: 400
        }}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} style={{ fontWeight: 600, color: darkMode ? '#f5e6d3' : '#0a0806' }}>{part.slice(2, -2)}</strong>
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

      contentElements.push(paragraph)
      currentParagraph = []
    }
  }

  lines.forEach((line) => {
    // Handle headers (lines starting with #)
    if (line.startsWith('# ')) {
      flushParagraph()
      const title = line.replace('# ', '')
      titleElements.push(
        <div key={`h-wrapper-${elementIndex++}`}>
          <h1
            className="text-center mb-4 mt-2 text-2xl sm:text-3xl md:text-4xl px-2"
            style={{
              fontFamily: "'EB Garamond', serif",
              fontWeight: 800,
              color: darkMode ? '#f5e6d3' : '#0a0806',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              lineHeight: '1.3em',
              textShadow: darkMode ? '1px 1px 2px rgba(0,0,0,0.3)' : '1px 1px 2px rgba(0,0,0,0.08)',
              wordWrap: 'break-word',
              hyphens: 'auto'
            }}
          >
            {title}
          </h1>
          <div className="mb-6 border-b-2" style={{ borderColor: '#8b7355' }}></div>
        </div>
      )
      titleFound = true
    }
    // Handle subheaders (lines starting with ##)
    else if (line.startsWith('## ')) {
      flushParagraph()
      contentElements.push(
        <h4 key={`h4-${elementIndex++}`} className="text-xl sm:text-2xl mt-8 mb-4 text-left" style={{
          fontFamily: "'EB Garamond', serif",
          fontWeight: 600,
          lineHeight: '1.3em',
          color: darkMode ? '#e8d4b8' : '#1a1410',
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

  return { title: titleElements, content: contentElements }
}

export function ManifestoDisplay({ metadata, loading, darkMode = false }: ManifestoDisplayProps) {
  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-[#f5e6d3] via-[#f0ddc0] to-[#e8d4b8] rounded-2xl border-2 border-[#c4a57b] p-4 sm:p-6 md:p-10 shadow-2xl mx-auto w-full max-w-[590px]">
        <div className="animate-pulse">
          <div className="h-10 bg-[#c4a57b]/30 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-[#c4a57b]/30 rounded w-1/2 mx-auto mb-8"></div>
          <div className="space-y-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-3 bg-[#c4a57b]/30 rounded" style={{ width: `${60 + Math.random() * 40}%`, margin: '0 auto' }}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!metadata) {
    return (
      <div className="relative bg-gradient-to-br from-[#f5e6d3] via-[#f0ddc0] to-[#e8d4b8] rounded-2xl border-2 border-[#c4a57b] p-4 sm:p-6 md:p-10 shadow-2xl mx-auto w-full max-w-[590px]">
        <p className="text-center font-light" style={{ color: '#3a2f1f' }}>Loading manifesto...</p>
      </div>
    )
  }

  const bgColors = darkMode
    ? 'bg-gradient-to-br from-[#2a2520]/90 via-[#3a3530]/85 to-[#4a4540]/90'
    : 'bg-gradient-to-br from-[#f5e6d3]/90 via-[#f0ddc0]/85 to-[#e8d4b8]/90'

  const borderColor = darkMode ? 'border-[#6a6560]' : 'border-[#c4a57b]'

  const { title, content } = parseManifestoText(metadata.manifestoText, darkMode)

  return (
    <div className={`relative ${bgColors} rounded-2xl border-2 ${borderColor} p-4 sm:p-6 md:p-10 shadow-2xl transition-colors duration-300 mx-auto overflow-hidden w-full max-w-[590px]`}
         style={{
           boxShadow: darkMode
             ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.5)'
             : 'inset 0 2px 4px rgba(0,0,0,0.06), 0 10px 30px rgba(0,0,0,0.15)',
           backgroundImage: `
             repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,115,85,0.03) 2px, rgba(139,115,85,0.03) 4px),
             repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,115,85,0.03) 2px, rgba(139,115,85,0.03) 4px),
             radial-gradient(ellipse at top left, rgba(255,255,255,${darkMode ? '0.05' : '0.3'}), transparent 40%),
             radial-gradient(ellipse at bottom right, rgba(139,115,85,${darkMode ? '0.3' : '0.15'}), transparent 40%)
           `
         }}>
      {/* Aged paper texture overlay - full container */}
      <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
             mixBlendMode: 'multiply'
           }}></div>

      {/* Burn/fade edges effect - full container */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
           style={{
             boxShadow: 'inset 0 0 60px rgba(139,115,85,0.2), inset 0 0 20px rgba(139,115,85,0.1)'
           }}></div>

      {/* Title Section (without background) */}
      <div className="relative z-10">
        {title}
      </div>

      {/* Content Section (with Vitruvian Man background between the two lines) */}
      <div className="relative overflow-hidden">
        {/* Vitruvian Man background image - fills height between the two lines */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               backgroundImage: 'url(/background.png)',
               backgroundSize: 'auto 100%',
               backgroundPosition: 'center top',
               backgroundRepeat: 'no-repeat',
               opacity: darkMode ? 0.15 : 0.4,
               mixBlendMode: darkMode ? 'lighten' : 'normal',
               transition: 'opacity 300ms, mix-blend-mode 300ms'
             }}></div>

        <div className="relative z-10" style={{
          fontSize: '1.125rem',
          textShadow: darkMode ? '0 1px 1px rgba(0,0,0,0.3)' : '0 1px 1px rgba(255,255,255,0.3)'
        }}>
          {content}
        </div>
      </div>

      {/* Decorative footer with old manuscript style */}
      <div className="mt-12 pt-8 border-t-2 text-center relative z-10" style={{ borderColor: '#8b7355' }}>
        <div style={{
          fontFamily: "'EB Garamond', serif",
          color: '#8b7355',
          fontSize: '1.25rem',
          letterSpacing: '0.5em'
        }}>✦ ✦ ✦</div>
      </div>
    </div>
  )
}
