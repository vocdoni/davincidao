package main

import (
	"context"
	"crypto/ecdsa"
	crand "crypto/rand"
	"fmt"
	"math/big"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/spf13/pflag"
	"github.com/vocdoni/davincidao/delegation-tool/bindings/go/census"
	"github.com/vocdoni/davincidao/delegation-tool/internal/nft"
	"github.com/vocdoni/davincidao/delegation-tool/internal/subgraph"
)

const (
	banner = `
╔═══════════════════════════════════════════════════════════╗
║         DavinciDAO Delegation Tool v2.0                   ║
║         Automated NFT Delegation Manager (Gas Optimized)  ║
╚═══════════════════════════════════════════════════════════╝
`
)

var (
	// CLI flags
	contractAddr   string
	rpcEndpoint    string
	privateKeyHex  string
	alchemyAPIKey  string
	subgraphURL    string
	numDelegates   int
	collectionIdx  int
	startTokenID   int
	maxTokenScan   int
	tokensPerTx    int
	confirmations  int
	gasMultiplier  float64
	dryRun         bool
)

func init() {
	pflag.StringVar(&contractAddr, "contract", "", "DavinciDAO census contract address (required)")
	pflag.StringVar(&rpcEndpoint, "rpc", "", "Ethereum RPC endpoint (required)")
	pflag.StringVar(&privateKeyHex, "private-key", "", "Private key for signing transactions (required)")
	pflag.StringVar(&alchemyAPIKey, "alchemy-key", "", "Alchemy API key for NFT discovery (optional, enables fast NFT discovery)")
	pflag.StringVar(&subgraphURL, "subgraph-url", "", "The Graph subgraph endpoint URL (optional, for querying delegation data)")
	pflag.IntVar(&numDelegates, "delegates", 1, "Number of random delegates to create")
	pflag.IntVar(&collectionIdx, "collection", 0, "Collection index to use (default: 0)")
	pflag.IntVar(&startTokenID, "start-token", 1, "Starting token ID for sequential mode (default: 1)")
	pflag.IntVar(&maxTokenScan, "max-scan", 10000, "Maximum token ID to scan when discovering NFTs")
	pflag.IntVar(&tokensPerTx, "tokens-per-tx", 10, "Number of tokens to delegate per transaction")
	pflag.IntVar(&confirmations, "confirmations", 1, "Number of block confirmations to wait")
	pflag.Float64Var(&gasMultiplier, "gas-multiplier", 1.2, "Gas price multiplier for faster transactions")
	pflag.BoolVar(&dryRun, "dry-run", false, "Simulate without sending transactions")
}

func main() {
	pflag.Parse()

	// Print banner
	fmt.Println(banner)

	// Validate required flags
	if err := validateFlags(); err != nil {
		fmt.Printf("❌ Error: %v\n\n", err)
		pflag.Usage()
		os.Exit(1)
	}

	// Run the delegation process with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	if err := run(ctx); err != nil {
		fmt.Printf("\n❌ Fatal error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("\n✅ Delegation process completed successfully!")
}

func validateFlags() error {
	if contractAddr == "" {
		return fmt.Errorf("--contract is required")
	}
	if !common.IsHexAddress(contractAddr) {
		return fmt.Errorf("invalid contract address: %s", contractAddr)
	}
	if rpcEndpoint == "" {
		return fmt.Errorf("--rpc is required")
	}
	if privateKeyHex == "" {
		return fmt.Errorf("--private-key is required")
	}
	if numDelegates < 1 {
		return fmt.Errorf("--delegates must be at least 1")
	}
	if tokensPerTx < 1 {
		return fmt.Errorf("--tokens-per-tx must be at least 1")
	}
	return nil
}

func run(ctx context.Context) error {
	fmt.Println("🔌 Connecting to Ethereum node...")
	fmt.Printf("   RPC: %s\n", rpcEndpoint)

	// Initialize subgraph client if URL provided
	var sgClient *subgraph.Client
	if subgraphURL != "" {
		fmt.Println("🌐 Initializing subgraph client...")
		fmt.Printf("   URL: %s\n", subgraphURL)
		sgClient = subgraph.NewClient(subgraphURL)

		// Test connection by fetching global stats
		stats, err := sgClient.GetGlobalStats(ctx)
		if err != nil {
			fmt.Printf("   ⚠️  Warning: Failed to connect to subgraph: %v\n", err)
			fmt.Println("   Continuing without subgraph data...")
			sgClient = nil
		} else if stats != nil {
			fmt.Printf("   ✓ Subgraph connected: %s total delegations\n", stats.TotalDelegations)
		}
	}

	// Connect to Ethereum client
	client, err := ethclient.Dial(rpcEndpoint)
	if err != nil {
		return fmt.Errorf("failed to connect to Ethereum client: %w", err)
	}
	defer client.Close()

	// Get chain ID
	chainID, err := client.ChainID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get chain ID: %w", err)
	}
	fmt.Printf("   ✓ Connected to chain ID: %s\n", chainID.String())

	// Load private key (strip 0x prefix if present)
	privateKeyClean := strings.TrimPrefix(privateKeyHex, "0x")
	privateKey, err := crypto.HexToECDSA(privateKeyClean)
	if err != nil {
		return fmt.Errorf("failed to parse private key: %w", err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return fmt.Errorf("failed to cast public key to ECDSA")
	}

	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	fmt.Printf("   ✓ Loaded account: %s\n", fromAddress.Hex())

	// Check account balance
	balance, err := client.BalanceAt(ctx, fromAddress, nil)
	if err != nil {
		return fmt.Errorf("failed to get account balance: %w", err)
	}
	fmt.Printf("   ✓ Account balance: %s ETH\n", weiToEther(balance))

	if balance.Cmp(big.NewInt(0)) == 0 {
		return fmt.Errorf("account has zero balance, cannot pay for gas")
	}

	// Create contract instance
	fmt.Println("\n📜 Loading DavinciDAO contract...")
	fmt.Printf("   Contract: %s\n", contractAddr)

	contractAddress := common.HexToAddress(contractAddr)
	censusContract, err := census.NewDavinciDao(contractAddress, client)
	if err != nil {
		return fmt.Errorf("failed to instantiate contract: %w", err)
	}

	// Verify contract
	censusRoot, err := censusContract.GetCensusRoot(nil)
	if err != nil {
		return fmt.Errorf("failed to get census root (is this a valid DavinciDAO contract?): %w", err)
	}
	fmt.Printf("   ✓ Contract verified (census root: %s)\n", censusRoot.String())

	// Discover undelegated NFTs
	fmt.Println("\n🔍 Discovering NFTs...")

	var undelegatedNFTs []*nft.TokenInfo
	useAlchemy := alchemyAPIKey != ""

	// Try Alchemy API first if key is provided
	if useAlchemy {
		fmt.Println("   Using Alchemy API for fast NFT discovery...")

		// Get collection address
		collectionAddr, err := censusContract.Collections(nil, big.NewInt(int64(collectionIdx)))
		if err != nil {
			return fmt.Errorf("failed to get collection address: %w", err)
		}

		// Determine network from chain ID
		network := "eth-sepolia"
		if chainID.Cmp(big.NewInt(1)) == 0 {
			network = "eth-mainnet"
		}

		// Get total count first
		totalCount, err := nft.GetNFTCountFromAlchemy(alchemyAPIKey, network, fromAddress, collectionAddr)
		if err != nil {
			fmt.Printf("   ⚠️  Alchemy API failed: %v\n", err)
			fmt.Println("   Falling back to generating sequential token IDs")
			useAlchemy = false
		} else {
			fmt.Printf("   ✓ Owner has %d NFTs in collection\n", totalCount)

			// Create delegation checker function
			checkDelegation := func(tokenID *big.Int) (common.Address, error) {
				return nft.GetTokenDelegation(censusContract, big.NewInt(int64(collectionIdx)), tokenID)
			}

			// Fetch NFTs with delegation status (stop after finding enough undelegated)
			requiredNFTs := numDelegates * tokensPerTx
			allNFTs, err := nft.FetchNFTsFromAlchemy(alchemyAPIKey, network, fromAddress, collectionAddr, checkDelegation, requiredNFTs)
			if err != nil {
				fmt.Printf("   ⚠️  Failed to fetch NFTs: %v\n", err)
				useAlchemy = false
			} else {
				// Filter for undelegated tokens only
				undelegatedNFTs = make([]*nft.TokenInfo, 0)
				for _, token := range allNFTs {
					if token.DelegatedTo == (common.Address{}) {
						token.CollectionIndex = big.NewInt(int64(collectionIdx))
						undelegatedNFTs = append(undelegatedNFTs, token)
					}
				}

				fmt.Printf("   ✓ Found %d NFTs total, %d undelegated\n", len(allNFTs), len(undelegatedNFTs))

				// Debug: print first few undelegated token IDs
				if len(undelegatedNFTs) > 0 {
					fmt.Printf("   📋 First undelegated tokens: ")
					for i := 0; i < len(undelegatedNFTs) && i < 10; i++ {
						if i > 0 {
							fmt.Printf(", ")
						}
						fmt.Printf("%s", undelegatedNFTs[i].TokenID.String())
					}
					fmt.Println()
				}

				// Check if we have enough
				requiredNFTs := numDelegates * tokensPerTx
				if len(undelegatedNFTs) < requiredNFTs {
					return fmt.Errorf(
						"insufficient undelegated NFTs: need %d (= %d delegates × %d tokens/tx), have %d",
						requiredNFTs, numDelegates, tokensPerTx, len(undelegatedNFTs),
					)
				}
			}
		}
	}

	// Fallback: generate sequential IDs if Alchemy not used or failed
	if !useAlchemy {
		// No Alchemy key or Alchemy failed - use sequential IDs
		fmt.Println("   ℹ️  No Alchemy API key provided - generating sequential token IDs")
		fmt.Printf("   ℹ️  Assuming you own tokens starting from ID %d\n", startTokenID)

		// Generate sequential token IDs
		undelegatedNFTs = make([]*nft.TokenInfo, 0)
		requiredNFTs := numDelegates * tokensPerTx
		for i := 0; i < requiredNFTs; i++ {
			undelegatedNFTs = append(undelegatedNFTs, &nft.TokenInfo{
				CollectionIndex: big.NewInt(int64(collectionIdx)),
				TokenID:         big.NewInt(int64(startTokenID + i)),
			})
		}
		fmt.Printf("   ✓ Generated %d sequential token IDs (%d-%d)\n", requiredNFTs, startTokenID, startTokenID+requiredNFTs-1)
	}

	// Generate random delegate addresses
	fmt.Printf("\n🎲 Generating %d random delegate addresses...\n", numDelegates)
	delegates, err := generateRandomAddresses(numDelegates)
	if err != nil {
		return fmt.Errorf("failed to generate delegate addresses: %w", err)
	}
	for i, delegate := range delegates {
		fmt.Printf("   Delegate %d: %s\n", i+1, delegate.Hex())
	}

	// On-chain Merkle tree handles proofs automatically
	fmt.Println("\n✅ On-chain Merkle tree construction enabled!")

	if dryRun {
		fmt.Println("\n🔍 DRY RUN MODE - No transactions will be sent")
		return simulateDelegations(delegates, undelegatedNFTs)
	}

	// Execute delegations
	fmt.Println("\n🚀 Starting delegation process...")
	return executeDelegations(
		ctx,
		client,
		censusContract,
		privateKey,
		chainID,
		fromAddress,
		delegates,
		undelegatedNFTs,
	)
}

func simulateDelegations(delegates []common.Address, nfts []*nft.TokenInfo) error {
	nftIndex := 0

	for i, delegate := range delegates {
		fmt.Printf("\n📋 Delegate %d/%d: %s\n", i+1, len(delegates), delegate.Hex())

		// Get tokens for this delegate
		tokens := make([]*big.Int, 0, tokensPerTx)
		for j := 0; j < tokensPerTx && nftIndex < len(nfts); j++ {
			tokens = append(tokens, nfts[nftIndex].TokenID)
			nftIndex++
		}

		fmt.Printf("   Tokens to delegate: %v\n", tokenIDs(tokens))
		fmt.Printf("   ✓ Would delegate %d tokens to %s\n", len(tokens), delegate.Hex())
	}

	return nil
}

func executeDelegations(
	ctx context.Context,
	client *ethclient.Client,
	contract *census.DavinciDao,
	privateKey *ecdsa.PrivateKey,
	chainID *big.Int,
	fromAddress common.Address,
	delegates []common.Address,
	nfts []*nft.TokenInfo,
) error {
	totalGasUsed := big.NewInt(0)
	totalCostWei := big.NewInt(0)
	nftIndex := 0

	// Get initial nonce
	nonce, err := client.PendingNonceAt(ctx, fromAddress)
	if err != nil {
		return fmt.Errorf("failed to get nonce: %w", err)
	}

	for i, delegate := range delegates {
		fmt.Printf("\n📤 Delegate %d/%d: %s\n", i+1, len(delegates), delegate.Hex())

		// Get tokens for this delegate
		tokenIDs := make([]*big.Int, 0, tokensPerTx)
		for j := 0; j < tokensPerTx && nftIndex < len(nfts); j++ {
			tokenIDs = append(tokenIDs, nfts[nftIndex].TokenID)
			nftIndex++
		}

		if len(tokenIDs) == 0 {
			fmt.Println("   ⚠️  No more tokens available, skipping")
			continue
		}

		fmt.Printf("   Tokens: %v\n", tokenIDsToString(tokenIDs))

		// Prepare transaction
		auth, err := bind.NewKeyedTransactorWithChainID(privateKey, chainID)
		if err != nil {
			return fmt.Errorf("failed to create transactor: %w", err)
		}

		auth.Nonce = big.NewInt(int64(nonce))
		auth.Context = ctx

		// Get gas price and apply multiplier
		gasPrice, err := client.SuggestGasPrice(ctx)
		if err != nil {
			return fmt.Errorf("failed to get gas price: %w", err)
		}

		multipliedPrice := new(big.Float).Mul(
			new(big.Float).SetInt(gasPrice),
			big.NewFloat(gasMultiplier),
		)
		auth.GasPrice, _ = multipliedPrice.Int(nil)

		fmt.Printf("   Gas price: %s Gwei (multiplier: %.1fx)\n",
			weiToGwei(auth.GasPrice), gasMultiplier)

		// Send delegation transaction (with empty proofs for new delegations)
		fmt.Println("   ⏳ Sending transaction...")
		emptyProof := make([]*big.Int, 0)
		emptyFromProofs := make([]census.DavinciDaoProofInput, 0)
		tx, err := contract.Delegate(
			auth,
			delegate,
			big.NewInt(int64(collectionIdx)),
			tokenIDs,
			emptyProof,
			emptyFromProofs,
		)
		if err != nil {
			return fmt.Errorf("failed to send delegation transaction: %w", err)
		}

		fmt.Printf("   📝 Transaction hash: %s\n", tx.Hash().Hex())

		// Wait for confirmation
		fmt.Printf("   ⏳ Waiting for %d confirmation(s)...\n", confirmations)
		receipt, err := waitForConfirmations(ctx, client, tx.Hash(), confirmations)
		if err != nil {
			return fmt.Errorf("transaction failed: %w", err)
		}

		// Report gas usage
		gasUsed := new(big.Int).SetUint64(receipt.GasUsed)
		txCost := new(big.Int).Mul(gasUsed, receipt.EffectiveGasPrice)

		totalGasUsed.Add(totalGasUsed, gasUsed)
		totalCostWei.Add(totalCostWei, txCost)

		fmt.Printf("   ✅ Confirmed in block %d\n", receipt.BlockNumber.Uint64())
		fmt.Printf("   ⛽ Gas used: %s\n", formatWithCommas(gasUsed.Uint64()))
		fmt.Printf("   💰 Cost: %s ETH\n", weiToEther(txCost))

		// Tree updates automatically on-chain, tracked in subgraph
		nonce++

		// Small delay between transactions
		if i < len(delegates)-1 {
			time.Sleep(2 * time.Second)
		}
	}

	// Print summary
	fmt.Println("\n" + strings.Repeat("═", 60))
	fmt.Println("📊 TRANSACTION SUMMARY")
	fmt.Println(strings.Repeat("═", 60))
	fmt.Printf("Total transactions:  %d\n", len(delegates))
	fmt.Printf("Total gas used:      %s\n", formatWithCommas(totalGasUsed.Uint64()))
	fmt.Printf("Total cost:          %s ETH\n", weiToEther(totalCostWei))
	fmt.Printf("Average cost/tx:     %s ETH\n", weiToEther(new(big.Int).Div(totalCostWei, big.NewInt(int64(len(delegates))))))
	fmt.Println(strings.Repeat("═", 60))

	return nil
}

func waitForConfirmations(
	ctx context.Context,
	client *ethclient.Client,
	txHash common.Hash,
	confirmations int,
) (*types.Receipt, error) {
	for {
		receipt, err := client.TransactionReceipt(ctx, txHash)
		if err != nil {
			time.Sleep(1 * time.Second)
			continue
		}

		if receipt.Status == 0 {
			return nil, fmt.Errorf("transaction reverted")
		}

		// Get current block
		currentBlock, err := client.BlockNumber(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get current block: %w", err)
		}

		confirmCount := currentBlock - receipt.BlockNumber.Uint64()
		if confirmCount >= uint64(confirmations) {
			return receipt, nil
		}

		time.Sleep(1 * time.Second)
	}
}

func generateRandomAddresses(count int) ([]common.Address, error) {
	addresses := make([]common.Address, count)
	for i := 0; i < count; i++ {
		// Use crypto/rand for cryptographically secure randomness
		privateKey, err := ecdsa.GenerateKey(crypto.S256(), crand.Reader)
		if err != nil {
			return nil, fmt.Errorf("failed to generate key %d: %w", i, err)
		}
		publicKey := privateKey.Public()
		publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
		if !ok {
			return nil, fmt.Errorf("failed to cast public key %d to ECDSA", i)
		}
		addresses[i] = crypto.PubkeyToAddress(*publicKeyECDSA)
	}
	return addresses, nil
}

func weiToEther(wei *big.Int) string {
	ether := new(big.Float).Quo(
		new(big.Float).SetInt(wei),
		big.NewFloat(1e18),
	)
	return fmt.Sprintf("%.6f", ether)
}

func weiToGwei(wei *big.Int) string {
	gwei := new(big.Float).Quo(
		new(big.Float).SetInt(wei),
		big.NewFloat(1e9),
	)
	return fmt.Sprintf("%.2f", gwei)
}

func formatWithCommas(n uint64) string {
	str := fmt.Sprintf("%d", n)
	var result string
	for i, c := range str {
		if i > 0 && (len(str)-i)%3 == 0 {
			result += ","
		}
		result += string(c)
	}
	return result
}

func tokenIDsToString(ids []*big.Int) string {
	if len(ids) == 0 {
		return "[]"
	}
	result := "["
	for i, id := range ids {
		if i > 0 {
			result += ", "
		}
		result += id.String()
	}
	result += "]"
	return result
}

func tokenIDs(ids []*big.Int) []string {
	result := make([]string, len(ids))
	for i, id := range ids {
		result[i] = id.String()
	}
	return result
}
