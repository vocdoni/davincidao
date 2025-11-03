package census_test

import (
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/vocdoni/davinci-onchain-census/go-tool/subgraph"
	"github.com/vocdoni/davinci-onchain-census/go-tool/census"
)

// Example demonstrates how to reconstruct the census tree from subgraph events
func Example_reconstructTree() {
	ctx := context.Background()

	// Step 1: Create subgraph client
	subgraphURL := "https://api.studio.thegraph.com/query/1704875/davinci-base-haberdashery/v0.0.1"
	client := subgraph.NewClient(subgraphURL)

	// Step 2: Create adapter
	adapter := census.NewSubgraphAdapter(client)

	// Step 3: Create tree reconstructor
	reconstructor := census.NewTreeReconstructor(adapter)

	// Step 4: Reconstruct tree
	tree, root, size, err := reconstructor.ReconstructTree(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Printf("✓ Tree reconstructed successfully\n")
	fmt.Printf("  Root: 0x%x\n", root)
	fmt.Printf("  Size: %d\n", size)

	// Step 5: Validate against expected root (from contract)
	// expectedRoot := getContractRoot() // Get from contract
	// if err := census.ValidateRoot(tree, expectedRoot); err != nil {
	//     fmt.Printf("Validation failed: %v\n", err)
	//     return
	// }

	// Step 6: Generate proofs for specific addresses
	address := common.HexToAddress("0xdeb8699659be5d41a0e57e179d6cb42e00b9200c")
	weight := uint64(3)
	leaf := census.PackLeaf(address, weight)

	index := tree.IndexOf(leaf)
	if index != -1 {
		proof, err := tree.GenerateProof(index)
		if err != nil {
			fmt.Printf("Failed to generate proof: %v\n", err)
			return
		}
		fmt.Printf("  Proof for %s: %d siblings\n", address.Hex(), len(proof.Siblings))
	}

	// Output:
	// ✓ Tree reconstructed successfully
}

// Example demonstrates using a custom subgraph client implementation
func Example_customClient() {
	ctx := context.Background()

	// Implement your own SubgraphClient interface
	customClient := &MyCustomSubgraphClient{
		endpoint: "https://my-subgraph.example.com",
	}

	// Create reconstructor with custom client
	reconstructor := census.NewTreeReconstructor(customClient)

	// Reconstruct tree
	tree, root, size, err := reconstructor.ReconstructTree(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Printf("Reconstructed tree with %d leaves, root: 0x%x\n", size, root)
}

// MyCustomSubgraphClient is an example custom implementation
type MyCustomSubgraphClient struct {
	endpoint string
}

// GetWeightChangeEvents implements census.SubgraphClient
func (c *MyCustomSubgraphClient) GetWeightChangeEvents(ctx context.Context, first int, skip int) ([]census.WeightChangeEvent, error) {
	// Your custom implementation here
	return nil, fmt.Errorf("not implemented")
}

// Example demonstrates leaf packing and unpacking
func Example_leafOperations() {
	// Pack a leaf
	address := common.HexToAddress("0x1234567890123456789012345678901234567890")
	weight := uint64(42)
	leaf := census.PackLeaf(address, weight)

	fmt.Printf("Packed leaf: 0x%x\n", leaf)

	// Unpack a leaf
	unpackedAddr, unpackedWeight := census.UnpackLeaf(leaf)
	fmt.Printf("Address: %s\n", unpackedAddr.Hex())
	fmt.Printf("Weight: %d\n", unpackedWeight)

	// Verify they match
	if unpackedAddr == address && unpackedWeight == weight {
		fmt.Println("✓ Pack/Unpack successful")
	}

	// Output:
	// ✓ Pack/Unpack successful
}

// Example demonstrates validating the reconstructed tree root
func Example_validateRoot() {
	ctx := context.Background()

	// Reconstruct tree
	client := subgraph.NewClient("https://api.studio.thegraph.com/query/...")
	adapter := census.NewSubgraphAdapter(client)
	reconstructor := census.NewTreeReconstructor(adapter)

	tree, _, _, err := reconstructor.ReconstructTree(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Get expected root from contract
	expectedRoot := new(big.Int)
	expectedRoot.SetString("b9bfd451512e798787ac296c4a3160771d365fb63a96ca86ab2a1c56f656efa", 16)

	// Validate
	if err := census.ValidateRoot(tree, expectedRoot); err != nil {
		fmt.Printf("Validation failed: %v\n", err)
		return
	}

	fmt.Println("✓ Root validation passed")

	// Output:
	// ✓ Root validation passed
}
