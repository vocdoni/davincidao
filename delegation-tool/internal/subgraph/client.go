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
	// DefaultTimeout is the default HTTP request timeout
	DefaultTimeout = 30 * time.Second

	// DefaultSubgraphURL is the default subgraph endpoint for Sepolia testnet
	// Update this with the actual deployed subgraph URL
	DefaultSubgraphURL = "https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/davincidao/v0.0.1"
)

// Client is a GraphQL client for querying the DavinciDAO subgraph
type Client struct {
	url        string
	httpClient *http.Client
}

// Account represents an account with voting weight
type Account struct {
	ID                   string   `json:"id"`
	Address              string   `json:"address"`
	Weight               string   `json:"weight"`
	LastUpdatedAt        string   `json:"lastUpdatedAt"`
	LastUpdatedBlock     string   `json:"lastUpdatedBlock"`
}

// TokenDelegation represents a delegated token
type TokenDelegation struct {
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

// CensusRoot represents a census root snapshot
type CensusRoot struct {
	ID              string `json:"id"`
	Root            string `json:"root"`
	Updater         string `json:"updater"`
	BlockNumber     string `json:"blockNumber"`
	BlockTimestamp  string `json:"blockTimestamp"`
	TransactionHash string `json:"transactionHash"`
}

// GlobalStats represents global delegation statistics
type GlobalStats struct {
	ID               string `json:"id"`
	TotalDelegations string `json:"totalDelegations"`
	TotalAccounts    string `json:"totalAccounts"`
	TotalWeight      string `json:"totalWeight"`
	LastUpdatedAt    string `json:"lastUpdatedAt"`
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

// NewClient creates a new subgraph client
func NewClient(url string) *Client {
	if url == "" {
		url = DefaultSubgraphURL
	}
	return &Client{
		url: url,
		httpClient: &http.Client{
			Timeout: DefaultTimeout,
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

// GetAccount retrieves account information
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

// GetAccounts retrieves all accounts with optional filtering
func (c *Client) GetAccounts(ctx context.Context, first int, skip int, minWeight *big.Int) ([]*Account, error) {
	query := `
		query GetAccounts($first: Int!, $skip: Int!, $minWeight: BigInt) {
			accounts(
				first: $first
				skip: $skip
				where: { weight_gte: $minWeight }
				orderBy: weight
				orderDirection: desc
			) {
				id
				address
				weight
				lastUpdatedAt
				lastUpdatedBlock
			}
		}
	`

	variables := map[string]interface{}{
		"first": first,
		"skip":  skip,
	}
	if minWeight != nil {
		variables["minWeight"] = minWeight.String()
	} else {
		variables["minWeight"] = "0"
	}

	var result struct {
		Accounts []*Account `json:"accounts"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.Accounts, nil
}

// GetTokenDelegation retrieves delegation info for a specific token
func (c *Client) GetTokenDelegation(ctx context.Context, nftIndex, tokenID *big.Int) (*TokenDelegation, error) {
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
		TokenDelegation *TokenDelegation `json:"tokenDelegation"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.TokenDelegation, nil
}

// GetAccountDelegations retrieves all tokens delegated to an account
func (c *Client) GetAccountDelegations(ctx context.Context, delegate common.Address, first int) ([]*TokenDelegation, error) {
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
		TokenDelegations []*TokenDelegation `json:"tokenDelegations"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.TokenDelegations, nil
}

// GetLatestCensusRoots retrieves the most recent census roots
func (c *Client) GetLatestCensusRoots(ctx context.Context, first int) ([]*CensusRoot, error) {
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
		CensusRoots []*CensusRoot `json:"censusRoots"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.CensusRoots, nil
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

// GetUndelegatedTokens retrieves tokens owned by an address that are not delegated
// This requires querying Alchemy/on-chain and cross-referencing with subgraph data
func (c *Client) GetDelegatedTokens(ctx context.Context, nftIndex *big.Int, first int, skip int) ([]*TokenDelegation, error) {
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
		TokenDelegations []*TokenDelegation `json:"tokenDelegations"`
	}

	if err := c.query(ctx, query, variables, &result); err != nil {
		return nil, err
	}

	return result.TokenDelegations, nil
}
