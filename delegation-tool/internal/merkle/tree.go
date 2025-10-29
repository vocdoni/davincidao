package merkle

import (
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/iden3/go-iden3-crypto/poseidon"
	"github.com/vocdoni/davincidao/delegation-tool/bindings/go/census"
)

// TreeNode represents a node in the census tree
type TreeNode struct {
	Index   int
	Address common.Address
	Weight  uint64
	Leaf    *big.Int
}

// Tree represents a reconstructed census Merkle tree
type Tree struct {
	Root  *big.Int
	Nodes []*TreeNode
}

// ReconstructTree fetches the entire census tree from the contract
func ReconstructTree(ctx context.Context, contract *census.DavinciDao, maxAttempts int) (*Tree, error) {
	fmt.Println("📊 Reconstructing census tree from contract...")

	tree := &Tree{
		Nodes: make([]*TreeNode, 0),
	}

	// Get the current census root
	root, err := contract.GetCensusRoot(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get census root: %w", err)
	}
	tree.Root = root

	if root.Cmp(big.NewInt(0)) == 0 {
		fmt.Println("   ℹ️  Tree is empty (root = 0)")
		return tree, nil
	}

	// Enumerate all accounts in the tree
	consecutiveEmpty := 0
	index := 0

	for consecutiveEmpty < maxAttempts {
		addr, err := contract.GetAccountAt(nil, big.NewInt(int64(index)))
		if err != nil {
			return nil, fmt.Errorf("failed to get account at index %d: %w", index, err)
		}

		// Check if this slot is empty
		if addr == (common.Address{}) {
			consecutiveEmpty++
			index++
			continue
		}

		// Reset consecutive empty counter
		consecutiveEmpty = 0

		// Get delegation info for this address
		result, err := contract.GetDelegations(nil, addr)
		if err != nil {
			return nil, fmt.Errorf("failed to get delegations for %s: %w", addr.Hex(), err)
		}

		node := &TreeNode{
			Index:   index,
			Address: addr,
			Weight:  result.Weight.Uint64(),
			Leaf:    result.Leaf,
		}

		tree.Nodes = append(tree.Nodes, node)

		if (index+1)%10 == 0 {
			fmt.Printf("   ... found %d participants (index %d)\n", len(tree.Nodes), index)
		}

		index++
	}

	fmt.Printf("   ✓ Tree reconstruction complete: %d participants\n", len(tree.Nodes))
	return tree, nil
}

// GenerateProof generates a Merkle proof for the given address
func (t *Tree) GenerateProof(address common.Address) ([]*big.Int, error) {
	// Find the node for this address
	var targetNode *TreeNode
	var targetIndex int

	for i, node := range t.Nodes {
		if node.Address == address {
			targetNode = node
			targetIndex = i
			break
		}
	}

	if targetNode == nil {
		// Address not in tree, return empty proof (for first insertion)
		return []*big.Int{}, nil
	}

	// Build all leaves
	leaves := make([]*big.Int, len(t.Nodes))
	for i, node := range t.Nodes {
		leaves[i] = node.Leaf
	}

	// Generate proof using Poseidon hash
	siblings, err := generateLeanIMTProof(leaves, targetIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to generate proof: %w", err)
	}

	return siblings, nil
}

// generateLeanIMTProof generates a Merkle proof for Lean IMT using Poseidon hash
func generateLeanIMTProof(leaves []*big.Int, targetIndex int) ([]*big.Int, error) {
	if targetIndex >= len(leaves) {
		return nil, fmt.Errorf("target index %d out of bounds (tree has %d leaves)", targetIndex, len(leaves))
	}

	siblings := make([]*big.Int, 0)
	currentIndex := targetIndex
	currentLevel := make([]*big.Int, len(leaves))
	copy(currentLevel, leaves)

	// Build proof bottom-up
	for len(currentLevel) > 1 {
		nextLevel := make([]*big.Int, 0)

		// Determine sibling index
		var siblingIndex int
		if currentIndex%2 == 0 {
			siblingIndex = currentIndex + 1
		} else {
			siblingIndex = currentIndex - 1
		}

		// Add sibling to proof if it exists
		if siblingIndex < len(currentLevel) {
			siblings = append(siblings, currentLevel[siblingIndex])
		}

		// Build next level
		for i := 0; i < len(currentLevel); i += 2 {
			var hash *big.Int
			var err error

			if i+1 < len(currentLevel) {
				// Hash pair
				hash, err = poseidon.Hash([]*big.Int{currentLevel[i], currentLevel[i+1]})
				if err != nil {
					return nil, fmt.Errorf("poseidon hash failed: %w", err)
				}
			} else {
				// Odd node, just copy up
				hash = currentLevel[i]
			}

			nextLevel = append(nextLevel, hash)
		}

		currentLevel = nextLevel
		currentIndex = currentIndex / 2
	}

	return siblings, nil
}

// PackLeaf packs an address and weight into a leaf value (matches contract implementation)
func PackLeaf(address common.Address, weight uint64) *big.Int {
	// Convert address to uint160
	addressInt := new(big.Int).SetBytes(address.Bytes())

	// Shift address left by 88 bits
	addressShifted := new(big.Int).Lsh(addressInt, 88)

	// Add weight
	leaf := new(big.Int).Add(addressShifted, new(big.Int).SetUint64(weight))

	return leaf
}
