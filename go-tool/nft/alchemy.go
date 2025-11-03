package nft

import (
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"net/url"

	"github.com/ethereum/go-ethereum/common"
)

// AlchemyNFTResponse represents the response from Alchemy's getNFTsForOwner API
type AlchemyNFTResponse struct {
	OwnedNfts  []AlchemyNFT `json:"ownedNfts"`
	TotalCount int          `json:"totalCount"`
	PageKey    string       `json:"pageKey,omitempty"`
}

// AlchemyNFT represents a single NFT in the Alchemy response
type AlchemyNFT struct {
	Contract struct {
		Address string `json:"address"`
	} `json:"contract"`
	TokenID string `json:"tokenId"`
}

// FetchNFTsFromAlchemy fetches NFTs owned by an address using Alchemy API
// If maxUndelegated > 0, stops after finding that many undelegated tokens
func FetchNFTsFromAlchemy(
	apiKey string,
	network string,
	owner common.Address,
	contractAddress common.Address,
	checkDelegation func(tokenID *big.Int) (common.Address, error),
	maxUndelegated int,
) ([]*TokenInfo, error) {
	baseURL := fmt.Sprintf("https://%s.g.alchemy.com/nft/v3/%s/getNFTsForOwner", network, apiKey)

	allNFTs := make([]*TokenInfo, 0)
	undelegatedCount := 0
	pageKey := ""

	for {
		// Build URL with parameters
		reqURL, err := url.Parse(baseURL)
		if err != nil {
			return nil, fmt.Errorf("failed to parse URL: %w", err)
		}

		q := reqURL.Query()
		q.Add("owner", owner.Hex())
		q.Add("contractAddresses[]", contractAddress.Hex())
		q.Add("pageSize", "100")
		q.Add("withMetadata", "false")

		if pageKey != "" {
			q.Add("pageKey", pageKey)
		}

		reqURL.RawQuery = q.Encode()

		// Make HTTP request
		resp, err := http.Get(reqURL.String())
		if err != nil {
			return nil, fmt.Errorf("failed to fetch from Alchemy: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("Alchemy API error (status %d): %s", resp.StatusCode, string(body))
		}

		// Parse response
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to read response: %w", err)
		}

		var alchemyResp AlchemyNFTResponse
		if err := json.Unmarshal(body, &alchemyResp); err != nil {
			return nil, fmt.Errorf("failed to parse JSON: %w", err)
		}

		// Convert to TokenInfo and check delegation status
		for _, nft := range alchemyResp.OwnedNfts {
			tokenID := new(big.Int)
			tokenID.SetString(nft.TokenID, 0) // Auto-detect base (hex or decimal)

			// Check if token is already delegated
			var delegatedTo common.Address
			if checkDelegation != nil {
				delegatedTo, _ = checkDelegation(tokenID)
				if delegatedTo == (common.Address{}) {
					undelegatedCount++
				}
			}

			allNFTs = append(allNFTs, &TokenInfo{
				CollectionIndex: big.NewInt(0), // Will be set by caller
				CollectionAddr:  common.HexToAddress(nft.Contract.Address),
				TokenID:         tokenID,
				DelegatedTo:     delegatedTo,
			})

			// Early exit if we have enough undelegated tokens
			if maxUndelegated > 0 && undelegatedCount >= maxUndelegated {
				return allNFTs, nil
			}
		}

		// Check if there are more pages
		if alchemyResp.PageKey == "" {
			break
		}
		pageKey = alchemyResp.PageKey
	}

	return allNFTs, nil
}

// GetNFTCountFromAlchemy gets just the total count without fetching all NFTs
func GetNFTCountFromAlchemy(
	apiKey string,
	network string,
	owner common.Address,
	contractAddress common.Address,
) (int, error) {
	baseURL := fmt.Sprintf("https://%s.g.alchemy.com/nft/v3/%s/getNFTsForOwner", network, apiKey)

	reqURL, err := url.Parse(baseURL)
	if err != nil {
		return 0, fmt.Errorf("failed to parse URL: %w", err)
	}

	q := reqURL.Query()
	q.Add("owner", owner.Hex())
	q.Add("contractAddresses[]", contractAddress.Hex())
	q.Add("pageSize", "1") // Just get the first item to get totalCount
	q.Add("withMetadata", "false")
	reqURL.RawQuery = q.Encode()

	resp, err := http.Get(reqURL.String())
	if err != nil {
		return 0, fmt.Errorf("failed to fetch from Alchemy: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, fmt.Errorf("Alchemy API error (status %d): %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response: %w", err)
	}

	var alchemyResp AlchemyNFTResponse
	if err := json.Unmarshal(body, &alchemyResp); err != nil {
		return 0, fmt.Errorf("failed to parse JSON: %w", err)
	}

	return alchemyResp.TotalCount, nil
}
