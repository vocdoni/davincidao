import { Contract, BrowserProvider, JsonRpcProvider, Signer, ContractTransactionResponse } from 'ethers'

const MANIFESTO_ABI = [
  // Events
  'event Pledged(address indexed signer, uint256 timestamp)',
  'event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber)',

  // Read functions
  'function TITLE() view returns (string)',
  'function AUTHORS() view returns (string)',
  'function DATE() view returns (string)',
  'function MANIFESTO() view returns (string)',
  'function pledgeTimestamp(address) view returns (uint256)',
  'function pledgeCount() view returns (uint256)',
  'function hasPledged(address) view returns (bool)',
  'function pledgedBefore(address, uint256) view returns (bool)',
  'function getCensusRoot() view returns (uint256)',
  'function getRootBlockNumber(uint256) view returns (uint256)',
  'function computeLeaf(address) pure returns (uint256)',

  // Write functions
  'function pledge()'
]

export interface ManifestoMetadata {
  title: string
  authors: string
  date: string
  manifestoText: string
}

export interface PledgeStatus {
  hasPledged: boolean
  timestamp: number
  blockNumber?: number
}

export interface CensusInfo {
  root: string
  totalPledges: number
  blockNumber?: number
}

export class ManifestoContract {
  private contract: Contract
  private signer?: Signer

  constructor(
    provider: BrowserProvider | JsonRpcProvider,
    contractAddress: string,
    signer?: Signer
  ) {
    this.contract = new Contract(contractAddress, MANIFESTO_ABI, provider)
    this.signer = signer
  }

  /**
   * Get manifesto metadata (title, authors, date, full text)
   */
  async getMetadata(): Promise<ManifestoMetadata> {
    const [title, authors, date, manifestoText] = await Promise.all([
      this.contract.TITLE(),
      this.contract.AUTHORS(),
      this.contract.DATE(),
      this.contract.MANIFESTO()
    ])

    return {
      title,
      authors,
      date,
      manifestoText
    }
  }

  /**
   * Check if an address has pledged
   */
  async hasPledged(address: string): Promise<boolean> {
    return await this.contract.hasPledged(address)
  }

  /**
   * Get pledge status for an address
   */
  async getPledgeStatus(address: string): Promise<PledgeStatus> {
    const [hasPledged, timestamp] = await Promise.all([
      this.contract.hasPledged(address),
      this.contract.pledgeTimestamp(address)
    ])

    return {
      hasPledged,
      timestamp: Number(timestamp)
    }
  }

  /**
   * Get total number of pledges
   */
  async getTotalPledges(): Promise<number> {
    const count = await this.contract.pledgeCount()
    return Number(count)
  }

  /**
   * Get current census root and related info
   */
  async getCensusInfo(): Promise<CensusInfo> {
    const [root, totalPledges] = await Promise.all([
      this.contract.getCensusRoot(),
      this.contract.pledgeCount()
    ])

    const rootString = root.toString()
    const blockNumber = await this.contract.getRootBlockNumber(root)

    return {
      root: rootString,
      totalPledges: Number(totalPledges),
      blockNumber: Number(blockNumber) || undefined
    }
  }

  /**
   * Pledge to the manifesto
   * Requires a signer to be connected
   */
  async pledge(): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer available. Please connect your wallet.')
    }

    const contractWithSigner = this.contract.connect(this.signer)
    // Cast to any to avoid TypeScript errors with dynamic contract methods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = await (contractWithSigner as any).pledge() as ContractTransactionResponse

    console.log('Pledge transaction submitted:', tx.hash)

    // Wait for confirmation
    const receipt = await tx.wait()
    console.log('Pledge transaction confirmed:', receipt?.hash || tx.hash)

    return tx.hash
  }

  /**
   * Check if an address pledged before a specific timestamp
   */
  async pledgedBefore(address: string, timestamp: number): Promise<boolean> {
    return await this.contract.pledgedBefore(address, timestamp)
  }

  /**
   * Compute leaf value for an address (for proof generation)
   */
  async computeLeaf(address: string): Promise<string> {
    const leaf = await this.contract.computeLeaf(address)
    return leaf.toString()
  }

  /**
   * Validate a census root
   */
  async validateRoot(root: string): Promise<number> {
    const blockNumber = await this.contract.getRootBlockNumber(root)
    return Number(blockNumber)
  }
}
