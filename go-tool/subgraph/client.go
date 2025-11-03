package subgraph

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

const (
	defaultTimeout = 30 * time.Second
)

// Client is a GraphQL client for querying the DavinciDAO subgraph
type Client struct {
	url        string
	httpClient *http.Client
}


// tokenDelegation represents a delegated token
type tokenDelegation struct {
	ID               string   `json:"id"`
	NftIndex         string   `json:"nftIndex"`
	TokenID          string   `json:"tokenId"`
	Delegate         string   `json:"delegate"`
	Owner            string   `json:"owner"`
	IsDelegated      bool     `json:"isDelegated"`
	DelegatedAt      string   `json:"delegatedAt"`
	DelegatedBlock   string   `json:"delegatedBlock"`
	TransactionHash  string   `json:"transactionHash"`
}

// censusRoot represents a census root snapshot
type censusRoot struct {
	ID              string `json:"id"`
	Root            string `json:"root"`
	Updater         string `json:"updater"`
	BlockNumber     string `json:"blockNumber"`
	BlockTimestamp  string `json:"blockTimestamp"`
	TransactionHash string `json:"transactionHash"`
}


// WeightChangeEvent represents a weight change event for tree reconstruction (exported for census package)
type WeightChangeEvent struct {
	ID              string `json:"id"`
	Account         struct {
		ID      string `json:"id"`
		Address string `json:"address"`
	} `json:"account"`
	PreviousWeight  string `json:"previousWeight"`
	NewWeight       string `json:"newWeight"`
	BlockNumber     string `json:"blockNumber"`
	BlockTimestamp  string `json:"blockTimestamp"`
	TransactionHash string `json:"transactionHash"`
	LogIndex        string `json:"logIndex"`
}

type graphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

type graphQLResponse struct {
	Data   json.RawMessage `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors,omitempty"`
}

// NewClient creates a new subgraph client for the given URL
func NewClient(url string) *Client {
	return &Client{
		url: url,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
	}
}

// query executes a GraphQL query
func (c *Client) query(ctx context.Context, query string, variables map[string]interface{}, result interface{}) error {
	reqBody := graphQLRequest{
		Query:     query,
		Variables: variables,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(body))
	}

	var gqlResp graphQLResponse
	if err := json.Unmarshal(body, &gqlResp); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if len(gqlResp.Errors) > 0 {
		return fmt.Errorf("graphql error: %s", gqlResp.Errors[0].Message)
	}

	if err := json.Unmarshal(gqlResp.Data, result); err != nil {
		return fmt.Errorf("failed to unmarshal data: %w", err)
	}

	return nil
}

// Account represents an account with voting weight (exported for queries)
type Account struct {
	ID                   string   `json:"id"`
	Address              string   `json:"address"`
	Weight               string   `json:"weight"`
	LastUpdatedAt        string   `json:"lastUpdatedAt"`
	LastUpdatedBlock     string   `json:"lastUpdatedBlock"`
}

// GetAccount retrieves account information by address
func (c *Client) GetAccount(ctx context.Context, address common.Address) (*Account, error) {
	query := `
		query GetAccount($id: ID!) {
			account(id: $id) {
				id
				address
				weight
				lastUpdatedAt
				lastUpdatedBlock
			}
		}
	`

	variables := map[string]interface{}{
		"id": address.Hex(),
	}

	var result struct {
		Account *Account `json:"account"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.Account, nil
}


// getTokenDelegation retrieves delegation info for a specific token (internal use only)
func (c *Client) getTokenDelegation(ctx context.Context, nftIndex, tokenID *big.Int) (*tokenDelegation, error) {
	query := `
		query GetTokenDelegation($id: ID!) {
			tokenDelegation(id: $id) {
				id
				nftIndex
				tokenId
				delegate
				owner
				isDelegated
				delegatedAt
				delegatedBlock
				transactionHash
			}
		}
	`

	// ID format: ${nftIndex}-${tokenId}
	id := fmt.Sprintf("%s-%s", nftIndex.String(), tokenID.String())
	variables := map[string]interface{}{
		"id": id,
	}

	var result struct {
		TokenDelegation *tokenDelegation `json:"tokenDelegation"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.TokenDelegation, nil
}

// getAccountDelegations retrieves all tokens delegated to an account (internal use only)
func (c *Client) getAccountDelegations(ctx context.Context, delegate common.Address, first int) ([]*tokenDelegation, error) {
	query := `
		query GetAccountDelegations($delegate: Bytes!, $first: Int!) {
			tokenDelegations(
				first: $first
				where: { delegate: $delegate, isDelegated: true }
				orderBy: delegatedAt
				orderDirection: desc
			) {
				id
				nftIndex
				tokenId
				delegate
				owner
				isDelegated
				delegatedAt
				delegatedBlock
				transactionHash
			}
		}
	`

	variables := map[string]interface{}{
		"delegate": delegate.Hex(),
		"first":    first,
	}

	var result struct {
		TokenDelegations []*tokenDelegation `json:"tokenDelegations"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.TokenDelegations, nil
}

// getLatestCensusRoots retrieves the most recent census roots (internal use only)
func (c *Client) getLatestCensusRoots(ctx context.Context, first int) ([]*censusRoot, error) {
	query := `
		query GetLatestCensusRoots($first: Int!) {
			censusRoots(
				first: $first
				orderBy: blockNumber
				orderDirection: desc
			) {
				id
				root
				updater
				blockNumber
				blockTimestamp
				transactionHash
			}
		}
	`

	variables := map[string]interface{}{
		"first": first,
	}

	var result struct {
		CensusRoots []*censusRoot `json:"censusRoots"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.CensusRoots, nil
}

// GlobalStats represents global delegation statistics (exported for queries)
type GlobalStats struct {
	ID               string `json:"id"`
	TotalDelegations string `json:"totalDelegations"`
	TotalAccounts    string `json:"totalAccounts"`
	TotalWeight      string `json:"totalWeight"`
	LastUpdatedAt    string `json:"lastUpdatedAt"`
}

// GetGlobalStats retrieves global delegation statistics
func (c *Client) GetGlobalStats(ctx context.Context) (*GlobalStats, error) {
	query := `
		query GetGlobalStats {
			globalStats(id: "global") {
				id
				totalDelegations
				totalAccounts
				totalWeight
				lastUpdatedAt
			}
		}
	`

	var result struct {
		GlobalStats *GlobalStats `json:"globalStats"`
	}

	if err := c.query(ctx, query, nil, &result); err != nil {
		return nil, err
	}

	return result.GlobalStats, nil
}

// getDelegatedTokens retrieves delegated tokens for an NFT collection (internal use only)
func (c *Client) getDelegatedTokens(ctx context.Context, nftIndex *big.Int, first int, skip int) ([]*tokenDelegation, error) {
	query := `
		query GetDelegatedTokens($nftIndex: BigInt!, $first: Int!, $skip: Int!) {
			tokenDelegations(
				first: $first
				skip: $skip
				where: { nftIndex: $nftIndex, isDelegated: true }
				orderBy: tokenId
				orderDirection: asc
			) {
				id
				nftIndex
				tokenId
				delegate
				owner
				isDelegated
				delegatedAt
				delegatedBlock
				transactionHash
			}
		}
	`

	variables := map[string]interface{}{
		"nftIndex": nftIndex.String(),
		"first":    first,
		"skip":     skip,
	}

	var result struct {
		TokenDelegations []*tokenDelegation `json:"tokenDelegations"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.TokenDelegations, nil
}

// GetWeightChangeEvents retrieves weight change events for tree reconstruction
// Events are returned in chronological order (blockNumber ASC, logIndex ASC)
func (c *Client) GetWeightChangeEvents(ctx context.Context, first int, skip int) ([]*WeightChangeEvent, error) {
	query := `
		query GetWeightChangeEvents($first: Int!, $skip: Int!) {
			weightChangeEvents(
				first: $first
				skip: $skip
				orderBy: blockNumber
				orderDirection: asc
			) {
				id
				account {
					id
					address
				}
				previousWeight
				newWeight
				blockNumber
				blockTimestamp
				transactionHash
				logIndex
			}
		}
	`

	variables := map[string]interface{}{
		"first": first,
		"skip":  skip,
	}

	var result struct {
		WeightChangeEvents []*WeightChangeEvent `json:"weightChangeEvents"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.WeightChangeEvents, nil
}
