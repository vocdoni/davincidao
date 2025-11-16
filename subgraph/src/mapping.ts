import { BigInt } from "@graphprotocol/graph-ts";
import {
  Pledged,
  CensusRootUpdated,
} from "../generated/WeAreNotSpectatorsManifestoCensus/WeAreNotSpectatorsManifestoCensus";
import { Signer, CensusRoot, GlobalStats, PledgeEvent, Account, WeightChangeEvent } from "../generated/schema";

const GLOBAL_STATS_ID = "global";

/**
 * Initialize or load GlobalStats entity
 */
function loadOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load(GLOBAL_STATS_ID);
  if (stats == null) {
    stats = new GlobalStats(GLOBAL_STATS_ID);
    stats.totalPledges = BigInt.fromI32(0);
    stats.lastPledgeAt = BigInt.fromI32(0);
    stats.lastPledgeBlock = BigInt.fromI32(0);
    stats.currentRoot = BigInt.fromI32(0);
    stats.nextTreeIndex = BigInt.fromI32(0);
  }
  return stats;
}

/**
 * Handle Pledged event
 * Event: Pledged(address indexed signer, uint256 timestamp)
 */
export function handlePledged(event: Pledged): void {
  const signerAddress = event.params.signer;
  const timestamp = event.params.timestamp;
  const addressLowercase = signerAddress.toHexString().toLowerCase();

  // Load or create GlobalStats
  let stats = loadOrCreateGlobalStats();

  // Load or create Account entity
  let account = Account.load(addressLowercase);
  let previousWeight = BigInt.fromI32(0);

  if (account == null) {
    account = new Account(addressLowercase);
    account.address = signerAddress;
    account.currentWeight = BigInt.fromI32(0);
  } else {
    previousWeight = account.currentWeight;
  }

  // Create or load Signer entity
  let signer = Signer.load(addressLowercase);
  if (signer == null) {
    signer = new Signer(addressLowercase);
    signer.address = signerAddress;
    signer.pledgeTimestamp = timestamp;
    signer.pledgeBlock = event.block.number;
    signer.transactionHash = event.transaction.hash;
    signer.treeIndex = stats.nextTreeIndex;

    // Update account weight (from 0 to 1)
    const newWeight = BigInt.fromI32(1);
    account.currentWeight = newWeight;
    account.save();

    // Create WeightChangeEvent for census reconstruction
    const weightEventId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    let weightEvent = new WeightChangeEvent(weightEventId);
    weightEvent.account = addressLowercase;
    weightEvent.previousWeight = previousWeight;
    weightEvent.newWeight = newWeight;
    weightEvent.blockNumber = event.block.number;
    weightEvent.blockTimestamp = event.block.timestamp;
    weightEvent.transactionHash = event.transaction.hash;
    weightEvent.logIndex = event.logIndex;
    weightEvent.save();

    // Increment counters
    stats.totalPledges = stats.totalPledges.plus(BigInt.fromI32(1));
    stats.nextTreeIndex = stats.nextTreeIndex.plus(BigInt.fromI32(1));

    signer.save();
  }

  // Update global stats
  stats.lastPledgeAt = timestamp;
  stats.lastPledgeBlock = event.block.number;
  stats.save();

  // Create PledgeEvent entity
  const pledgeEventId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let pledgeEvent = new PledgeEvent(pledgeEventId);
  pledgeEvent.signer = addressLowercase;
  pledgeEvent.timestamp = timestamp;
  pledgeEvent.blockNumber = event.block.number;
  pledgeEvent.transactionHash = event.transaction.hash;
  pledgeEvent.logIndex = event.logIndex;
  pledgeEvent.save();
}

/**
 * Handle CensusRootUpdated event
 * Event: CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber)
 */
export function handleCensusRootUpdated(event: CensusRootUpdated): void {
  const root = event.params.newRoot;
  const blockNumber = event.params.blockNumber;

  // Load global stats to get current pledge count
  let stats = loadOrCreateGlobalStats();

  // Create CensusRoot entity
  const rootId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let censusRoot = new CensusRoot(rootId);
  censusRoot.root = root;
  censusRoot.blockNumber = blockNumber;
  censusRoot.blockTimestamp = event.block.timestamp;
  censusRoot.transactionHash = event.transaction.hash;
  censusRoot.pledgeCount = stats.totalPledges;
  censusRoot.save();

  // Update global stats
  stats.currentRoot = root;
  stats.save();
}
