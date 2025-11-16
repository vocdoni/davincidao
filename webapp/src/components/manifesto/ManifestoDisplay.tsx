import { ManifestoMetadata } from '~/types'

interface ManifestoDisplayProps {
  metadata: ManifestoMetadata | null
  loading?: boolean
}

// Parse manifesto text with simple markdown-like formatting
function parseManifestoText(text: string) {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []

  lines.forEach((line, index) => {
    // Handle headers (lines starting with #)
    if (line.startsWith('# ')) {
      const title = line.replace('# ', '')
      elements.push(
        <h1
          key={index}
          className="text-center mb-10 mt-2"
          style={{
            fontFamily: "'EB Garamond', serif",
            fontSize: 'clamp(1.25rem, 3.5vw, 2rem)',
            fontWeight: 800,
            color: '#2a1f0f',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            lineHeight: '1.3em',
            textShadow: '1px 1px 2px rgba(0,0,0,0.08)',
            wordWrap: 'break-word',
            hyphens: 'auto'
          }}
        >
          {title}
        </h1>
      )
    }
    // Handle subheaders (lines starting with ##)
    else if (line.startsWith('## ')) {
      elements.push(
        <h4 key={index} className="text-2xl mt-8 mb-4 text-left" style={{
          fontFamily: "'EB Garamond', serif",
          fontWeight: 600,
          lineHeight: '1.2em',
          color: '#3a2f1f',
          letterSpacing: '0.01em'
        }}>
          {line.replace('## ', '')}
        </h4>
      )
    }
    // Handle empty lines
    else if (line.trim() === '') {
      elements.push(<div key={index} className="h-2"></div>)
    }
    // Handle regular text with bold (**text**)
    else {
      const parts = line.split(/(\*\*.*?\*\*)/)
      elements.push(
        <p key={index} className="mb-2 text-left text-lg" style={{
          fontFamily: "'EB Garamond', serif",
          lineHeight: '1.5em',
          color: '#3a2f1f',
          fontWeight: 400
        }}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} style={{ fontWeight: 600, color: '#2a1f0f' }}>{part.slice(2, -2)}</strong>
            }
            return <span key={i}>{part}</span>
          })}
        </p>
      )
    }
  })

  return elements
}

export function ManifestoDisplay({ metadata, loading }: ManifestoDisplayProps) {
  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-[#f5e6d3] via-[#f0ddc0] to-[#e8d4b8] rounded-2xl border-2 border-[#c4a57b] p-6 md:p-10 shadow-2xl">
        <div className="animate-pulse max-w-4xl mx-auto">
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
      <div className="relative bg-gradient-to-br from-[#f5e6d3] via-[#f0ddc0] to-[#e8d4b8] rounded-2xl border-2 border-[#c4a57b] p-6 md:p-10 shadow-2xl">
        <p className="text-center font-light" style={{ color: '#3a2f1f' }}>Loading manifesto...</p>
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-br from-[#f5e6d3]/90 via-[#f0ddc0]/85 to-[#e8d4b8]/90 rounded-2xl border-2 border-[#c4a57b] p-6 md:p-10 shadow-2xl"
         style={{
           boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06), 0 10px 30px rgba(0,0,0,0.15)',
           backgroundImage: `
             repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,115,85,0.03) 2px, rgba(139,115,85,0.03) 4px),
             repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,115,85,0.03) 2px, rgba(139,115,85,0.03) 4px),
             radial-gradient(ellipse at top left, rgba(255,255,255,0.3), transparent 40%),
             radial-gradient(ellipse at bottom right, rgba(139,115,85,0.15), transparent 40%)
           `
         }}>
      {/* Aged paper texture overlay */}
      <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
             mixBlendMode: 'multiply'
           }}></div>

      {/* Burn/fade edges effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
           style={{
             boxShadow: 'inset 0 0 60px rgba(139,115,85,0.2), inset 0 0 20px rgba(139,115,85,0.1)'
           }}></div>

      {/* Manifesto Content */}
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-base md:text-lg" style={{
          textShadow: '0 1px 1px rgba(255,255,255,0.5)',
          color: '#3a2f1f'
        }}>
          {parseManifestoText(metadata.manifestoText)}
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
