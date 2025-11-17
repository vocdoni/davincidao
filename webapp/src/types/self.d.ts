declare module '@selfxyz/qrcode' {
  import type { JSX } from 'react'

  export interface SelfApp {
    appName: string
    scope: string
    endpoint: string
    endpointType: string
    userIdType: 'hex' | 'uuid'
    userId: string
    logoBase64?: string
    userDefinedData?: string
    deeplinkCallback?: string
    disclosures: Record<string, unknown>
    [key: string]: unknown
  }

  export interface SelfAppBuilderConfig {
    version: number
    appName: string
    scope: string
    endpoint: string
    endpointType: string
    userIdType: 'hex' | 'uuid'
    userId: string
    logoBase64?: string
    userDefinedData?: string
    deeplinkCallback?: string
    disclosures: Record<string, unknown>
  }

  export class SelfAppBuilder {
    constructor(config: SelfAppBuilderConfig)
    build(): SelfApp
  }

  export interface SelfQRcodeWrapperProps {
    selfApp: SelfApp
    type?: 'websocket' | 'deeplink'
    websocketUrl?: string
    size?: number
    darkMode?: boolean
    onSuccess?: () => void
    onError?: (data?: { error_code?: string; reason?: string }) => void
  }

  export const SelfQRcodeWrapper: (props: SelfQRcodeWrapperProps) => JSX.Element
}

declare module '@selfxyz/core' {
  import type { SelfApp } from '@selfxyz/qrcode'
  export function getUniversalLink(app: SelfApp): string
}
