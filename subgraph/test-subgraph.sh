#!/bin/bash

# Test script for the Self Manifesto subgraph
SUBGRAPH_URL="https://api.studio.thegraph.com/query/1704875/self-manifesto/v0.0.2"

echo "🧪 Testing subgraph: self-manifesto (v0.0.2)"
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
  -d '{"query": "{ accounts(first: 5, orderBy: currentWeight, orderDirection: desc) { id address currentWeight } }"}' | jq .

echo ""
echo "3️⃣  Checking for recent weight change events..."
curl -s -X POST "$SUBGRAPH_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ weightChangeEvents(first: 5, orderBy: blockNumber, orderDirection: desc) { id blockNumber previousWeight newWeight account { id } } }"}' | jq .

echo ""
echo "4️⃣  Checking global stats..."
curl -s -X POST "$SUBGRAPH_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ globalStats(id: \"global\") { totalPledges lastPledgeAt currentRoot nextTreeIndex } }"}' | jq .

echo ""
echo "✅ Test complete!"
