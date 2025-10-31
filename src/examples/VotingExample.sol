// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICensusValidator} from "../ICensusValidator.sol";

/// @title VotingExample
/// @notice Example contract demonstrating ICensusValidator interface usage
/// @dev This is a reference implementation showing how external contracts can
///      integrate with the DavinciDAO census contract for on-chain validation
contract VotingExample {
    ICensusValidator public immutable census;

    struct Proposal {
        uint256 censusRoot;       // Snapshot of voting power at creation
        uint256 createdAtBlock;   // Block when proposal was created
        uint256 endBlock;         // Block when voting ends
        bool executed;            // Whether proposal has been executed
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    uint256 public constant VOTING_PERIOD = 50400; // ~7 days at 12s blocks
    uint256 public constant MAX_ROOT_AGE = 50; // Maximum blocks old census can be

    event ProposalCreated(uint256 indexed proposalId, uint256 censusRoot);
    event VoteCast(uint256 indexed proposalId, address indexed voter);
    event ProposalExecuted(uint256 indexed proposalId);

    error InvalidCensusRoot();
    error CensusRootTooOld();
    error ProposalNotFound();
    error VotingEnded();

    constructor(address _censusContract) {
        census = ICensusValidator(_censusContract);
    }

    /// @notice Create a new proposal with a validated census root
    /// @param censusRoot The census Merkle root to use for this proposal
    /// @return proposalId The ID of the created proposal
    function createProposal(uint256 censusRoot) external returns (uint256 proposalId) {
        // Validate that the census root exists and is recent
        uint256 rootBlock = census.getRootBlockNumber(censusRoot);

        if (rootBlock == 0) {
            revert InvalidCensusRoot();
        }

        if (block.number - rootBlock > MAX_ROOT_AGE) {
            revert CensusRootTooOld();
        }

        proposalId = proposalCount++;

        proposals[proposalId] = Proposal({
            censusRoot: censusRoot,
            createdAtBlock: block.number,
            endBlock: block.number + VOTING_PERIOD,
            executed: false
        });

        emit ProposalCreated(proposalId, censusRoot);
    }

    /// @notice Cast a vote on a proposal (simplified example)
    /// @dev In a real implementation, you would verify Merkle proofs here
    /// @param proposalId The proposal to vote on
    function vote(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.createdAtBlock == 0) {
            revert ProposalNotFound();
        }

        if (block.number > proposal.endBlock) {
            revert VotingEnded();
        }

        // In a real implementation, verify voter's weight using Merkle proof
        // against proposal.censusRoot

        emit VoteCast(proposalId, msg.sender);
    }

    /// @notice Execute a proposal after voting ends
    /// @param proposalId The proposal to execute
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.createdAtBlock == 0) {
            revert ProposalNotFound();
        }

        require(block.number > proposal.endBlock, "Voting not ended");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;

        // Execute proposal logic here

        emit ProposalExecuted(proposalId);
    }

    /// @notice Get the current census root for creating new proposals
    /// @dev Helper function to get the latest root from the census contract
    /// @return root The current census root
    /// @return rootBlock The block when this root was set
    function getCurrentCensusRoot() external view returns (uint256 root, uint256 rootBlock) {
        // This would typically be exposed by the census contract
        // For this example, we just demonstrate the interface usage

        // In practice, you'd call census.getCensusRoot() which is not part of
        // the ICensusValidator interface but is available on DavinciDao

        // Then validate it:
        // rootBlock = census.getRootBlockNumber(root);

        return (0, 0); // Placeholder
    }
}
