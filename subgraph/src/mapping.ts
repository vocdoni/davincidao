import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts"
import {
  Delegated as DelegatedEvent,
  Undelegated as UndelegatedEvent,
  DelegatedBatch as DelegatedBatchEvent,
  UndelegatedBatch as UndelegatedBatchEvent,
  CensusRootUpdated as CensusRootUpdatedEvent
} from "../generated/DavinciDao/DavinciDao"
import { Account, TokenDelegation, CensusRoot, GlobalStats } from "../generated/schema"

// Helper to generate unique ID from transaction
function idFromTx(txHash: Bytes, logIndex: BigInt): string {
  return txHash.toHex() + "-" + logIndex.toString()
}

// Helper to load or create Account
function loadOrCreateAccount(address: Bytes, timestamp: BigInt, blockNumber: BigInt): Account {
  let id = address.toHexString().toLowerCase()
  let account = Account.load(id)

  if (account == null) {
    account = new Account(id)
    account.address = address
    account.weight = BigInt.fromI32(0)
    account.lastUpdatedAt = timestamp
    account.lastUpdatedBlock = blockNumber
    account.save()

    // Update global stats - new account
    updateGlobalStats(timestamp, true, false)
  }

  return account
}

// Helper to load or create GlobalStats
function loadOrCreateGlobalStats(timestamp: BigInt): GlobalStats {
  let id = "global"
  let stats = GlobalStats.load(id)

  if (stats == null) {
    stats = new GlobalStats(id)
    stats.totalDelegations = BigInt.fromI32(0)
    stats.totalAccounts = BigInt.fromI32(0)
    stats.totalWeight = BigInt.fromI32(0)
    stats.lastUpdatedAt = timestamp
    stats.save()
  }

  return stats
}

// Helper to update global statistics
function updateGlobalStats(timestamp: BigInt, accountAdded: boolean, weightChanged: i32): void {
  let stats = loadOrCreateGlobalStats(timestamp)

  if (accountAdded) {
    stats.totalAccounts = stats.totalAccounts.plus(BigInt.fromI32(1))
  }

  if (weightChanged != 0) {
    let newTotal = stats.totalWeight.plus(BigInt.fromI32(weightChanged))
    if (newTotal.lt(BigInt.fromI32(0))) {
      newTotal = BigInt.fromI32(0) // Safety check
    }
    stats.totalWeight = newTotal
  }

  stats.lastUpdatedAt = timestamp
  stats.save()
}

export function handleDelegated(event: DelegatedEvent): void {
  let tokenId = event.params.tokenId
  let nftIndex = event.params.nftIndex
  let owner = event.params.owner
  let delegate = event.params.to

  // Create unique ID for this token delegation
  let delegationId = nftIndex.toString() + "-" + tokenId.toString()

  // Load or create token delegation
  let delegation = TokenDelegation.load(delegationId)
  let wasAlreadyDelegated = false
  let oldDelegate: Bytes | null = null

  if (delegation == null) {
    delegation = new TokenDelegation(delegationId)
    delegation.nftIndex = nftIndex
    delegation.tokenId = tokenId
  } else {
    // This token was previously delegated
    if (delegation.isDelegated && delegation.delegate.notEqual(Bytes.empty())) {
      wasAlreadyDelegated = true
      oldDelegate = delegation.delegate
    }
  }

  // Update delegation
  delegation.delegate = delegate
  delegation.owner = owner
  delegation.isDelegated = true
  delegation.delegatedAt = event.block.timestamp
  delegation.delegatedBlock = event.block.number
  delegation.transactionHash = event.transaction.hash

  // Link to Account (for @derivedFrom)
  let delegateAccount = loadOrCreateAccount(delegate, event.block.timestamp, event.block.number)
  delegation.delegateAccount = delegateAccount.id

  delegation.save()

  // If this token was previously delegated to someone else, decrease their weight
  if (wasAlreadyDelegated && oldDelegate !== null) {
    let oldDelegateAccount = loadOrCreateAccount(oldDelegate as Bytes, event.block.timestamp, event.block.number)
    oldDelegateAccount.weight = oldDelegateAccount.weight.minus(BigInt.fromI32(1))
    oldDelegateAccount.lastUpdatedAt = event.block.timestamp
    oldDelegateAccount.lastUpdatedBlock = event.block.number
    oldDelegateAccount.save()

    // If old delegate now has zero weight, decrement total accounts
    if (oldDelegateAccount.weight.equals(BigInt.fromI32(0))) {
      updateGlobalStats(event.block.timestamp, false, -1)
      let stats = loadOrCreateGlobalStats(event.block.timestamp)
      stats.totalAccounts = stats.totalAccounts.minus(BigInt.fromI32(1))
      stats.save()
    } else {
      updateGlobalStats(event.block.timestamp, false, -1)
    }
  }

  // Increase new delegate's weight
  delegateAccount.weight = delegateAccount.weight.plus(BigInt.fromI32(1))
  delegateAccount.lastUpdatedAt = event.block.timestamp
  delegateAccount.lastUpdatedBlock = event.block.number
  delegateAccount.save()

  // Update global stats
  if (!wasAlreadyDelegated) {
    // This is a new delegation (not a move)
    let stats = loadOrCreateGlobalStats(event.block.timestamp)
    stats.totalDelegations = stats.totalDelegations.plus(BigInt.fromI32(1))
    stats.save()
    updateGlobalStats(event.block.timestamp, false, 1)
  } else {
    // This is a move (already counted in totalDelegations)
    updateGlobalStats(event.block.timestamp, false, 1)
  }
}

export function handleUndelegated(event: UndelegatedEvent): void {
  let tokenId = event.params.tokenId
  let nftIndex = event.params.nftIndex
  let owner = event.params.owner
  let delegate = event.params.from

  // Create unique ID for this token delegation
  let delegationId = nftIndex.toString() + "-" + tokenId.toString()

  // Load delegation (must exist for undelegation)
  let delegation = TokenDelegation.load(delegationId)

  if (delegation == null) {
    // This shouldn't happen in normal flow, but handle it gracefully
    delegation = new TokenDelegation(delegationId)
    delegation.nftIndex = nftIndex
    delegation.tokenId = tokenId
  }

  // Update delegation to undelegated state
  delegation.delegate = Bytes.empty()
  delegation.delegateAccount = null
  delegation.owner = owner
  delegation.isDelegated = false
  delegation.delegatedAt = event.block.timestamp
  delegation.delegatedBlock = event.block.number
  delegation.transactionHash = event.transaction.hash
  delegation.save()

  // Decrease delegate's weight
  let delegateAccount = loadOrCreateAccount(delegate, event.block.timestamp, event.block.number)
  delegateAccount.weight = delegateAccount.weight.minus(BigInt.fromI32(1))
  delegateAccount.lastUpdatedAt = event.block.timestamp
  delegateAccount.lastUpdatedBlock = event.block.number
  delegateAccount.save()

  // Update global stats
  let stats = loadOrCreateGlobalStats(event.block.timestamp)
  stats.totalDelegations = stats.totalDelegations.minus(BigInt.fromI32(1))
  stats.totalWeight = stats.totalWeight.minus(BigInt.fromI32(1))

  // If delegate now has zero weight, decrement total accounts
  if (delegateAccount.weight.equals(BigInt.fromI32(0))) {
    stats.totalAccounts = stats.totalAccounts.minus(BigInt.fromI32(1))
  }

  stats.lastUpdatedAt = event.block.timestamp
  stats.save()
}

export function handleCensusRootUpdated(event: CensusRootUpdatedEvent): void {
  let id = idFromTx(event.transaction.hash, event.logIndex)
  let censusRoot = new CensusRoot(id)

  censusRoot.root = event.params.newRoot
  censusRoot.updater = event.transaction.from
  censusRoot.blockNumber = event.params.blockNumber
  censusRoot.blockTimestamp = event.block.timestamp
  censusRoot.transactionHash = event.transaction.hash

  censusRoot.save()
}

export function handleDelegatedBatch(event: DelegatedBatchEvent): void {
  let tokenIds = event.params.tokenIds
  let nftIndex = event.params.nftIndex
  let owner = event.params.owner
  let delegate = event.params.to

  // Load or create delegate account once for all tokens
  let delegateAccount = loadOrCreateAccount(delegate, event.block.timestamp, event.block.number)
  let newDelegations = 0
  let weightIncrease = 0

  // Process each token in the batch
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenId = tokenIds[i]
    let delegationId = nftIndex.toString() + "-" + tokenId.toString()

    // Load or create token delegation
    let delegation = TokenDelegation.load(delegationId)
    let wasAlreadyDelegated = false
    let oldDelegate: Bytes | null = null

    if (delegation == null) {
      delegation = new TokenDelegation(delegationId)
      delegation.nftIndex = nftIndex
      delegation.tokenId = tokenId
    } else {
      // This token was previously delegated
      if (delegation.isDelegated && delegation.delegate.notEqual(Bytes.empty())) {
        wasAlreadyDelegated = true
        oldDelegate = delegation.delegate
      }
    }

    // Update delegation
    delegation.delegate = delegate
    delegation.owner = owner
    delegation.isDelegated = true
    delegation.delegatedAt = event.block.timestamp
    delegation.delegatedBlock = event.block.number
    delegation.transactionHash = event.transaction.hash
    delegation.delegateAccount = delegateAccount.id
    delegation.save()

    // Track old delegate weight decrease
    if (wasAlreadyDelegated && oldDelegate !== null) {
      let oldDelegateAccount = loadOrCreateAccount(oldDelegate as Bytes, event.block.timestamp, event.block.number)
      oldDelegateAccount.weight = oldDelegateAccount.weight.minus(BigInt.fromI32(1))
      oldDelegateAccount.lastUpdatedAt = event.block.timestamp
      oldDelegateAccount.lastUpdatedBlock = event.block.number
      oldDelegateAccount.save()

      // If old delegate now has zero weight, decrement total accounts
      if (oldDelegateAccount.weight.equals(BigInt.fromI32(0))) {
        let stats = loadOrCreateGlobalStats(event.block.timestamp)
        stats.totalAccounts = stats.totalAccounts.minus(BigInt.fromI32(1))
        stats.totalWeight = stats.totalWeight.minus(BigInt.fromI32(1))
        stats.save()
      } else {
        updateGlobalStats(event.block.timestamp, false, -1)
      }
    } else {
      newDelegations += 1
      weightIncrease += 1
    }
  }

  // Update new delegate's weight once for all tokens
  delegateAccount.weight = delegateAccount.weight.plus(BigInt.fromI32(tokenIds.length))
  delegateAccount.lastUpdatedAt = event.block.timestamp
  delegateAccount.lastUpdatedBlock = event.block.number
  delegateAccount.save()

  // Update global stats
  if (newDelegations > 0) {
    let stats = loadOrCreateGlobalStats(event.block.timestamp)
    stats.totalDelegations = stats.totalDelegations.plus(BigInt.fromI32(newDelegations))
    stats.totalWeight = stats.totalWeight.plus(BigInt.fromI32(weightIncrease))
    stats.lastUpdatedAt = event.block.timestamp
    stats.save()
  }
}

export function handleUndelegatedBatch(event: UndelegatedBatchEvent): void {
  let tokenIds = event.params.tokenIds
  let nftIndex = event.params.nftIndex
  let owner = event.params.owner
  let delegate = event.params.from

  // Load delegate account once for all tokens
  let delegateAccount = loadOrCreateAccount(delegate, event.block.timestamp, event.block.number)

  // Process each token in the batch
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenId = tokenIds[i]
    let delegationId = nftIndex.toString() + "-" + tokenId.toString()

    // Load delegation (must exist for undelegation)
    let delegation = TokenDelegation.load(delegationId)

    if (delegation == null) {
      // This shouldn't happen in normal flow, but handle it gracefully
      delegation = new TokenDelegation(delegationId)
      delegation.nftIndex = nftIndex
      delegation.tokenId = tokenId
    }

    // Update delegation to undelegated state
    delegation.delegate = Bytes.empty()
    delegation.delegateAccount = null
    delegation.owner = owner
    delegation.isDelegated = false
    delegation.delegatedAt = event.block.timestamp
    delegation.delegatedBlock = event.block.number
    delegation.transactionHash = event.transaction.hash
    delegation.save()
  }

  // Decrease delegate's weight once for all tokens
  delegateAccount.weight = delegateAccount.weight.minus(BigInt.fromI32(tokenIds.length))
  delegateAccount.lastUpdatedAt = event.block.timestamp
  delegateAccount.lastUpdatedBlock = event.block.number
  delegateAccount.save()

  // Update global stats
  let stats = loadOrCreateGlobalStats(event.block.timestamp)
  stats.totalDelegations = stats.totalDelegations.minus(BigInt.fromI32(tokenIds.length))
  stats.totalWeight = stats.totalWeight.minus(BigInt.fromI32(tokenIds.length))

  // If delegate now has zero weight, decrement total accounts
  if (delegateAccount.weight.equals(BigInt.fromI32(0))) {
    stats.totalAccounts = stats.totalAccounts.minus(BigInt.fromI32(1))
  }

  stats.lastUpdatedAt = event.block.timestamp
  stats.save()
}
