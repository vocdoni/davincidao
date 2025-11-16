/**
 * Type definitions for DAVINCI Manifesto Census
 */

export interface Signer {
  address: string
  pledgeTimestamp: number
  pledgeBlock: number
  transactionHash: string
  treeIndex: number
}

export interface ManifestoMetadata {
  title: string
  authors: string
  date: string
  manifestoText: string
}

export interface PledgeStatus {
  hasPledged: boolean
  timestamp: number
  blockNumber?: number
}

export interface CensusInfo {
  root: string
  totalPledges: number
  blockNumber?: number
}
