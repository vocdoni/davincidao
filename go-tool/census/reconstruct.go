package census

import (
	"context"
	"fmt"
	"math/big"
	"strconv"

	"github.com/ethereum/go-ethereum/common"
	leanimt "github.com/vocdoni/lean-imt-go"

	"github.com/vocdoni/davinci-onchain-census/go-tool/subgraph"
)

// weightChangeEvent represents a weight change event from the subgraph
type weightChangeEvent struct {
	accountID       string // lowercase address
	accountAddress  string // original case address
	previousWeight  string
	newWeight       string
	blockNumber     string
	blockTimestamp  string
	transactionHash string
	logIndex        string
}

// ReconstructTree rebuilds the census tree by replaying all WeightChanged events from the subgraph.
// This is the ONLY correct way to reconstruct the tree with the exact same structure
// as the on-chain contract, including empty slots from removed accounts.
//
// Parameters:
//   - ctx: Context for cancellation
//   - subgraphURL: The Graph subgraph endpoint URL
//
// Returns:
//   - tree: The reconstructed LeanIMT tree with correct structure
//   - root: The tree root as *big.Int
//   - err: Any error encountered during reconstruction
func ReconstructTree(ctx context.Context, subgraphURL string) (*leanimt.LeanIMT[*big.Int], *big.Int, error) {
	client := subgraph.NewClient(subgraphURL)
	fmt.Println("🔄 Reconstructing census tree from subgraph events...")

	// Step 1: Fetch ALL WeightChanged events in chronological order
	var allEvents []weightChangeEvent
	skip := 0
	pageSize := 1000

	for {
		events, err := client.GetWeightChangeEvents(ctx, pageSize, skip)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to fetch events: %w", err)
		}

		if len(events) == 0 {
			break
		}

		// Convert to internal format
		for _, e := range events {
			allEvents = append(allEvents, weightChangeEvent{
				accountID:       e.Account.ID,
				accountAddress:  e.Account.Address,
				previousWeight:  e.PreviousWeight,
				newWeight:       e.NewWeight,
				blockNumber:     e.BlockNumber,
				blockTimestamp:  e.BlockTimestamp,
				transactionHash: e.TransactionHash,
				logIndex:        e.LogIndex,
			})
		}

		skip += pageSize

		if len(events) < pageSize {
			break
		}
	}

	fmt.Printf("   ├─ Fetched %d WeightChanged events\n", len(allEvents))

	if len(allEvents) == 0 {
		fmt.Println("   └─ ⚠️  No events found, tree is empty")
		// Return empty tree
		tree, err := leanimt.New(leanimt.PoseidonHasher, leanimt.BigIntEqual, nil, nil, nil)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to create empty tree: %w", err)
		}
		return tree, big.NewInt(0), nil
	}

	// Step 2: Create tree with Poseidon hash (matching contract)
	tree, err := leanimt.New(leanimt.PoseidonHasher, leanimt.BigIntEqual, nil, nil, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create tree: %w", err)
	}

	// Step 3: Replay all events in chronological order
	fmt.Println("   ├─ Replaying events to reconstruct tree...")

	for i, event := range allEvents {
		prevWeight, err := strconv.ParseUint(event.previousWeight, 10, 64)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid previousWeight in event %d: %w", i, err)
		}

		newWeight, err := strconv.ParseUint(event.newWeight, 10, 64)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid newWeight in event %d: %w", i, err)
		}

		// Parse account address
		accountAddr := common.HexToAddress(event.accountID)

		// Pack leaves: (address << 88) | weight
		addr := new(big.Int).SetBytes(accountAddr.Bytes())
		oldLeaf := new(big.Int).Lsh(addr, 88)
		oldLeaf.Or(oldLeaf, big.NewInt(int64(prevWeight)))

		newLeaf := new(big.Int).Lsh(addr, 88)
		newLeaf.Or(newLeaf, big.NewInt(int64(newWeight)))

		// Determine operation type and execute
		if prevWeight == 0 && newWeight > 0 {
			// INSERT: New account getting weight
			if err := tree.Insert(newLeaf); err != nil {
				return nil, nil, fmt.Errorf("insert failed for event %d: %w", i, err)
			}
			if (i+1)%100 == 0 || i < 10 {
				fmt.Printf("   │   INSERT %s weight=%d (tree size: %d)\n",
					accountAddr.Hex()[:10], newWeight, tree.Size())
			}

		} else if newWeight == 0 && prevWeight > 0 {
			// REMOVE: Account weight going to 0
			// CRITICAL: tree.Update(index, 0) sets the leaf to 0 but KEEPS the slot
			// The tree size doesn't decrease - it maintains an empty slot at that index
			index := tree.IndexOf(oldLeaf)
			if index == -1 {
				return nil, nil, fmt.Errorf("remove failed: leaf not found for %s in event %d",
					accountAddr.Hex(), i)
			}
			if err := tree.Update(index, big.NewInt(0)); err != nil {
				return nil, nil, fmt.Errorf("remove (update to 0) failed for event %d: %w", i, err)
			}
			if (i+1)%100 == 0 || i < 10 {
				fmt.Printf("   │   REMOVE %s at index %d (tree size: %d)\n",
					accountAddr.Hex()[:10], index, tree.Size())
			}

		} else if prevWeight > 0 && newWeight > 0 {
			// UPDATE: Weight change (both > 0)
			index := tree.IndexOf(oldLeaf)
			if index == -1 {
				return nil, nil, fmt.Errorf("update failed: leaf not found for %s in event %d",
					accountAddr.Hex(), i)
			}
			if err := tree.Update(index, newLeaf); err != nil {
				return nil, nil, fmt.Errorf("update failed for event %d: %w", i, err)
			}
			if (i+1)%100 == 0 || i < 10 {
				fmt.Printf("   │   UPDATE %s weight %d→%d at index %d\n",
					accountAddr.Hex()[:10], prevWeight, newWeight, index)
			}
		}
	}

	// Step 4: Get final root
	root, exists := tree.Root()
	if !exists {
		return nil, nil, fmt.Errorf("tree root does not exist after reconstruction")
	}

	fmt.Printf("   ├─ Tree reconstruction complete\n")
	fmt.Printf("   ├─ Tree size: %d (including empty slots)\n", tree.Size())
	fmt.Printf("   └─ Root: 0x%x\n", root)

	return tree, root, nil
}

// PackLeaf packs an address and weight into a leaf value (matches contract implementation)
// This is a utility function for creating leaf values in the same format as the contract:
// leaf = (address << 88) | weight
func PackLeaf(address common.Address, weight uint64) *big.Int {
	// Convert address to uint160
	addr := new(big.Int).SetBytes(address.Bytes())

	// Shift address left by 88 bits and add weight
	leaf := new(big.Int).Lsh(addr, 88)
	leaf.Or(leaf, big.NewInt(int64(weight)))

	return leaf
}

// UnpackLeaf unpacks a leaf value into address and weight
// This is the inverse of PackLeaf
func UnpackLeaf(leaf *big.Int) (common.Address, uint64) {
	// Extract weight (lower 88 bits)
	weightMask := new(big.Int).Sub(new(big.Int).Lsh(big.NewInt(1), 88), big.NewInt(1))
	weight := new(big.Int).And(leaf, weightMask)

	// Extract address (upper bits, shifted right by 88)
	addr := new(big.Int).Rsh(leaf, 88)

	// Convert to address (take lower 160 bits)
	addrBytes := addr.Bytes()
	var address common.Address
	if len(addrBytes) <= 20 {
		copy(address[20-len(addrBytes):], addrBytes)
	} else {
		copy(address[:], addrBytes[len(addrBytes)-20:])
	}

	return address, weight.Uint64()
}

// ValidateRoot verifies that the reconstructed tree root matches the expected on-chain root.
// This should be called before generating proofs to ensure correctness.
//
// Parameters:
//   - tree: The reconstructed tree from ReconstructTree
//   - expectedRoot: The on-chain root as *big.Int
//
// Returns error if roots don't match
func ValidateRoot(tree *leanimt.LeanIMT[*big.Int], expectedRoot *big.Int) error {
	root, exists := tree.Root()
	if !exists {
		return fmt.Errorf("tree has no root")
	}

	if root.Cmp(expectedRoot) != 0 {
		return fmt.Errorf("root mismatch: expected 0x%x, got 0x%x", expectedRoot, root)
	}

	return nil
}
