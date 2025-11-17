import { io } from 'socket.io-client'
import type { SelfApp } from './builder'
import { QRcodeSteps, type QRCodeStep } from './steps'

interface MobileStatusEvent {
  status: string
  error_code?: string
  reason?: string
}

type StatusSetter = (step: QRCodeStep) => void

type Callback = (data?: { error_code?: string; reason?: string }) => void

export function initWebSocket(
  websocketUrl: string,
  selfApp: SelfApp,
  type: 'websocket' | 'deeplink',
  setProofStep: StatusSetter,
  onSuccess: () => void,
  onError: Callback
) {
  if (websocketUrl.includes('localhost') || websocketUrl.includes('127.0.0.1')) {
    throw new Error('localhost websocket URLs are not allowed')
  }

  const socket = io(`${websocketUrl}/websocket`, {
    path: '/',
    query: { sessionId: selfApp.sessionId, clientType: 'web' },
    transports: ['websocket']
  })

  socket.on('mobile_status', (data: MobileStatusEvent) => {
    switch (data.status) {
      case 'mobile_connected':
        setProofStep(QRcodeSteps.MOBILE_CONNECTED)
        if (type === 'websocket') {
          socket.emit('self_app', selfApp)
        }
        break
      case 'mobile_disconnected':
        setProofStep(QRcodeSteps.WAITING_FOR_MOBILE)
        break
      case 'proof_generation_started':
        setProofStep(QRcodeSteps.PROOF_GENERATION_STARTED)
        break
      case 'proof_generated':
        setProofStep(QRcodeSteps.PROOF_GENERATED)
        break
      case 'proof_generation_failed':
        setProofStep(QRcodeSteps.PROOF_GENERATION_FAILED)
        onError(data)
        break
      case 'proof_verified':
        setProofStep(QRcodeSteps.PROOF_VERIFIED)
        onSuccess()
        break
      default:
        break
    }
  })

  socket.on('disconnect', () => {
    setProofStep(QRcodeSteps.WAITING_FOR_MOBILE)
  })

  return () => {
    socket.disconnect()
  }
}
