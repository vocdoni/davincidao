package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/spf13/pflag"

	"github.com/vocdoni/davincidao/delegation-tool/bindings/go/census"
	censuspkg "github.com/vocdoni/davincidao/delegation-tool/census"
)

func main() {
	var (
		subgraphURL  string
		rpcURL       string
		contractAddr string
		showTree     bool
	)

	pflag.StringVarP(&subgraphURL, "subgraph", "s", "", "The Graph subgraph endpoint URL (required)")
	pflag.StringVarP(&rpcURL, "rpc", "r", "", "Ethereum RPC endpoint URL (required)")
	pflag.StringVarP(&contractAddr, "contract", "c", "", "DavinciDao contract address (required)")
	pflag.BoolVarP(&showTree, "show-tree", "t", false, "Show tree structure (all leaves)")
	pflag.Parse()

	// Validate required flags
	if subgraphURL == "" || rpcURL == "" || contractAddr == "" {
		fmt.Println("Error: --subgraph, --rpc, and --contract flags are required\n")
		pflag.Usage()
		os.Exit(1)
	}

	if err := verifyTree(subgraphURL, rpcURL, contractAddr, showTree); err != nil {
		fmt.Printf("\n❌ Verification failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("\n✅ Verification successful!")
}

func verifyTree(subgraphURL, rpcURL, contractAddr string, showTree bool) error {
	ctx := context.Background()

	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("  DavinciDAO Census Tree Verification")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println()

	// Step 1: Connect to contract
	fmt.Println("📡 Connecting to contract...")
	fmt.Printf("   RPC:      %s\n", rpcURL)
	fmt.Printf("   Contract: %s\n", contractAddr)

	ethClient, err := ethclient.Dial(rpcURL)
	if err != nil {
		return fmt.Errorf("failed to connect to RPC: %w", err)
	}
	defer ethClient.Close()

	contract, err := census.NewDavinciDao(common.HexToAddress(contractAddr), ethClient)
	if err != nil {
		return fmt.Errorf("failed to create contract instance: %w", err)
	}

	// Get on-chain root
	onChainRoot, err := contract.GetCensusRoot(nil)
	if err != nil {
		return fmt.Errorf("failed to get on-chain root: %w", err)
	}

	fmt.Printf("   ✓ Connected\n")
	fmt.Printf("   On-chain root: 0x%x\n", onChainRoot)
	fmt.Println()

	// Step 2: Reconstruct tree from subgraph
	fmt.Println("🔄 Reconstructing tree from subgraph...")
	fmt.Printf("   Subgraph: %s\n", subgraphURL)

	startTime := time.Now()

	tree, reconstructedRoot, err := censuspkg.ReconstructTree(ctx, subgraphURL)
	if err != nil {
		return fmt.Errorf("tree reconstruction failed: %w", err)
	}

	duration := time.Since(startTime)

	fmt.Println()
	fmt.Println("📊 Tree Statistics")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("   Reconstructed root:  0x%x\n", reconstructedRoot)
	fmt.Printf("   Tree size:           %d leaves\n", tree.Size())
	fmt.Printf("   Tree depth:          %d levels\n", tree.Depth())
	fmt.Printf("   Reconstruction time: %v\n", duration)

	// Count active accounts (non-zero leaves)
	leaves := tree.Leaves()
	activeCount := 0
	emptyCount := 0
	for _, leaf := range leaves {
		if leaf.Cmp(censuspkg.PackLeaf(common.Address{}, 0)) == 0 {
			emptyCount++
		} else {
			activeCount++
		}
	}
	fmt.Printf("   Active accounts:     %d\n", activeCount)
	fmt.Printf("   Empty slots:         %d\n", emptyCount)

	// Step 3: Validate root
	fmt.Println()
	fmt.Println("🔍 Validating Root")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	if err := censuspkg.ValidateRoot(tree, onChainRoot); err != nil {
		fmt.Println("   ❌ ROOT MISMATCH!")
		fmt.Printf("   Expected (on-chain): 0x%x\n", onChainRoot)
		fmt.Printf("   Got (reconstructed): 0x%x\n", reconstructedRoot)
		return fmt.Errorf("root validation failed: %w", err)
	}

	fmt.Println("   ✅ Root matches perfectly!")
	fmt.Printf("   Root: 0x%x\n", onChainRoot)

	// Step 4: Show tree structure if requested
	if showTree {
		fmt.Println()
		fmt.Println("🌳 Tree Structure")
		fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

		for i, leaf := range leaves {
			if leaf.Cmp(censuspkg.PackLeaf(common.Address{}, 0)) == 0 {
				fmt.Printf("   [%3d] EMPTY (removed account)\n", i)
			} else {
				addr, weight := censuspkg.UnpackLeaf(leaf)
				fmt.Printf("   [%3d] %s (weight: %d)\n", i, addr.Hex(), weight)
			}
		}
	}

	return nil
}
