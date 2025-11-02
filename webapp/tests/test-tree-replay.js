// Test script to replay the exact tree operations
import { LeanIMT } from '@zk-kit/lean-imt'
import { poseidon2 } from 'poseidon-lite'

const tree = new LeanIMT((a, b) => poseidon2([a, b]))

const events = [
  { addr: '0xdeb8699659be5d41a0e57e179d6cb42e00b9200c', prevW: 0, newW: 4, block: 37599888 },
  { addr: '0xdeb8699659be5d41a0e57e179d6cb42e00b9200c', prevW: 4, newW: 3, block: 37620968 },
  { addr: '0xf3b06b503652a5e075d423f97056dfde0c4b066f', prevW: 0, newW: 1, block: 37623588 },
  { addr: '0xf3b06b503652a5e075d423f97056dfde0c4b066f', prevW: 1, newW: 2, block: 37624793 },
  { addr: '0xf3b06b503652a5e075d423f97056dfde0c4b066f', prevW: 2, newW: 1, block: 37625505 },
  { addr: '0xf3b06b503652a5e075d423f97056dfde0c4b066f', prevW: 1, newW: 0, block: 37625576 },
  { addr: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', prevW: 0, newW: 1, block: 37625760 },
  { addr: '0xf3b06b503652a5e075d423f97056dfde0c4b066f', prevW: 0, newW: 1, block: 37626234 },
  { addr: '0xb1f05b11ba3d892edd00f2e7689779e2b8841827', prevW: 0, newW: 1, block: 37661267 },
]

console.log('Replaying events...\n')

for (const event of events) {
  const addr = BigInt(event.addr)
  const oldLeaf = (addr << 88n) | BigInt(event.prevW)
  const newLeaf = (addr << 88n) | BigInt(event.newW)

  if (event.prevW === 0 && event.newW > 0) {
    console.log(`Block ${event.block}: INSERT ${event.addr.slice(0, 10)} weight=${event.newW}`)
    tree.insert(newLeaf)
    console.log(`  Tree size: ${tree.size}, root: 0x${tree.root.toString(16).slice(0, 16)}...`)
  } else if (event.newW === 0 && event.prevW > 0) {
    console.log(`Block ${event.block}: REMOVE ${event.addr.slice(0, 10)} weight ${event.prevW}->0`)
    const idx = tree.indexOf(oldLeaf)
    console.log(`  Found at index: ${idx}`)
    if (idx !== -1) {
      tree.update(idx, 0n)
      console.log(`  Tree size after removal: ${tree.size}, root: 0x${tree.root.toString(16).slice(0, 16)}...`)
    }
  } else if (event.prevW > 0 && event.newW > 0) {
    console.log(`Block ${event.block}: UPDATE ${event.addr.slice(0, 10)} weight ${event.prevW}->${event.newW}`)
    const idx = tree.indexOf(oldLeaf)
    console.log(`  Found at index: ${idx}`)
    if (idx !== -1) {
      tree.update(idx, newLeaf)
      console.log(`  Tree size: ${tree.size}, root: 0x${tree.root.toString(16).slice(0, 16)}...`)
    }
  }
}

console.log('\n=== FINAL STATE ===')
console.log(`Tree size: ${tree.size}`)
console.log(`Root: 0x${tree.root.toString(16)}`)
console.log('\nCurrent leaves in tree:')

// Get all leaves by checking indexOf for known accounts
const accounts = [
  { addr: '0xdeb8699659be5d41a0e57e179d6cb42e00b9200c', weight: 3 },
  { addr: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', weight: 1 },
  { addr: '0xf3b06b503652a5e075d423f97056dfde0c4b066f', weight: 1 },
  { addr: '0xb1f05b11ba3d892edd00f2e7689779e2b8841827', weight: 1 },
]

for (const acc of accounts) {
  const leaf = (BigInt(acc.addr) << 88n) | BigInt(acc.weight)
  const idx = tree.indexOf(leaf)
  console.log(`  [${idx}] addr=${acc.addr}, weight=${acc.weight}`)
}
