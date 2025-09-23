import { LeanIMT } from "@zk-kit/lean-imt";
import { poseidon2 } from "poseidon-lite";
import fs from "fs";
import path from "path";

// Hash function used by the Solidity implementation
const hash = (a, b) => poseidon2([a, b]);

// Helper function to pack (address || weight) like the Solidity contract
function packLeaf(address, weight) {
    // Convert address to BigInt (remove 0x prefix and parse as hex)
    const addressBigInt = BigInt(address);
    // Shift address left by 88 bits and OR with weight
    return (addressBigInt << 88n) | BigInt(weight);
}

// Helper function to generate test scenarios
function generateTestScenarios() {
    const scenarios = [];
    
    // Test addresses
    const alice = "0x0000000000000000000000000000000000000001";
    const bob = "0x0000000000000000000000000000000000000002";
    const charlie = "0x0000000000000000000000000000000000000003";
    const dave = "0x0000000000000000000000000000000000000004";

    // Scenario 1: Basic insertion and weight updates
    console.log("Generating Scenario 1: Basic operations...");
    const scenario1 = generateBasicOperationsScenario(alice, bob, charlie);
    scenarios.push(scenario1);

    // Scenario 2: Complex delegation updates
    console.log("Generating Scenario 2: Complex delegation updates...");
    const scenario2 = generateDelegationUpdateScenario(alice, bob, charlie, dave);
    scenarios.push(scenario2);

    // Scenario 3: Removal and reinsertion
    console.log("Generating Scenario 3: Removal and reinsertion...");
    const scenario3 = generateRemovalScenario(alice, bob, charlie);
    scenarios.push(scenario3);

    return scenarios;
}

function generateBasicOperationsScenario(alice, bob, charlie) {
    const tree = new LeanIMT(hash);
    const steps = [];

    // Step 1: Insert Bob with weight 1 (first insertion)
    const bobLeaf1 = packLeaf(bob, 1);
    tree.insert(bobLeaf1);
    
    steps.push({
        operation: "insert",
        account: bob,
        oldWeight: 0,
        newWeight: 1,
        leaf: bobLeaf1.toString(),
        proof: [], // No proof needed for first insertion
        expectedIndex: 0,
        treeRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "First insertion - Bob gets weight 1"
    });

    // Step 2: Insert Charlie with weight 1
    const charlieLeaf1 = packLeaf(charlie, 1);
    tree.insert(charlieLeaf1);
    
    steps.push({
        operation: "insert",
        account: charlie,
        oldWeight: 0,
        newWeight: 1,
        leaf: charlieLeaf1.toString(),
        proof: [], // No proof needed for first insertion
        expectedIndex: 1,
        treeRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "Second insertion - Charlie gets weight 1"
    });

    // Step 3: Update Bob's weight from 1 to 2 (weight update)
    const bobIndex = tree.indexOf(bobLeaf1);
    const bobProof = tree.generateProof(bobIndex);
    const bobLeaf2 = packLeaf(bob, 2);
    
    tree.update(bobIndex, bobLeaf2);
    
    steps.push({
        operation: "update",
        account: bob,
        oldWeight: 1,
        newWeight: 2,
        oldLeaf: bobLeaf1.toString(),
        newLeaf: bobLeaf2.toString(),
        proof: bobProof.siblings.map(s => s.toString()),
        expectedIndex: 0, // Same index
        treeRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "Weight update - Bob's weight increases to 2"
    });

    return {
        name: "BasicOperations",
        description: "Basic insertion and weight update operations",
        steps: steps
    };
}

function generateDelegationUpdateScenario(alice, bob, charlie, dave) {
    const tree = new LeanIMT(hash);
    const steps = [];

    // Step 1: Insert Bob with weight 2
    const bobLeaf1 = packLeaf(bob, 2);
    tree.insert(bobLeaf1);
    
    steps.push({
        operation: "insert",
        account: bob,
        oldWeight: 0,
        newWeight: 2,
        leaf: bobLeaf1.toString(),
        proof: [],
        expectedIndex: 0,
        treeRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "Bob gets 2 delegated tokens"
    });

    // Step 2: Insert Charlie with weight 1
    const charlieLeaf1 = packLeaf(charlie, 1);
    tree.insert(charlieLeaf1);
    
    steps.push({
        operation: "insert",
        account: charlie,
        oldWeight: 0,
        newWeight: 1,
        leaf: charlieLeaf1.toString(),
        proof: [],
        expectedIndex: 1,
        treeRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "Charlie gets 1 delegated token"
    });

    // Step 3: Move 1 token from Bob to Charlie (Bob: 2->1, Charlie: 1->2)
    const bobIndex = tree.indexOf(bobLeaf1);
    const charlieIndex = tree.indexOf(charlieLeaf1);
    
    const bobProof = tree.generateProof(bobIndex);
    const charlieProof = tree.generateProof(charlieIndex);
    
    const bobLeaf2 = packLeaf(bob, 1);
    const charlieLeaf2 = packLeaf(charlie, 2);
    
    // Update Bob first (decrease)
    tree.update(bobIndex, bobLeaf2);
    const intermediateRoot = tree.root.toString();
    
    // Then update Charlie (increase) - need new proof after Bob's update
    const charlieNewIndex = tree.indexOf(charlieLeaf1);
    const charlieNewProof = tree.generateProof(charlieNewIndex);
    tree.update(charlieNewIndex, charlieLeaf2);
    
    steps.push({
        operation: "delegation_update",
        fromAccount: bob,
        toAccount: charlie,
        fromOldWeight: 2,
        fromNewWeight: 1,
        toOldWeight: 1,
        toNewWeight: 2,
        fromOldLeaf: bobLeaf1.toString(),
        fromNewLeaf: bobLeaf2.toString(),
        toOldLeaf: charlieLeaf1.toString(),
        toNewLeaf: charlieLeaf2.toString(),
        fromProof: bobProof.siblings.map(s => s.toString()),
        toProof: charlieNewProof.siblings.map(s => s.toString()),
        intermediateRoot: intermediateRoot,
        finalRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "Move 1 token delegation from Bob to Charlie"
    });

    return {
        name: "DelegationUpdate",
        description: "Complex delegation update between accounts",
        steps: steps
    };
}

function generateRemovalScenario(alice, bob, charlie) {
    const tree = new LeanIMT(hash);
    const steps = [];

    // Step 1: Insert Bob with weight 1
    const bobLeaf = packLeaf(bob, 1);
    tree.insert(bobLeaf);
    
    steps.push({
        operation: "insert",
        account: bob,
        oldWeight: 0,
        newWeight: 1,
        leaf: bobLeaf.toString(),
        proof: [],
        expectedIndex: 0,
        treeRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "Bob gets weight 1"
    });

    // Step 2: Insert Charlie with weight 1
    const charlieLeaf = packLeaf(charlie, 1);
    tree.insert(charlieLeaf);
    
    steps.push({
        operation: "insert",
        account: charlie,
        oldWeight: 0,
        newWeight: 1,
        leaf: charlieLeaf.toString(),
        proof: [],
        expectedIndex: 1,
        treeRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "Charlie gets weight 1"
    });

    // Step 3: Remove Bob (weight 1 -> 0)
    const bobIndex = tree.indexOf(bobLeaf);
    const bobProof = tree.generateProof(bobIndex);
    
    // In LeanIMT, we simulate removal by updating to 0
    tree.update(bobIndex, 0n);
    
    steps.push({
        operation: "remove",
        account: bob,
        oldWeight: 1,
        newWeight: 0,
        oldLeaf: bobLeaf.toString(),
        newLeaf: "0",
        proof: bobProof.siblings.map(s => s.toString()),
        expectedIndex: 0, // Index should be cleared
        treeRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "Remove Bob (weight becomes 0)"
    });

    // Step 4: Insert Alice with weight 1 (should reuse index 0)
    const aliceLeaf = packLeaf(alice, 1);
    tree.insert(aliceLeaf);
    
    steps.push({
        operation: "insert",
        account: alice,
        oldWeight: 0,
        newWeight: 1,
        leaf: aliceLeaf.toString(),
        proof: [],
        expectedIndex: 2, // New insertion gets next index
        treeRoot: tree.root.toString(),
        treeSize: tree.size,
        description: "Alice gets weight 1 after Bob's removal"
    });

    return {
        name: "RemovalAndReinsertion",
        description: "Remove an account and insert a new one",
        steps: steps
    };
}

// Generate all test scenarios
console.log("Starting test data generation...");
const testData = {
    version: "1.0.0",
    description: "Test data for DavinciDAO with valid Merkle proofs",
    generatedAt: new Date().toISOString(),
    scenarios: generateTestScenarios()
};

// Write to output file
const outputPath = path.join(process.cwd(), "output", "testData.json");
fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

console.log(`Test data generated successfully!`);
console.log(`Output file: ${outputPath}`);
console.log(`Generated ${testData.scenarios.length} scenarios with ${testData.scenarios.reduce((total, s) => total + s.steps.length, 0)} total steps`);
