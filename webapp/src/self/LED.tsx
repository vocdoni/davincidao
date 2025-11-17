import { QRcodeSteps, type QRCodeStep } from './steps'

interface Props {
  size?: number
  status?: QRCodeStep
}

const COLORS = {
  green: '#31F040',
  blue: '#424AD8',
  gray: '#95a5a6'
}

export function StatusLED({ size = 10, status = QRcodeSteps.DISCONNECTED }: Props) {
  const color =
    status >= QRcodeSteps.PROOF_GENERATED
      ? COLORS.green
      : status >= QRcodeSteps.WAITING_FOR_MOBILE
        ? COLORS.blue
        : COLORS.gray

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        backgroundColor: color,
        boxShadow: `0 0 ${size * 1.5}px ${color}`,
        transition: 'all 0.3s ease'
      }}
    />
  )
}
