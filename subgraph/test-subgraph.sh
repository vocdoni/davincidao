#!/bin/bash

# Test script for the new subgraph
SUBGRAPH_URL="https://api.studio.thegraph.com/query/1704875/davincidao-test-3/v1.0.4"

echo "🧪 Testing subgraph: davincidao-test-3"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣  Checking subgraph health..."
curl -s -X POST "$SUBGRAPH_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } deployment hasIndexingErrors } }"}' | jq .

echo ""
echo "2️⃣  Checking for accounts..."
curl -s -X POST "$SUBGRAPH_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ accounts(first: 5, orderBy: weight, orderDirection: desc) { id address weight lastUpdatedAt } }"}' | jq .

echo ""
echo "3️⃣  Checking for delegations..."
curl -s -X POST "$SUBGRAPH_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ tokenDelegations(first: 5, where: { isDelegated: true }) { id tokenId nftIndex delegate owner delegatedAt } }"}' | jq .

echo ""
echo "4️⃣  Checking global stats..."
curl -s -X POST "$SUBGRAPH_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ globalStats(id: \"global\") { totalDelegations totalAccounts totalWeight lastUpdatedAt } }"}' | jq .

echo ""
echo "✅ Test complete!"
