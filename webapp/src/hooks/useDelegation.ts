import { useState, useCallback, useMemo } from 'react'
import { DavinciDaoContract } from '~/lib/contract'
import { generateProofs, packLeaf } from '~/lib/merkle'
import { NFTInfo, CensusData, MerkleTreeNode } from '~/types'
import {
  DelegateInfo,
  DelegationState,
  TransactionPlan,
  DelegationOperation,
  ProofRequirement
} from '~/types/delegation'
import { getSubgraphClient } from '~/lib/subgraph-client'

/**
 * Fetch census data from subgraph by querying WeightChanged events in chronological order
 * This ensures we rebuild the tree in the same order as the contract built it
 */
async function fetchCensusDataFromSubgraph(contract: DavinciDaoContract): Promise<CensusData> {
  console.log('Fetching census data from subgraph by replaying WeightChanged events...')
  const subgraph = getSubgraphClient()

  let skip = 0
  const pageSize = 100

  // Query all accounts that have current weight > 0
  // The subgraph now tracks firstInsertedBlock for correct tree order
  const allAccounts: Array<{ id: string; address: string; weight: string; firstInsertedBlock: string }> = []

  while (true) {
    const accounts = await subgraph.getAllAccounts(pageSize, skip)

    if (!accounts || accounts.length === 0) {
      break
    }

    allAccounts.push(...accounts)
    skip += pageSize

    if (accounts.length < pageSize) {
      break
    }
  }

  console.log(`Fetched ${allAccounts.length} accounts from subgraph`)

  // Sort by firstInsertedBlock to match contract tree insertion order
  // This is the block when each account first got weight > 0
  allAccounts.sort((a, b) => {
    const blockA = parseInt(a.firstInsertedBlock)
    const blockB = parseInt(b.firstInsertedBlock)
    if (blockA !== blockB) {
      return blockA - blockB
    }
    // If same block, sort by address for determinism
    return a.id.localeCompare(b.id)
  })

  // Convert accounts to MerkleTreeNode format with index in insertion order
  const nodes: MerkleTreeNode[] = allAccounts.map((account, index) => {
    const address = account.id
    const weight = parseInt(account.weight)
    const leaf = packLeaf(address, weight)

    return {
      index,
      address,
      weight,
      leaf
    }
  })

  console.log('Tree node order (first 10):', nodes.slice(0, 10).map(n => n.address))

  // Get current census root
  const root = await contract.getCensusRoot()

  return {
    root: root.toString(),
    nodes,
    totalParticipants: nodes.length
  }
}

export const useDelegation = (
  contract: DavinciDaoContract | null,
  userNFTs: NFTInfo[],
  userAddress: string | undefined,
  onTransactionSuccess?: () => void | Promise<void>
) => {
  const [delegationState, setDelegationState] = useState<DelegationState>({
    ownedTokens: new Map(),
    delegates: new Map(),
    pendingChanges: [],
    availableTokens: new Map(),
    collectionAddresses: new Map(),
    totalOwnedTokens: 0,
    totalDelegatedTokens: 0
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize delegation state from NFTs
  const initializeDelegationState = useCallback(() => {
    console.log(`\n🔄 INITIALIZING DELEGATION STATE`)
    console.log(`Total userNFTs received: ${userNFTs.length}`)

    // Check delegation status of first few NFTs
    const sample = userNFTs.slice(0, 20)
    const sampleWithDelegation = sample.filter(n => n.delegatedTo)
    console.log(`Sample of first 20 NFTs: ${sampleWithDelegation.length} have delegatedTo field`)
    if (sampleWithDelegation.length > 0) {
      console.log(`Sample NFTs with delegation:`, sampleWithDelegation.slice(0, 3).map(n => ({
        tokenId: n.tokenId,
        delegatedTo: n.delegatedTo
      })))
    }

    const ownedTokens = new Map<number, string[]>()
    const delegates = new Map<string, DelegateInfo>()
    const availableTokens = new Map<number, number>()
    const collectionAddresses = new Map<number, string>()

    let totalOwned = 0
    let totalDelegated = 0

    // Group NFTs by collection
    const nftsByCollection = userNFTs.reduce((acc, nft) => {
      if (!acc[nft.collectionIndex]) {
        acc[nft.collectionIndex] = []
      }
      acc[nft.collectionIndex].push(nft)
      return acc
    }, {} as Record<number, NFTInfo[]>)

    // Process each collection
    Object.entries(nftsByCollection).forEach(([collectionIndexStr, nfts]) => {
      const collectionIndex = parseInt(collectionIndexStr)
      const tokenIds = nfts.map(nft => nft.tokenId)
      
      ownedTokens.set(collectionIndex, tokenIds)
      totalOwned += tokenIds.length

      // Track collection address (use the first NFT's address as they're all from the same collection)
      if (nfts.length > 0) {
        collectionAddresses.set(collectionIndex, nfts[0].collectionAddress)
      }

      // Group by delegate (including self-delegated tokens)
      const delegatedNFTs = nfts.filter(nft => nft.delegatedTo)
      const undelegatedCount = nfts.length - delegatedNFTs.length
      
      availableTokens.set(collectionIndex, undelegatedCount)

      // Process delegates (including self-delegated tokens)
      delegatedNFTs.forEach(nft => {
        if (!nft.delegatedTo) return
        
        const delegateAddress = nft.delegatedTo
        if (!delegates.has(delegateAddress)) {
          delegates.set(delegateAddress, {
            address: delegateAddress,
            currentTokens: [],
            pendingTokens: [],
            currentCount: 0,
            pendingCount: 0,
            weight: 0
          })
        }
        
        const delegate = delegates.get(delegateAddress)!
        delegate.currentTokens.push(nft.tokenId)
        delegate.currentCount++
        delegate.pendingTokens = [...delegate.currentTokens]
        delegate.pendingCount = delegate.currentCount
        totalDelegated++
      })
    })

    // Only add user's own address as a delegate if no other delegates exist (empty state)
    if (userAddress && !delegates.has(userAddress) && delegates.size === 0) {
      delegates.set(userAddress, {
        address: userAddress,
        currentTokens: [],
        pendingTokens: [],
        currentCount: 0,
        pendingCount: 0,
        weight: 0
      })
    }

    console.log(`✓ Initialization complete:`)
    console.log(`  - Total owned: ${totalOwned}`)
    console.log(`  - Total delegated: ${totalDelegated}`)
    console.log(`  - Delegates found: ${delegates.size}`)
    if (delegates.size > 0) {
      console.log(`  - Delegate addresses:`, Array.from(delegates.keys()))
      Array.from(delegates.entries()).forEach(([addr, info]) => {
        console.log(`    ${addr}: ${info.currentCount} tokens`)
      })
    }
    console.log(`\n`)

    setDelegationState({
      ownedTokens,
      delegates,
      pendingChanges: [],
      availableTokens,
      collectionAddresses,
      totalOwnedTokens: totalOwned,
      totalDelegatedTokens: totalDelegated
    })
  }, [userNFTs, userAddress])

  // Add a new delegate
  const addDelegate = useCallback((address: string) => {
    setDelegationState(prev => {
      if (prev.delegates.has(address)) {
        return prev // Already exists
      }

      const newDelegates = new Map(prev.delegates)
      newDelegates.set(address, {
        address,
        currentTokens: [],
        pendingTokens: [],
        currentCount: 0,
        pendingCount: 1, // Default to 1 NFT when adding a delegate
        weight: 0
      })

      return {
        ...prev,
        delegates: newDelegates
      }
    })
  }, [])

  // Remove a delegate (set their tokens to 0)
  const removeDelegate = useCallback((address: string) => {
    setDelegationState(prev => {
      const delegate = prev.delegates.get(address)
      if (!delegate) return prev

      const newDelegates = new Map(prev.delegates)
      const updatedDelegate = { ...delegate, pendingCount: 0, pendingTokens: [] }
      newDelegates.set(address, updatedDelegate)

      // Add tokens back to available pool
      const newAvailableTokens = new Map(prev.availableTokens)
      // This is simplified - in reality we'd need to track which collection these tokens belong to
      
      return {
        ...prev,
        delegates: newDelegates,
        availableTokens: newAvailableTokens
      }
    })
  }, [])

  // Update delegate token count
  const updateDelegateCount = useCallback((address: string, newCount: number) => {
    setDelegationState(prev => {
      const delegate = prev.delegates.get(address)
      if (!delegate) return prev

      // For now, we'll use the total available tokens across all collections
      // TODO: Implement proper per-collection tracking
      const totalAvailable = prev.totalOwnedTokens - prev.totalDelegatedTokens
      const currentlyAllocated = delegate.currentCount
      
      // Calculate how many tokens are currently pending to other delegates
      let totalPendingToOthers = 0
      for (const [otherAddress, otherDelegate] of prev.delegates) {
        if (otherAddress !== address) {
          const otherPendingIncrease = Math.max(0, otherDelegate.pendingCount - otherDelegate.currentCount)
          totalPendingToOthers += otherPendingIncrease
        }
      }
      
      // Available tokens = total available - tokens pending to others + tokens currently allocated to this delegate
      const effectiveAvailable = totalAvailable - totalPendingToOthers + currentlyAllocated
      const maxPossible = Math.max(0, effectiveAvailable)
      
      // Clamp the new count
      const clampedCount = Math.max(0, Math.min(newCount, maxPossible))

      const newDelegates = new Map(prev.delegates)
      const updatedDelegate = { ...delegate, pendingCount: clampedCount }
      newDelegates.set(address, updatedDelegate)

      return {
        ...prev,
        delegates: newDelegates
      }
    })
  }, [])

  // Calculate what operations are needed
  const calculateTransactionPlan = useCallback(async (): Promise<TransactionPlan> => {
    if (!contract) {
      return {
        operations: [],
        requiresProofs: false,
        currentOperationIndex: 0,
        isExecuting: false,
        isTreeReconstructing: false
      }
    }

    const operations: DelegationOperation[] = []
    const proofRequirements: ProofRequirement[] = []

    // Determine which collection to use (find first collection with tokens)
    let activeCollectionIndex = 0
    for (const [collectionIndex, tokens] of delegationState.ownedTokens.entries()) {
      if (tokens.length > 0) {
        activeCollectionIndex = collectionIndex
        break
      }
    }
    console.log(`Using collection index ${activeCollectionIndex} for operations`)

    // Analyze each delegate for changes
    for (const [address, delegate] of delegationState.delegates) {
      const currentCount = delegate.currentCount
      const pendingCount = delegate.pendingCount

      if (currentCount === pendingCount) continue // No change

      // Check if this address needs a proof
      const currentWeight = await contract.getWeightOf(address)
      const needsProof = currentWeight > 0 && pendingCount > 0

      proofRequirements.push({
        address,
        currentWeight,
        needsProof
      })

      if (pendingCount === 0 && currentCount > 0) {
        // Complete removal - undelegate ALL tokens
        operations.push({
          id: `undelegate-${address}`,
          type: 'undelegate',
          description: `Remove all ${currentCount} NFT${currentCount > 1 ? 's' : ''} from ${address}`,
          collectionIndex: activeCollectionIndex,
          tokenIds: delegate.currentTokens,
          from: address,
          status: 'pending'
        })
      } else if (currentCount === 0 && pendingCount > 0) {
        // New delegation - use delegate function
        operations.push({
          id: `delegate-${address}`,
          type: 'delegate',
          description: `Delegate ${pendingCount} NFT${pendingCount > 1 ? 's' : ''} to ${address}`,
          collectionIndex: activeCollectionIndex,
          tokenIds: new Array(pendingCount).fill(''), // Placeholder - will be filled during execution
          to: address,
          status: 'pending'
        })
      } else if (currentCount !== pendingCount) {
        // Weight update - different strategies based on increase/decrease
        const change = pendingCount - currentCount
        const count = Math.abs(change)

        if (change > 0) {
          // Increasing weight - use delegate function for new tokens
          operations.push({
            id: `delegate-increase-${address}`,
            type: 'delegate',
            description: `Add ${count} NFT${count > 1 ? 's' : ''} to ${address}`,
            collectionIndex: activeCollectionIndex,
            tokenIds: new Array(count).fill(''), // Placeholder - will be filled during execution
            to: address,
            status: 'pending'
          })
        } else {
          // Decreasing weight - use undelegate function for specific tokens
          operations.push({
            id: `undelegate-partial-${address}`,
            type: 'undelegate',
            description: `Remove ${count} NFT${count > 1 ? 's' : ''} from ${address}`,
            collectionIndex: activeCollectionIndex,
            tokenIds: new Array(count).fill(''), // Placeholder - will be filled during execution
            from: address,
            status: 'pending'
          })
        }
      }
    }

    return {
      operations,
      requiresProofs: proofRequirements.some(req => req.needsProof),
      currentOperationIndex: 0,
      isExecuting: false,
      isTreeReconstructing: false
    }
  }, [contract, delegationState.delegates])

  // Execute the transaction plan
  const executeDelegationPlan = useCallback(async (plan: TransactionPlan) => {
    if (!contract || !userAddress) {
      throw new Error('Contract or user address not available')
    }

    setIsLoading(true)
    setError(null)

    try {
      let treeData = null

      // Generate proofs if needed by fetching census data from subgraph
      if (plan.requiresProofs) {
        console.log('Fetching census data from subgraph for proof generation...')
        treeData = await fetchCensusDataFromSubgraph(contract)
      }

      // Execute each operation
      for (const operation of plan.operations) {
        let txHash: string

        switch (operation.type) {
          case 'delegate': {
            if (!operation.to) throw new Error('Missing delegate address')
            
            // Get the delegate to determine how many tokens to allocate
            const delegate = delegationState.delegates.get(operation.to)
            if (!delegate) throw new Error('Delegate not found in state')
            
            const tokensNeeded = delegate.pendingCount - delegate.currentCount
            if (tokensNeeded <= 0) {
              console.warn('No tokens needed for delegation')
              continue
            }
            
            // Allocate available tokens for delegation
            const tokensToDelegate = await allocateTokensForDelegation(operation.to, operation.collectionIndex, tokensNeeded)
            
            if (tokensToDelegate.length === 0) {
              throw new Error('No available tokens to delegate')
            }
            
            // Generate proof if needed
            let proof: string[] = []
            let currentWeight = 0
            if (treeData) {
              // Get current weight from tree data
              const accountNode = treeData.nodes.find(n => n.address.toLowerCase() === operation.to!.toLowerCase())
              currentWeight = accountNode?.weight || 0
              if (currentWeight > 0) {
                const proofs = generateProofs(treeData, [operation.to!])
                proof = proofs[operation.to!] || []
              }
            }

            txHash = await contract.delegate(
              operation.to!,
              operation.collectionIndex,
              tokensToDelegate,  // Keep as string[]
              currentWeight,  // Pass as number
              proof  // Already string[]
            )
            break
          }

          case 'undelegate': {
            if (!operation.from) throw new Error('Missing delegate address for undelegation')

            // Get tokens currently delegated to this address
            const delegatedTokens = getTokensDelegatedTo(operation.from, operation.collectionIndex)
            
            if (delegatedTokens.length === 0) {
              console.warn(`No tokens found delegated to ${operation.from}`)
              continue
            }

            // Generate proofs for the delegate losing tokens
            const fromProofs: { account: string; currentWeight: number; siblings: string[] }[] = []

            // Query current weight from subgraph
            const subgraph = getSubgraphClient()
            const currentWeight = await subgraph.getAccountWeight(operation.from)

            if (treeData) {
              const proofs = generateProofs(treeData, [operation.from])
              const proof = proofs[operation.from] || []
              fromProofs.push({
                account: operation.from,
                currentWeight,
                siblings: proof
              })
            }

            txHash = await contract.undelegate(
              operation.collectionIndex,
              delegatedTokens,
              fromProofs.map(p => ({ account: p.account, currentWeight: p.currentWeight, siblings: p.siblings.map((s: string) => BigInt(s)) }))
            )
            break
          }

          case 'updateDelegation': {
            if (!operation.to) throw new Error('Missing target delegate address')
            
            // Determine how many tokens to move and from where
            const { tokensToMove, fromDelegates } = await planTokenMovement(operation)
            
            if (tokensToMove.length === 0) {
              console.warn('No tokens to move for updateDelegation')
              continue
            }

            // Generate fromProofs for delegates losing tokens
            const fromProofs: { account: string; currentWeight: number; siblings: string[] }[] = []

            // Query weights from subgraph for all fromDelegates
            const subgraph = getSubgraphClient()
            const weightsMap: Record<string, number> = {}
            for (const delegate of fromDelegates) {
              weightsMap[delegate] = await subgraph.getAccountWeight(delegate)
            }

            if (treeData && fromDelegates.length > 0) {
              const proofs = generateProofs(treeData, fromDelegates)
              for (const delegate of fromDelegates) {
                const proof = proofs[delegate] || []
                fromProofs.push({
                  account: delegate,
                  currentWeight: weightsMap[delegate] || 0,
                  siblings: proof
                })
              }
            }

            // Generate toProof if target delegate already has weight
            let toProof: string[] = []
            if (treeData) {
              const currentWeight = await contract.getWeightOf(operation.to)
              if (currentWeight > 0) {
                const proofs = generateProofs(treeData, [operation.to])
                toProof = proofs[operation.to] || []
              }
            }

            txHash = await contract.updateDelegation(
              operation.to,
              operation.collectionIndex,
              tokensToMove,
              fromProofs.map(p => ({ account: p.account, currentWeight: p.currentWeight, siblings: p.siblings.map((s: string) => BigInt(s)) })),
              toProof.map((s: string) => BigInt(s))
            )
            break
          }

          default:
            throw new Error(`Unknown operation type: ${operation.type}`)
        }

        console.log(`Operation ${operation.type} completed with tx: ${txHash}`)
      }

      // Trigger data refresh callback if provided
      if (onTransactionSuccess) {
        await onTransactionSuccess()
      }
      
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [contract, userAddress, onTransactionSuccess, delegationState.delegates]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to allocate available tokens for delegation
  const allocateTokensForDelegation = useCallback(async (
    targetDelegate: string,
    collectionIndex: number,
    count: number,
    isWeightIncrease: boolean = false
  ): Promise<string[]> => {
    const { UI_CONFIG } = await import('~/lib/constants')
    const MAX_TOKENS = UI_CONFIG.MAX_TOKENS_PER_TX

    // Enforce gas limit safety
    if (count > MAX_TOKENS) {
      console.error(`❌ LIMIT EXCEEDED: Requested ${count} tokens, maximum is ${MAX_TOKENS}`)
      throw new Error(
        `Cannot delegate ${count} tokens in a single transaction. ` +
        `Maximum allowed: ${MAX_TOKENS} tokens. ` +
        `Please reduce the number of tokens or perform multiple transactions.`
      )
    }

    const availableTokens = delegationState.ownedTokens.get(collectionIndex) || []
    const allocatedTokens: string[] = []

    console.log(`Allocating tokens for ${targetDelegate}:`)
    console.log(`- Collection ${collectionIndex} has ${availableTokens.length} owned tokens`)
    console.log(`- Need to allocate ${count} tokens (max per tx: ${MAX_TOKENS})`)
    console.log(`- Is weight increase: ${isWeightIncrease}`)
    console.log(`- Available token IDs:`, availableTokens)
    
    if (isWeightIncrease) {
      // For weight increases, we need to find tokens that can be delegated to this delegate
      // This includes both undelegated tokens AND tokens already delegated to the same delegate
      // (since we're increasing the total delegation amount)
      
      // Get current delegate info to understand current vs pending counts
      const delegate = delegationState.delegates.get(targetDelegate)
      if (!delegate) {
        console.error('Delegate not found in state for weight increase')
        return []
      }
      
      console.log(`- Current delegation: ${delegate.currentCount} tokens`)
      console.log(`- Pending delegation: ${delegate.pendingCount} tokens`)
      console.log(`- Need to add: ${count} more tokens`)
      
      // For weight increase, we can use ANY of the user's tokens for this delegate
      // The contract will handle the delegation logic
      let tokensUsed = 0
      for (const tokenId of availableTokens) {
        if (tokensUsed >= count) break

        const currentDelegate = getCurrentTokenDelegate(collectionIndex, tokenId)
        console.log(`- Token ${tokenId} is delegated to: ${currentDelegate || 'none'}`)
        
        // For weight increase, we can ONLY use completely undelegated tokens
        // The Solidity contract reverts if we try to delegate already-delegated tokens
        if (!currentDelegate || currentDelegate === '0x0000000000000000000000000000000000000000') {
          allocatedTokens.push(tokenId)
          tokensUsed++
          console.log(`- ✅ Token ${tokenId} allocated for weight increase (undelegated)`)
        } else {
          console.log(`- ❌ Token ${tokenId} already delegated to ${currentDelegate} (cannot reuse for weight increase)`)
        }
      }
    } else {
      // For new delegations, only use completely undelegated tokens
      for (const tokenId of availableTokens) {
        if (allocatedTokens.length >= count) break

        const currentDelegate = getCurrentTokenDelegate(collectionIndex, tokenId)
        console.log(`- Token ${tokenId} is delegated to: ${currentDelegate || 'none'}`)
        
        if (!currentDelegate || currentDelegate === '0x0000000000000000000000000000000000000000') {
          allocatedTokens.push(tokenId)
          console.log(`- ✅ Token ${tokenId} allocated (undelegated)`)
        } else {
          console.log(`- ❌ Token ${tokenId} already delegated to ${currentDelegate}`)
        }
      }
    }
    
    console.log(`Final allocation: ${allocatedTokens.length}/${count} tokens`)
    console.log(`Allocated tokens:`, allocatedTokens)
    
    return allocatedTokens
  }, [delegationState.ownedTokens, delegationState.delegates]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to get tokens owned by the user that are delegated to a specific address
  const getTokensDelegatedTo = useCallback((
    delegate: string,
    collectionIndex: number
  ): string[] => {
    // Get all tokens owned by the user in this collection
    const userOwnedTokens = delegationState.ownedTokens.get(collectionIndex) || []
    const delegatedTokens: string[] = []
    
    // Find which of the user's tokens are delegated to the specified delegate
    for (const tokenId of userOwnedTokens) {
      const currentDelegate = getCurrentTokenDelegate(collectionIndex, tokenId)
      if (currentDelegate && currentDelegate.toLowerCase() === delegate.toLowerCase()) {
        delegatedTokens.push(tokenId)
      }
    }
    
    console.log(`User owns ${userOwnedTokens.length} tokens in collection ${collectionIndex}`)
    console.log(`${delegatedTokens.length} of those are delegated to ${delegate}`)
    console.log('Delegated token IDs:', delegatedTokens)
    
    return delegatedTokens
  }, [delegationState.ownedTokens]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to get current delegate for a token from NFT data
  const getCurrentTokenDelegate = useCallback((
    collectionIndex: number,
    tokenId: string
  ): string | null => {
    // Find the NFT in our loaded data
    const nft = userNFTs.find(
      n => n.collectionIndex === collectionIndex && n.tokenId === tokenId
    )

    if (!nft) {
      console.warn(`❌ NFT not found in userNFTs: collection ${collectionIndex}, token ${tokenId}`)
      console.warn(`Available NFTs count: ${userNFTs.length}`)
      if (userNFTs.length > 0) {
        console.warn(`First NFT sample:`, userNFTs[0])
      }
      return null
    }

    // Debug: show what we found
    console.log(`📋 NFT found: token ${tokenId}, delegatedTo: ${nft.delegatedTo || 'undefined'}`)

    // Return the delegatedTo address if present
    if (nft.delegatedTo && nft.delegatedTo !== '0x0000000000000000000000000000000000000000') {
      return nft.delegatedTo
    }

    return null
  }, [userNFTs])

  // Helper function to plan token movement for updateDelegation
  const planTokenMovement = useCallback(async (operation: DelegationOperation): Promise<{
    tokensToMove: string[]
    fromDelegates: string[]
  }> => {
    if (!operation.to) {
      return { tokensToMove: [], fromDelegates: [] }
    }

    const delegate = delegationState.delegates.get(operation.to)
    if (!delegate) {
      return { tokensToMove: [], fromDelegates: [] }
    }

    const currentCount = delegate.currentCount
    const pendingCount = delegate.pendingCount
    const change = pendingCount - currentCount

    if (change === 0) {
      return { tokensToMove: [], fromDelegates: [] }
    }

    const tokensToMove: string[] = []
    const fromDelegatesSet = new Set<string>()

    if (change > 0) {
      // Need to ADD tokens to this delegate
      // Find unallocated tokens (not delegated to anyone)
      const availableTokens = delegationState.ownedTokens.get(operation.collectionIndex) || []
      
      for (const tokenId of availableTokens) {
        if (tokensToMove.length >= change) break

        const currentDelegate = getCurrentTokenDelegate(operation.collectionIndex, tokenId)
        if (!currentDelegate || currentDelegate === '0x0000000000000000000000000000000000000000') {
          // Unallocated token - can be moved to this delegate
          tokensToMove.push(tokenId)
          // No fromDelegate needed for unallocated tokens
        }
      }
    } else {
      // Need to REMOVE tokens from this delegate (change < 0)
      // Move tokens from this delegate back to unallocated state
      const tokensToRemove = Math.abs(change)
      const currentTokens = getTokensDelegatedTo(operation.to, operation.collectionIndex)
      
      for (let i = 0; i < Math.min(tokensToRemove, currentTokens.length); i++) {
        tokensToMove.push(currentTokens[i])
        fromDelegatesSet.add(operation.to)
      }
    }

    console.log(`Planning token movement for ${operation.to}:`)
    console.log(`- Change: ${change} (${change > 0 ? 'adding' : 'removing'} tokens)`)
    console.log(`- Tokens to move: ${tokensToMove.length}`)
    console.log(`- From delegates: ${Array.from(fromDelegatesSet)}`)

    return {
      tokensToMove,
      fromDelegates: Array.from(fromDelegatesSet)
    }
  }, [delegationState.delegates, delegationState.ownedTokens, getCurrentTokenDelegate, getTokensDelegatedTo])

  // Reset all pending changes
  const resetPendingChanges = useCallback(() => {
    setDelegationState(prev => {
      const newDelegates = new Map()
      
      // Reset all delegates to their current state
      for (const [address, delegate] of prev.delegates) {
        newDelegates.set(address, {
          ...delegate,
          pendingCount: delegate.currentCount,
          pendingTokens: [...delegate.currentTokens]
        })
      }

      return {
        ...prev,
        delegates: newDelegates,
        pendingChanges: []
      }
    })
  }, [])

  // Check if there are any pending changes
  const hasPendingChanges = useMemo(() => {
    for (const [, delegate] of delegationState.delegates) {
      if (delegate.currentCount !== delegate.pendingCount) {
        return true
      }
    }
    return false
  }, [delegationState.delegates])

  // Execute a single operation by ID
  const executeOperation = useCallback(async (operationId: string) => {
    if (!contract || !userAddress) {
      throw new Error('Contract or user address not available')
    }

    // Get the current plan to find the operation
    const plan = await calculateTransactionPlan()
    const operation = plan.operations.find(op => op.id === operationId)
    
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`)
    }

    setIsLoading(true)
    setError(null)

    try {
      let treeData = null

      // For single operations, we need to check if THIS operation needs proofs
      let operationNeedsProofs = false
      
      if (operation.type === 'undelegate' && operation.from) {
        // Check if the delegate has current weight (needs proof for removal)
        const currentWeight = await contract.getWeightOf(operation.from)
        operationNeedsProofs = currentWeight > 0
        console.log(`Delegate ${operation.from} has weight ${currentWeight}, needs proof: ${operationNeedsProofs}`)
      } else if (operation.type === 'delegate' && operation.to) {
        // Check if the delegate already has weight (needs proof for addition)
        const currentWeight = await contract.getWeightOf(operation.to)
        operationNeedsProofs = currentWeight > 0
        console.log(`Delegate ${operation.to} has weight ${currentWeight}, needs proof: ${operationNeedsProofs}`)
      } else if (operation.type === 'updateDelegation') {
        // updateDelegation always needs proofs
        operationNeedsProofs = true
      }

      // Generate proofs if needed with intelligent caching
      if (operationNeedsProofs) {
        console.log('Fetching census data from subgraph for single operation proof generation...')
        treeData = await fetchCensusDataFromSubgraph(contract)
      }

      let txHash: string

      switch (operation.type) {
        case 'delegate': {
          if (!operation.to) throw new Error('Missing delegate address')
          
          // Get the delegate to determine how many tokens to allocate
          const delegate = delegationState.delegates.get(operation.to)
          if (!delegate) throw new Error('Delegate not found in state')
          
          let tokensNeeded: number
          if (operation.id.includes('delegate-increase-')) {
            // Weight increase - only add the difference
            tokensNeeded = delegate.pendingCount - delegate.currentCount
          } else {
            // New delegation - add all pending tokens
            tokensNeeded = delegate.pendingCount
          }
          
          if (tokensNeeded <= 0) {
            throw new Error('No tokens needed for delegation')
          }
          
          console.log(`Delegate operation for ${operation.to}:`)
          console.log(`- Current count: ${delegate.currentCount}`)
          console.log(`- Pending count: ${delegate.pendingCount}`)
          console.log(`- Tokens needed: ${tokensNeeded}`)
          console.log(`- Operation type: ${operation.id.includes('delegate-increase-') ? 'increase' : 'new'}`)
          
          // Allocate available tokens for delegation
          const isWeightIncrease = operation.id.includes('delegate-increase-')
          const tokensToDelegate = await allocateTokensForDelegation(operation.to, operation.collectionIndex, tokensNeeded, isWeightIncrease)
          
          console.log(`Raw tokens to delegate:`, tokensToDelegate)
          console.log(`Tokens to delegate length: ${tokensToDelegate.length}`)
          console.log(`Tokens needed: ${tokensNeeded}`)
          
          if (tokensToDelegate.length === 0) {
            throw new Error('No available tokens to delegate')
          }
          
          if (tokensToDelegate.length !== tokensNeeded) {
            throw new Error(`Expected ${tokensNeeded} tokens but only found ${tokensToDelegate.length} available`)
          }
          
          console.log(`Final tokens to delegate:`, tokensToDelegate)
          
          // Generate proof if needed
          let proof: string[] = []
          let currentWeight = 0
          if (treeData) {
            // Get current weight from tree data
            const accountNode = treeData.nodes.find(n => n.address.toLowerCase() === operation.to!.toLowerCase())
            currentWeight = accountNode?.weight || 0
            console.log(`Current weight for ${operation.to}: ${currentWeight}`)
            if (currentWeight > 0) {
              const proofs = generateProofs(treeData, [operation.to!])
              proof = proofs[operation.to!] || []
              console.log(`Generated proof for ${operation.to}:`, proof)

              // Remove special case handling - let the contract handle single-node trees
              console.log(`Using generated proof with ${proof.length} elements`)
            } else {
              console.log(`No proof needed for ${operation.to} (weight = 0)`)
            }
          } else {
            console.log('No tree data available for proof generation')
          }

          txHash = await contract.delegate(
            operation.to!,
            operation.collectionIndex,
            tokensToDelegate,  // Keep as string[]
            currentWeight,  // Pass as number
            proof  // Already string[]
          )
          break
        }

        case 'undelegate': {
          if (!operation.from) throw new Error('Missing delegate address for undelegation')

          // Get tokens currently delegated to this address
          const delegatedTokens = getTokensDelegatedTo(operation.from, operation.collectionIndex)
          
          if (delegatedTokens.length === 0) {
            throw new Error(`No tokens found delegated to ${operation.from}`)
          }

          // Determine how many tokens to undelegate
          let tokensToUndelegate: string[]
          
          if (operation.id.includes('undelegate-partial-')) {
            // Partial undelegation - only undelegate the required number
            const delegate = delegationState.delegates.get(operation.from)
            if (!delegate) throw new Error('Delegate not found in state')
            
            const tokensToRemove = delegate.currentCount - delegate.pendingCount
            tokensToUndelegate = delegatedTokens.slice(0, tokensToRemove)
          } else {
            // Complete undelegation - undelegate all tokens
            tokensToUndelegate = delegatedTokens
          }

          console.log(`Undelegating ${tokensToUndelegate.length} tokens from ${operation.from}`)
          console.log('Token IDs:', tokensToUndelegate)

          // Generate proofs for the delegate losing tokens
          const fromProofs: { account: string; currentWeight: number; siblings: string[] }[] = []

          // Query current weight from subgraph
          const subgraph = getSubgraphClient()
          const currentWeight = await subgraph.getAccountWeight(operation.from)

          if (treeData) {
            const proofs = generateProofs(treeData, [operation.from])
            const proof = proofs[operation.from] || []
            fromProofs.push({
              account: operation.from,
              currentWeight,
              siblings: proof
            })
            console.log('Generated proof for', operation.from, ':', proof)
          } else {
            // If no tree data, still need to provide the proof structure
            fromProofs.push({
              account: operation.from,
              currentWeight,
              siblings: []
            })
            console.log('No tree data, using empty proof for', operation.from)
          }

          txHash = await contract.undelegate(
            operation.collectionIndex,
            tokensToUndelegate,
            fromProofs.map(p => ({ account: p.account, currentWeight: p.currentWeight, siblings: p.siblings.map((s: string) => BigInt(s)) }))
          )
          break
        }

        case 'updateDelegation': {
          if (!operation.to) throw new Error('Missing target delegate address')
          
          // Determine how many tokens to move and from where
          const { tokensToMove, fromDelegates } = await planTokenMovement(operation)
          
          if (tokensToMove.length === 0) {
            throw new Error('No tokens to move for updateDelegation')
          }

          // Generate fromProofs for delegates losing tokens
          const fromProofs: { account: string; currentWeight: number; siblings: string[] }[] = []

          // Query weights from subgraph for all fromDelegates
          const subgraph = getSubgraphClient()
          const weightsMap: Record<string, number> = {}
          for (const delegate of fromDelegates) {
            weightsMap[delegate] = await subgraph.getAccountWeight(delegate)
          }

          if (treeData && fromDelegates.length > 0) {
            const proofs = generateProofs(treeData, fromDelegates)
            for (const delegate of fromDelegates) {
              const proof = proofs[delegate] || []
              fromProofs.push({
                account: delegate,
                currentWeight: weightsMap[delegate] || 0,
                siblings: proof
              })
            }
          }

          // Generate toProof if target delegate already has weight
          let toProof: string[] = []
          if (treeData) {
            const currentWeight = await contract.getWeightOf(operation.to)
            if (currentWeight > 0) {
              const proofs = generateProofs(treeData, [operation.to])
              toProof = proofs[operation.to] || []
            }
          }

          txHash = await contract.updateDelegation(
            operation.to,
            operation.collectionIndex,
            tokensToMove,
            fromProofs.map(p => ({ account: p.account, currentWeight: p.currentWeight, siblings: p.siblings.map((s: string) => BigInt(s)) })),
            toProof.map((s: string) => BigInt(s))
          )
          break
        }

        default:
          throw new Error(`Unknown operation type: ${operation.type}`)
      }

      console.log(`Operation ${operation.type} completed with tx: ${txHash}`)
      
      // Trigger data refresh callback if provided
      if (onTransactionSuccess) {
        await onTransactionSuccess()
      }
      
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [contract, userAddress, delegationState.delegates, calculateTransactionPlan, allocateTokensForDelegation, getTokensDelegatedTo, planTokenMovement, onTransactionSuccess])

  return {
    delegationState,
    isLoading,
    error,
    initializeDelegationState,
    addDelegate,
    removeDelegate,
    updateDelegateCount,
    calculateTransactionPlan,
    executeDelegationPlan,
    executeOperation,
    resetPendingChanges,
    hasPendingChanges
  }
}
