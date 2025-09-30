export interface DelegateInfo {
  address: string
  currentTokens: string[]
  pendingTokens: string[]
  currentCount: number
  pendingCount: number
  weight: number
}

export interface DelegationChange {
  type: 'add' | 'remove' | 'update'
  from?: string
  to: string
  tokenIds: string[]
  collectionIndex: number
  requiresProof: boolean
}

export interface DelegationState {
  ownedTokens: Map<number, string[]> // collectionIndex -> tokenIds
  delegates: Map<string, DelegateInfo>
  pendingChanges: DelegationChange[]
  availableTokens: Map<number, number> // collectionIndex -> count
  collectionAddresses: Map<number, string> // collectionIndex -> contract address
  totalOwnedTokens: number
  totalDelegatedTokens: number
}

export interface TransactionPlan {
  operations: DelegationOperation[]
  estimatedGas?: bigint
  requiresProofs: boolean
  currentOperationIndex: number
  isExecuting: boolean
  isTreeReconstructing: boolean
}

export type OperationStatus = 'pending' | 'executing' | 'completed' | 'failed'

export interface DelegationOperation {
  id: string
  type: 'delegate' | 'undelegate' | 'updateDelegation'
  description: string
  collectionIndex: number
  tokenIds: string[]
  to?: string
  from?: string
  proofs?: string[]
  status: OperationStatus
  txHash?: string
  error?: string
}

export interface ProofRequirement {
  address: string
  currentWeight: number
  needsProof: boolean
}
