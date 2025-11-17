import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { BounceLoader } from 'react-spinners'
import Lottie from 'lottie-react'

import type { SelfApp } from './builder'
import { WS_DB_RELAYER, REDIRECT_URL } from './builder'
import { initWebSocket } from './websocket'
import { QRcodeSteps, type QRCodeStep } from './steps'
import { StatusLED } from './LED'
import CHECK_ANIMATION from './animations/check_animation.json'
import X_ANIMATION from './animations/x_animation.json'

interface Props {
  selfApp: SelfApp
  onSuccess: () => void
  onError: (data?: { error_code?: string; reason?: string }) => void
  websocketUrl?: string
  darkMode?: boolean
}

const stepCopy: Record<QRCodeStep, string> = {
  [QRcodeSteps.DISCONNECTED]: 'Preparing a secure session…',
  [QRcodeSteps.WAITING_FOR_MOBILE]: 'Scan the QR code with the Self app',
  [QRcodeSteps.MOBILE_CONNECTED]: 'Phone connected · preparing proof…',
  [QRcodeSteps.PROOF_GENERATION_STARTED]: 'Generating proof on your phone…',
  [QRcodeSteps.PROOF_GENERATION_FAILED]: 'Proof generation failed. Please retry.',
  [QRcodeSteps.PROOF_GENERATED]: 'Proof generated · sending to verifier…',
  [QRcodeSteps.PROOF_VERIFIED]: 'Proof verified!'
}

export function SelfQR({
  selfApp,
  onSuccess,
  onError,
  websocketUrl = WS_DB_RELAYER,
  darkMode = false
}: Props) {
  const [proofStep, setProofStep] = useState<QRCodeStep>(QRcodeSteps.WAITING_FOR_MOBILE)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    setProofStep(QRcodeSteps.WAITING_FOR_MOBILE)
    setErrorMessage(null)
    const cleanup = initWebSocket(websocketUrl, selfApp, 'websocket', setProofStep, onSuccess, (data) => {
      setErrorMessage(data?.reason || data?.error_code || 'Verification failed. Please try again.')
      onError(data)
    })
    return cleanup
  }, [selfApp, websocketUrl, isClient, onSuccess, onError])

  if (!isClient) {
    return null
  }

  const showSpinner =
    proofStep === QRcodeSteps.PROOF_GENERATION_STARTED || proofStep === QRcodeSteps.PROOF_GENERATED

  const animationData = proofStep === QRcodeSteps.PROOF_VERIFIED ? CHECK_ANIMATION : X_ANIMATION

  const showAnimation =
    proofStep === QRcodeSteps.PROOF_VERIFIED || proofStep === QRcodeSteps.PROOF_GENERATION_FAILED

  const qrValue = `${REDIRECT_URL}?sessionId=${selfApp.sessionId}`

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3">
        <StatusLED status={proofStep} />
        <p className="text-sm text-gray-800 dark:text-gray-200 text-center">{stepCopy[proofStep]}</p>
      </div>
      <div className="flex items-center justify-center rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-white/20 p-5 min-h-[360px] w-full">
        {showSpinner ? (
          <BounceLoader color="#31F040" loading size={200} />
        ) : showAnimation ? (
          <Lottie
            animationData={animationData}
            loop={false}
            onComplete={() => setProofStep(QRcodeSteps.WAITING_FOR_MOBILE)}
            style={{ width: 220, height: 220 }}
          />
        ) : (
          <QRCodeSVG
            value={qrValue}
            size={260}
            bgColor={darkMode ? '#000000' : '#ffffff'}
            fgColor={darkMode ? '#ffffff' : '#000000'}
            level="Q"
            includeMargin
          />
        )}
      </div>
      {errorMessage && <p className="text-xs text-red-600 mt-2">{errorMessage}</p>}
    </div>
  )
}
