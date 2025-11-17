import { v4 as uuidv4 } from 'uuid'

export type EndpointType = 'https' | 'staging_https' | 'celo' | 'staging_celo'
export type UserIdType = 'hex' | 'uuid'

export interface SelfApp {
  appName: string
  logoBase64: string
  endpointType: EndpointType
  endpoint: string
  deeplinkCallback: string
  header: string
  scope: string
  sessionId: string
  userId: string
  userIdType: UserIdType
  devMode: boolean
  disclosures: Record<string, unknown>
  version: number
  chainID: 42220 | 11142220
  userDefinedData: string
}

export interface BuildSelfAppConfig {
  appName: string
  logoBase64?: string
  scope: string
  endpoint: string
  endpointType?: EndpointType
  deeplinkCallback?: string
  userId: string
  userIdType?: UserIdType
  disclosures?: Record<string, unknown>
  version?: number
  userDefinedData?: string
}

export const REDIRECT_URL = 'https://redirect.self.xyz'
export const WS_DB_RELAYER = 'wss://websocket.self.xyz'

const HEX_REGEX = /^[0-9A-Fa-f]+$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isAscii(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 127) {
      return false
    }
  }
  return true
}

function validateUserId(userId: string, type: UserIdType): boolean {
  if (type === 'hex') {
    return HEX_REGEX.test(userId)
  }
  return UUID_REGEX.test(userId)
}

function formatEndpoint(endpoint: string): string {
  return endpoint.replace(/^https?:\/\//, '').split('/')[0]
}

export function buildSelfApp(config: BuildSelfAppConfig): SelfApp {
  if (!config.appName) throw new Error('appName is required')
  if (!config.scope) throw new Error('scope is required')
  if (!config.endpoint) throw new Error('endpoint is required')
  if (!config.userId) throw new Error('userId is required')

  if (!isAscii(config.scope)) {
    throw new Error('scope must contain only ASCII characters')
  }
  if (config.scope.length > 31) {
    throw new Error('scope must be less than 31 characters')
  }

  const endpointType = config.endpointType ?? 'celo'
  if (endpointType === 'https' && !config.endpoint.startsWith('https://')) {
    throw new Error('https endpoints must start with https://')
  }
  if (endpointType === 'celo' && !config.endpoint.startsWith('0x')) {
    throw new Error('celo endpoints must be a contract address')
  }
  if (config.endpoint.includes('localhost') || config.endpoint.includes('127.0.0.1')) {
    throw new Error('localhost endpoints are not allowed')
  }

  const formattedEndpoint = formatEndpoint(config.endpoint)
  if (formattedEndpoint.length > 496) {
    throw new Error('endpoint must be less than 496 characters')
  }

  let normalizedUserId = config.userId
  const userIdType = config.userIdType ?? 'hex'
  if (userIdType === 'hex') {
    normalizedUserId = normalizedUserId.startsWith('0x')
      ? normalizedUserId.slice(2)
      : normalizedUserId
  }
  if (!validateUserId(normalizedUserId, userIdType)) {
    throw new Error('userId must be a valid address or UUID')
  }

  return {
    appName: config.appName,
    logoBase64: config.logoBase64 ?? '',
    endpointType,
    endpoint: config.endpoint,
    deeplinkCallback: config.deeplinkCallback ?? '',
    header: '',
    scope: config.scope,
    sessionId: uuidv4(),
    userId: normalizedUserId,
    userIdType,
    devMode: false,
    disclosures: config.disclosures ?? {},
    version: config.version ?? 2,
    chainID: endpointType === 'staging_celo' ? 11142220 : 42220,
    userDefinedData: config.userDefinedData ?? ''
  }
}

export function getUniversalLink(selfApp: SelfApp): string {
  return `${REDIRECT_URL}?selfApp=${encodeURIComponent(JSON.stringify(selfApp))}`
}
