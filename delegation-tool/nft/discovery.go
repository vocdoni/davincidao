package nft

import (
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/vocdoni/davincidao/delegation-tool/bindings/go/census"
	"github.com/vocdoni/davincidao/delegation-tool/bindings/go/erc721"
)

// TokenInfo represents information about an NFT
type TokenInfo struct {
	CollectionIndex *big.Int
	CollectionAddr  common.Address
	TokenID         *big.Int
	DelegatedTo     common.Address
}

// DiscoverOwnedNFTs discovers all NFTs owned by the given address across all collections
func DiscoverOwnedNFTs(
	ctx context.Context,
	censusContract *census.DavinciDao,
	owner common.Address,
) ([]*TokenInfo, error) {
	fmt.Printf("🔍 Discovering NFTs owned by %s...\n", owner.Hex())

	allNFTs := make([]*TokenInfo, 0)

	// Get number of collections
	collectionCount, err := getCollectionCount(censusContract)
	if err != nil {
		return nil, fmt.Errorf("failed to get collection count: %w", err)
	}

	fmt.Printf("   Found %d collections\n", collectionCount)

	// Iterate through each collection
	for i := 0; i < collectionCount; i++ {
		collectionAddr, err := censusContract.Collections(nil, big.NewInt(int64(i)))
		if err != nil {
			return nil, fmt.Errorf("failed to get collection %d: %w", i, err)
		}

		fmt.Printf("   📦 Collection %d: %s\n", i, collectionAddr.Hex())

		// Get NFTs from this collection
		nfts, err := discoverFromCollection(ctx, collectionAddr, owner, big.NewInt(int64(i)))
		if err != nil {
			fmt.Printf("      ⚠️  Warning: failed to discover NFTs from collection %d: %v\n", i, err)
			continue
		}

		fmt.Printf("      ✓ Found %d NFTs\n", len(nfts))
		allNFTs = append(allNFTs, nfts...)
	}

	fmt.Printf("   ✓ Total NFTs discovered: %d\n", len(allNFTs))
	return allNFTs, nil
}

// getCollectionCount attempts to determine the number of collections
func getCollectionCount(contract *census.DavinciDao) (int, error) {
	count := 0
	for i := 0; i < 100; i++ { // Reasonable upper limit
		_, err := contract.Collections(nil, big.NewInt(int64(i)))
		if err != nil {
			// Failed to get collection, assume we've reached the end
			break
		}
		count++
	}
	return count, nil
}

// discoverFromCollection discovers NFTs from a specific collection
func discoverFromCollection(
	ctx context.Context,
	collectionAddr common.Address,
	owner common.Address,
	collectionIndex *big.Int,
) ([]*TokenInfo, error) {
	// Try ERC721Enumerable first
	nfts, err := tryEnumerableDiscovery(collectionAddr, owner, collectionIndex)
	if err == nil && len(nfts) > 0 {
		return nfts, nil
	}

	// Fallback: manual scanning (less efficient)
	// This would require more sophisticated logic or external indexing
	return []*TokenInfo{}, fmt.Errorf("collection does not support enumeration, manual discovery required")
}

// tryEnumerableDiscovery tries to discover NFTs using ERC721Enumerable
func tryEnumerableDiscovery(
	collectionAddr common.Address,
	owner common.Address,
	collectionIndex *big.Int,
) ([]*TokenInfo, error) {
	// Note: This is a placeholder. In a real implementation, we would:
	// 1. Connect to the ERC721 contract
	// 2. Call balanceOf(owner)
	// 3. Loop through tokenOfOwnerByIndex(owner, i) for i in [0, balance)
	// 4. For each token, check delegation status

	// For now, return empty as this requires the eth client to be passed through
	return []*TokenInfo{}, fmt.Errorf("enumerable discovery not implemented in this simplified version")
}

// DiscoverUndelegatedNFTs finds NFTs owned by the address that are not yet delegated
func DiscoverUndelegatedNFTs(
	ctx context.Context,
	client bind.ContractBackend,
	censusContract *census.DavinciDao,
	owner common.Address,
	collectionIndex *big.Int,
	maxTokenID int64,
) ([]*TokenInfo, error) {
	fmt.Printf("🔍 Scanning for undelegated NFTs in collection %s...\n", collectionIndex.String())

	undelegated := make([]*TokenInfo, 0)

	// Get collection address
	collectionAddr, err := censusContract.Collections(nil, collectionIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to get collection address: %w", err)
	}

	// Create ERC721 contract instance
	nftContract, err := erc721.NewERC721(collectionAddr, client)
	if err != nil {
		return nil, fmt.Errorf("failed to create ERC721 contract: %w", err)
	}

	// Try to get balance first
	balance, err := nftContract.BalanceOf(nil, owner)
	if err != nil {
		return nil, fmt.Errorf("failed to get NFT balance: %w", err)
	}

	fmt.Printf("   Owner has balance of %s NFTs\n", balance.String())

	if balance.Cmp(big.NewInt(0)) == 0 {
		return undelegated, nil
	}

	// Try enumerable interface first
	supportsEnumerable, err := checkEnumerableSupport(nftContract)
	if err == nil && supportsEnumerable {
		fmt.Println("   ✓ Collection supports ERC721Enumerable")
		return discoverViaEnumerable(nftContract, censusContract, owner, collectionAddr, collectionIndex, balance)
	}

	// Fallback to scanning
	fmt.Println("   ℹ️  Using scan method (collection doesn't support enumerable)")
	return scanForOwnedTokens(nftContract, censusContract, owner, collectionAddr, collectionIndex, maxTokenID)
}

// checkEnumerableSupport checks if contract supports ERC721Enumerable
func checkEnumerableSupport(contract *erc721.ERC721) (bool, error) {
	// ERC721Enumerable interface ID: 0x780e9d63
	interfaceID := [4]byte{0x78, 0x0e, 0x9d, 0x63}
	return contract.SupportsInterface(nil, interfaceID)
}

// discoverViaEnumerable uses tokenOfOwnerByIndex to find NFTs
func discoverViaEnumerable(
	nftContract *erc721.ERC721,
	censusContract *census.DavinciDao,
	owner common.Address,
	collectionAddr common.Address,
	collectionIndex *big.Int,
	balance *big.Int,
) ([]*TokenInfo, error) {
	undelegated := make([]*TokenInfo, 0)

	balanceInt := balance.Int64()
	for i := int64(0); i < balanceInt; i++ {
		tokenID, err := nftContract.TokenOfOwnerByIndex(nil, owner, big.NewInt(i))
		if err != nil {
			fmt.Printf("      ⚠️  Failed to get token at index %d: %v\n", i, err)
			continue
		}

		// Check if token is delegated
		delegatedTo, err := getTokenDelegation(censusContract, collectionIndex, tokenID)
		if err != nil {
			fmt.Printf("      ⚠️  Failed to check delegation for token %s: %v\n", tokenID.String(), err)
			continue
		}

		if delegatedTo == (common.Address{}) {
			undelegated = append(undelegated, &TokenInfo{
				CollectionIndex: collectionIndex,
				CollectionAddr:  collectionAddr,
				TokenID:         tokenID,
				DelegatedTo:     delegatedTo,
			})
		}

		if (i+1)%10 == 0 {
			fmt.Printf("      ... checked %d/%d tokens\n", i+1, balanceInt)
		}
	}

	fmt.Printf("   ✓ Found %d undelegated NFTs\n", len(undelegated))
	return undelegated, nil
}

// scanForOwnedTokens scans token IDs to find owned tokens
func scanForOwnedTokens(
	nftContract *erc721.ERC721,
	censusContract *census.DavinciDao,
	owner common.Address,
	collectionAddr common.Address,
	collectionIndex *big.Int,
	maxTokenID int64,
) ([]*TokenInfo, error) {
	undelegated := make([]*TokenInfo, 0)

	fmt.Printf("   Scanning token IDs 0-%d...\n", maxTokenID)

	for tokenID := int64(0); tokenID <= maxTokenID; tokenID++ {
		tokenIDBig := big.NewInt(tokenID)

		// Check ownership
		tokenOwner, err := nftContract.OwnerOf(nil, tokenIDBig)
		if err != nil {
			// Token doesn't exist or error, skip
			continue
		}

		if tokenOwner != owner {
			continue
		}

		// Check if delegated
		delegatedTo, err := getTokenDelegation(censusContract, collectionIndex, tokenIDBig)
		if err != nil {
			continue
		}

		if delegatedTo == (common.Address{}) {
			undelegated = append(undelegated, &TokenInfo{
				CollectionIndex: collectionIndex,
				CollectionAddr:  collectionAddr,
				TokenID:         tokenIDBig,
				DelegatedTo:     delegatedTo,
			})
		}

		if (tokenID+1)%100 == 0 {
			fmt.Printf("      ... scanned %d tokens, found %d owned\n", tokenID+1, len(undelegated))
		}
	}

	fmt.Printf("   ✓ Scan complete: found %d undelegated NFTs\n", len(undelegated))
	return undelegated, nil
}

// GetTokenDelegation checks if a token is delegated
func GetTokenDelegation(
	contract *census.DavinciDao,
	collectionIndex *big.Int,
	tokenID *big.Int,
) (common.Address, error) {
	return getTokenDelegation(contract, collectionIndex, tokenID)
}

// getTokenDelegation checks if a token is delegated
func getTokenDelegation(
	contract *census.DavinciDao,
	collectionIndex *big.Int,
	tokenID *big.Int,
) (common.Address, error) {
	// Generate token key (same as contract's _tokenKey function)
	// keccak256(abi.encodePacked(nftIndex, tokenId))

	// Encode as packed bytes: collectionIndex (32 bytes) + tokenID (32 bytes)
	packed := append(
		common.LeftPadBytes(collectionIndex.Bytes(), 32),
		common.LeftPadBytes(tokenID.Bytes(), 32)...,
	)

	// Hash with keccak256
	key := crypto.Keccak256Hash(packed)

	// Call tokenDelegate mapping
	delegatedTo, err := contract.TokenDelegate(nil, key)
	if err != nil {
		return common.Address{}, err
	}

	return delegatedTo, nil
}
