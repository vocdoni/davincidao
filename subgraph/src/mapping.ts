import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts"
import {
  Delegated as DelegatedEvent,
  Undelegated as UndelegatedEvent,
  DelegatedBatch as DelegatedBatchEvent,
  UndelegatedBatch as UndelegatedBatchEvent,
  WeightChanged as WeightChangedEvent,
  CensusRootUpdated as CensusRootUpdatedEvent
} from "../generated/DavinciDao/DavinciDao"
import { Account, Delegator, TokenDelegation, CensusRoot, GlobalStats, WeightChangeEvent } from "../generated/schema"

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
    // Will be set when weight first becomes > 0
    account.firstInsertedBlock = BigInt.fromI32(0)
    account.firstInsertedAt = BigInt.fromI32(0)
    account.treeIndex = BigInt.fromI32(-1) // -1 means not in tree (weight is 0)
    account.save()

    // Update global stats - new account
    updateGlobalStats(timestamp, true, false)
  }

  return account
}

// Helper to load or create Delegator
function loadOrCreateDelegator(address: Bytes, timestamp: BigInt, blockNumber: BigInt): Delegator {
  let id = address.toHexString().toLowerCase()
  let delegator = Delegator.load(id)

  if (delegator == null) {
    delegator = new Delegator(id)
    delegator.address = address
    delegator.totalDelegationsMade = BigInt.fromI32(0)
    delegator.totalDelegationsEver = BigInt.fromI32(0)
    delegator.firstDelegatedAt = timestamp
    delegator.firstDelegatedBlock = blockNumber
    delegator.lastDelegatedAt = timestamp
    delegator.lastDelegatedBlock = blockNumber
    delegator.save()

    // Update global stats - new unique delegator
    let stats = loadOrCreateGlobalStats(timestamp)
    stats.totalUniqueDelegators = stats.totalUniqueDelegators.plus(BigInt.fromI32(1))
    stats.save()
  }

  return delegator
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
    stats.totalUniqueDelegators = BigInt.fromI32(0)
    stats.totalActiveDelegators = BigInt.fromI32(0)
    stats.lastUpdatedAt = timestamp
    stats.nextTreeIndex = BigInt.fromI32(0)
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
  let oldDelegatorAddress: Bytes | null = null

  if (delegation == null) {
    delegation = new TokenDelegation(delegationId)
    delegation.nftIndex = nftIndex
    delegation.tokenId = tokenId
  } else {
    // This token was previously delegated
    if (delegation.isDelegated && delegation.delegate.notEqual(Bytes.empty())) {
      wasAlreadyDelegated = true
      oldDelegate = delegation.delegate
      oldDelegatorAddress = delegation.delegatorAddress
    }
  }

  // Load or create delegator
  let delegator = loadOrCreateDelegator(owner, event.block.timestamp, event.block.number)
  let wasNewDelegation = !wasAlreadyDelegated || (oldDelegatorAddress !== null && !oldDelegatorAddress.equals(owner))

  // Update delegator counts
  if (wasNewDelegation) {
    delegator.totalDelegationsMade = delegator.totalDelegationsMade.plus(BigInt.fromI32(1))
    delegator.totalDelegationsEver = delegator.totalDelegationsEver.plus(BigInt.fromI32(1))
  }
  delegator.lastDelegatedAt = event.block.timestamp
  delegator.lastDelegatedBlock = event.block.number
  delegator.save()

  // Update delegation
  delegation.delegate = delegate
  delegation.owner = owner
  delegation.delegatorAddress = owner
  delegation.isDelegated = true
  delegation.delegatedAt = event.block.timestamp
  delegation.delegatedBlock = event.block.number
  delegation.transactionHash = event.transaction.hash

  // Link to Account (for @derivedFrom)
  let delegateAccount = loadOrCreateAccount(delegate, event.block.timestamp, event.block.number)
  delegation.delegateAccount = delegateAccount.id
  delegation.delegator = delegator.id

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

    // If the owner changed, decrease old delegator's count
    if (oldDelegatorAddress !== null && !oldDelegatorAddress.equals(owner)) {
      let oldDelegator = loadOrCreateDelegator(oldDelegatorAddress as Bytes, event.block.timestamp, event.block.number)
      oldDelegator.totalDelegationsMade = oldDelegator.totalDelegationsMade.minus(BigInt.fromI32(1))
      oldDelegator.save()

      // Update totalActiveDelegators if old delegator now has 0 delegations
      if (oldDelegator.totalDelegationsMade.equals(BigInt.fromI32(0))) {
        let stats = loadOrCreateGlobalStats(event.block.timestamp)
        stats.totalActiveDelegators = stats.totalActiveDelegators.minus(BigInt.fromI32(1))
        stats.save()
      }
    }
  }

  // Increase new delegate's weight
  let oldWeight = delegateAccount.weight
  delegateAccount.weight = delegateAccount.weight.plus(BigInt.fromI32(1))
  delegateAccount.lastUpdatedAt = event.block.timestamp
  delegateAccount.lastUpdatedBlock = event.block.number

  // Track first insertion into tree (when weight goes from 0 to > 0)
  if (oldWeight.equals(BigInt.fromI32(0))) {
    delegateAccount.firstInsertedBlock = event.block.number
    delegateAccount.firstInsertedAt = event.block.timestamp
  }

  delegateAccount.save()

  // Update global stats
  if (!wasAlreadyDelegated) {
    // This is a new delegation (not a move)
    let stats = loadOrCreateGlobalStats(event.block.timestamp)
    stats.totalDelegations = stats.totalDelegations.plus(BigInt.fromI32(1))

    // Update totalActiveDelegators if this delegator's first active delegation
    if (delegator.totalDelegationsMade.equals(BigInt.fromI32(1))) {
      stats.totalActiveDelegators = stats.totalActiveDelegators.plus(BigInt.fromI32(1))
    }

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

  // Load or create delegator and decrease their count
  let delegator = loadOrCreateDelegator(owner, event.block.timestamp, event.block.number)
  delegator.totalDelegationsMade = delegator.totalDelegationsMade.minus(BigInt.fromI32(1))
  delegator.save()

  // Update delegation to undelegated state
  delegation.delegate = Bytes.empty()
  delegation.delegateAccount = null
  delegation.delegator = null
  delegation.owner = owner
  delegation.delegatorAddress = owner
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

  // If delegator now has 0 active delegations, decrement totalActiveDelegators
  if (delegator.totalDelegationsMade.equals(BigInt.fromI32(0))) {
    stats.totalActiveDelegators = stats.totalActiveDelegators.minus(BigInt.fromI32(1))
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

  // Load or create delegate account and delegator once for all tokens
  let delegateAccount = loadOrCreateAccount(delegate, event.block.timestamp, event.block.number)
  let delegator = loadOrCreateDelegator(owner, event.block.timestamp, event.block.number)
  let newDelegations = 0
  let newDelegatorDelegations = 0
  let weightIncrease = 0

  // Track old delegators to decrease their counts
  let oldDelegatorCounts = new Map<string, i32>()

  // Process each token in the batch
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenId = tokenIds[i]
    let delegationId = nftIndex.toString() + "-" + tokenId.toString()

    // Load or create token delegation
    let delegation = TokenDelegation.load(delegationId)
    let wasAlreadyDelegated = false
    let oldDelegate: Bytes | null = null
    let oldDelegatorAddress: Bytes | null = null

    if (delegation == null) {
      delegation = new TokenDelegation(delegationId)
      delegation.nftIndex = nftIndex
      delegation.tokenId = tokenId
    } else {
      // This token was previously delegated
      if (delegation.isDelegated && delegation.delegate.notEqual(Bytes.empty())) {
        wasAlreadyDelegated = true
        oldDelegate = delegation.delegate
        oldDelegatorAddress = delegation.delegatorAddress
      }
    }

    // Track if this is a new delegation for this delegator
    let wasNewDelegation = !wasAlreadyDelegated || (oldDelegatorAddress !== null && !oldDelegatorAddress.equals(owner))
    if (wasNewDelegation) {
      newDelegatorDelegations += 1

      // Track old delegator decrease
      if (oldDelegatorAddress !== null && !oldDelegatorAddress.equals(owner)) {
        let oldDelegatorId = oldDelegatorAddress.toHexString().toLowerCase()
        let count = oldDelegatorCounts.has(oldDelegatorId) ? oldDelegatorCounts.get(oldDelegatorId) : 0
        oldDelegatorCounts.set(oldDelegatorId, count + 1)
      }
    }

    // Update delegation
    delegation.delegate = delegate
    delegation.owner = owner
    delegation.delegatorAddress = owner
    delegation.isDelegated = true
    delegation.delegatedAt = event.block.timestamp
    delegation.delegatedBlock = event.block.number
    delegation.transactionHash = event.transaction.hash
    delegation.delegateAccount = delegateAccount.id
    delegation.delegator = delegator.id
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

  // Update delegator counts
  let oldDelegatorCount = delegator.totalDelegationsMade
  delegator.totalDelegationsMade = delegator.totalDelegationsMade.plus(BigInt.fromI32(newDelegatorDelegations))
  delegator.totalDelegationsEver = delegator.totalDelegationsEver.plus(BigInt.fromI32(newDelegatorDelegations))
  delegator.lastDelegatedAt = event.block.timestamp
  delegator.lastDelegatedBlock = event.block.number
  delegator.save()

  // Process old delegators - decrease their counts
  let stats = loadOrCreateGlobalStats(event.block.timestamp)
  let keys = oldDelegatorCounts.keys()
  for (let i = 0; i < keys.length; i++) {
    let oldDelegatorId = keys[i]
    let count = oldDelegatorCounts.get(oldDelegatorId)
    let oldDelegatorEntity = Delegator.load(oldDelegatorId)
    if (oldDelegatorEntity !== null) {
      oldDelegatorEntity.totalDelegationsMade = oldDelegatorEntity.totalDelegationsMade.minus(BigInt.fromI32(count))
      oldDelegatorEntity.save()

      // If old delegator now has 0 delegations, decrement totalActiveDelegators
      if (oldDelegatorEntity.totalDelegationsMade.equals(BigInt.fromI32(0))) {
        stats.totalActiveDelegators = stats.totalActiveDelegators.minus(BigInt.fromI32(1))
      }
    }
  }

  // Update new delegate's weight once for all tokens
  let oldWeight = delegateAccount.weight
  delegateAccount.weight = delegateAccount.weight.plus(BigInt.fromI32(tokenIds.length))
  delegateAccount.lastUpdatedAt = event.block.timestamp
  delegateAccount.lastUpdatedBlock = event.block.number

  // Track first insertion into tree (when weight goes from 0 to > 0)
  if (oldWeight.equals(BigInt.fromI32(0))) {
    delegateAccount.firstInsertedBlock = event.block.number
    delegateAccount.firstInsertedAt = event.block.timestamp
  }

  delegateAccount.save()

  // Update global stats
  if (newDelegations > 0) {
    stats.totalDelegations = stats.totalDelegations.plus(BigInt.fromI32(newDelegations))
    stats.totalWeight = stats.totalWeight.plus(BigInt.fromI32(weightIncrease))

    // If delegator went from 0 to some delegations, increment totalActiveDelegators
    if (oldDelegatorCount.equals(BigInt.fromI32(0)) && delegator.totalDelegationsMade.gt(BigInt.fromI32(0))) {
      stats.totalActiveDelegators = stats.totalActiveDelegators.plus(BigInt.fromI32(1))
    }

    stats.lastUpdatedAt = event.block.timestamp
    stats.save()
  }
}

export function handleUndelegatedBatch(event: UndelegatedBatchEvent): void {
  let tokenIds = event.params.tokenIds
  let nftIndex = event.params.nftIndex
  let owner = event.params.owner
  let delegate = event.params.from

  // Load delegate account and delegator once for all tokens
  let delegateAccount = loadOrCreateAccount(delegate, event.block.timestamp, event.block.number)
  let delegator = loadOrCreateDelegator(owner, event.block.timestamp, event.block.number)

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
    delegation.delegator = null
    delegation.owner = owner
    delegation.delegatorAddress = owner
    delegation.isDelegated = false
    delegation.delegatedAt = event.block.timestamp
    delegation.delegatedBlock = event.block.number
    delegation.transactionHash = event.transaction.hash
    delegation.save()
  }

  // Decrease delegator's count
  delegator.totalDelegationsMade = delegator.totalDelegationsMade.minus(BigInt.fromI32(tokenIds.length))
  delegator.save()

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

  // If delegator now has 0 active delegations, decrement totalActiveDelegators
  if (delegator.totalDelegationsMade.equals(BigInt.fromI32(0))) {
    stats.totalActiveDelegators = stats.totalActiveDelegators.minus(BigInt.fromI32(1))
  }

  stats.lastUpdatedAt = event.block.timestamp
  stats.save()
}


/**
 * Handle WeightChanged event - CRITICAL for tracking tree insertion order
 * This event is emitted by the contract in the exact order leaves are inserted/updated/removed
 */
export function handleWeightChanged(event: WeightChangedEvent): void {
  let account = loadOrCreateAccount(event.params.account, event.block.timestamp, event.block.number)
  let previousWeight = event.params.previousWeight
  let newWeight = event.params.newWeight

  // Save the weight change event for tree reconstruction
  let eventId = idFromTx(event.transaction.hash, event.logIndex)
  let weightChangeEvent = new WeightChangeEvent(eventId)
  weightChangeEvent.account = account.id
  weightChangeEvent.previousWeight = BigInt.fromI32(previousWeight.toI32())
  weightChangeEvent.newWeight = BigInt.fromI32(newWeight.toI32())
  weightChangeEvent.blockNumber = event.block.number
  weightChangeEvent.blockTimestamp = event.block.timestamp
  weightChangeEvent.transactionHash = event.transaction.hash
  weightChangeEvent.logIndex = event.logIndex
  weightChangeEvent.save()

  // Update account weight
  account.weight = BigInt.fromI32(newWeight.toI32())
  account.lastUpdatedAt = event.block.timestamp
  account.lastUpdatedBlock = event.block.number

  // Track tree insertion: weight going from 0 to >0 means new leaf inserted
  if (previousWeight.toI32() == 0 && newWeight.toI32() > 0) {
    // NEW INSERTION - assign next available tree index
    let stats = loadOrCreateGlobalStats(event.block.timestamp)
    account.treeIndex = stats.nextTreeIndex
    account.firstInsertedBlock = event.block.number
    account.firstInsertedAt = event.block.timestamp

    // Increment global tree index counter
    stats.nextTreeIndex = stats.nextTreeIndex.plus(BigInt.fromI32(1))
    stats.save()
  } else if (newWeight.toI32() == 0) {
    // REMOVAL - weight went to 0, leaf removed from tree
    account.treeIndex = BigInt.fromI32(-1)
  }
  // If weight goes from >0 to >0, it is an UPDATE - tree index stays the same

  account.save()
}

