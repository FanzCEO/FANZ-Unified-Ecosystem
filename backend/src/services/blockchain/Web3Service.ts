import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import axios from 'axios';

// Contract ABI interfaces - Use type alias instead of interface extension
type NFTMarketplaceContract = ethers.Contract & {
  createAndListNFT(
    tokenURI: string,
    price: ethers.BigNumberish,
    category: string,
    isAdultContent: boolean,
    royaltyFeeNumerator: number,
    platform: string
  ): Promise<ethers.ContractTransactionResponse>;
  
  purchaseNFT(
    tokenId: number,
    options: { value: ethers.BigNumberish }
  ): Promise<ethers.ContractTransactionResponse>;
  
  listNFT(
    tokenId: number,
    price: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;
  
  delistNFT(tokenId: number): Promise<ethers.ContractTransactionResponse>;
  
  getActiveMarketItems(): Promise<MarketItem[]>;
  getUserNFTs(userAddress: string): Promise<MarketItem[]>;
  
  verifyCreator(
    creator: string,
    platform: string
  ): Promise<ethers.ContractTransactionResponse>;
  
  verifyAge(user: string): Promise<ethers.ContractTransactionResponse>;
};

interface MarketItem {
  tokenId: bigint;
  seller: string;
  owner: string;
  creator: string;
  price: bigint;
  sold: boolean;
  active: boolean;
  listingTime: bigint;
  category: string;
  isAdultContent: boolean;
  requiresAgeVerification: boolean;
}

interface Web3Config {
  rpcUrl: string;
  chainId: number;
  contractAddress: string;
  privateKey?: string;
  infuraProjectId?: string;
  alchemyApiKey?: string;
}

interface IPFSConfig {
  gateway: string;
  apiKey?: string;
  secretKey?: string;
}

interface TransactionResult {
  hash: string;
  tokenId?: number;
  success: boolean;
  error?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  creator: string;
  platform: string;
  category: string;
  isAdultContent: boolean;
  createdAt: string;
}

/**
 * Web3Service - Handles all blockchain interactions for FANZ ecosystem
 * Supports NFT marketplace, wallet connections, and creator verification
 */
export class Web3Service extends EventEmitter {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private contract: NFTMarketplaceContract | null = null;
  private config: Web3Config;
  private ipfsConfig: IPFSConfig;
  
  // Contract ABI - Replace with actual ABI after compilation
  private contractABI = [
    // Add your contract ABI here after compilation
    "function createAndListNFT(string memory tokenURI, uint256 price, string memory category, bool isAdultContent, uint96 royaltyFeeNumerator, string memory platform) public returns (uint256)",
    "function purchaseNFT(uint256 tokenId) public payable",
    "function listNFT(uint256 tokenId, uint256 price) public",
    "function delistNFT(uint256 tokenId) public",
    "function getActiveMarketItems() public view returns (tuple(uint256,address,address,address,uint256,bool,bool,uint256,string,bool,bool)[] memory)",
    "function getUserNFTs(address user) public view returns (tuple(uint256,address,address,address,uint256,bool,bool,uint256,string,bool,bool)[] memory)",
    "function verifyCreator(address creator, string memory platform) public",
    "function verifyAge(address user) public",
    "event MarketItemCreated(uint256 indexed tokenId, address seller, address owner, uint256 price, string category, bool isAdultContent)",
    "event MarketItemSold(uint256 indexed tokenId, address seller, address buyer, uint256 price, uint256 platformFee, uint256 royaltyFee)",
    "event CreatorVerified(address indexed creator, string platform)"
  ];

  constructor(config: Web3Config, ipfsConfig: IPFSConfig) {
    super();
    this.config = config;
    this.ipfsConfig = ipfsConfig;
    this.initialize();
  }

  /**
   * Initialize Web3 connection
   */
  private async initialize(): Promise<void> {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      
      // Initialize signer if private key provided
      if (this.config.privateKey) {
        this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
      }
      
      // Initialize contract
      if (this.signer) {
        this.contract = new ethers.Contract(
          this.config.contractAddress,
          this.contractABI,
          this.signer
        ) as NFTMarketplaceContract;
      } else {
        this.contract = new ethers.Contract(
          this.config.contractAddress,
          this.contractABI,
          this.provider
        ) as NFTMarketplaceContract;
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.emit('initialized');
      console.log('Web3Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Web3Service:', error);
      this.emit('error', error);
    }
  }

  /**
   * Set up blockchain event listeners
   */
  private setupEventListeners(): void {
    if (!this.contract) return;

    // Listen for NFT creation events
    this.contract.on('MarketItemCreated', (tokenId, seller, owner, price, category, isAdultContent) => {
      this.emit('nftCreated', {
        tokenId: tokenId.toString(),
        seller,
        owner,
        price: ethers.formatEther(price),
        category,
        isAdultContent
      });
    });

    // Listen for NFT sales
    this.contract.on('MarketItemSold', (tokenId, seller, buyer, price, platformFee, royaltyFee) => {
      this.emit('nftSold', {
        tokenId: tokenId.toString(),
        seller,
        buyer,
        price: ethers.formatEther(price),
        platformFee: ethers.formatEther(platformFee),
        royaltyFee: ethers.formatEther(royaltyFee)
      });
    });

    // Listen for creator verification
    this.contract.on('CreatorVerified', (creator, platform) => {
      this.emit('creatorVerified', { creator, platform });
    });
  }

  /**
   * Upload metadata to IPFS
   */
  async uploadToIPFS(metadata: NFTMetadata): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.ipfsConfig.apiKey,
            'pinata_secret_api_key': this.ipfsConfig.secretKey
          }
        }
      );

      const ipfsHash = response.data.IpfsHash;
      return `${this.ipfsConfig.gateway}/${ipfsHash}`;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  }

  /**
   * Create and list NFT on marketplace
   */
  async createAndListNFT(
    metadata: NFTMetadata,
    priceInEth: string,
    royaltyPercentage: number = 5
  ): Promise<TransactionResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      // Upload metadata to IPFS
      const tokenURI = await this.uploadToIPFS(metadata);
      
      // Convert price to Wei
      const priceWei = ethers.parseEther(priceInEth);
      
      // Convert royalty percentage to basis points (5% = 500)
      const royaltyBasisPoints = royaltyPercentage * 100;

      // Execute transaction
      const tx = await this.contract.createAndListNFT(
        tokenURI,
        priceWei,
        metadata.category,
        metadata.isAdultContent,
        royaltyBasisPoints,
        metadata.platform
      );

      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Extract token ID from events
      const event = receipt?.logs?.find(log => {
        try {
          const parsed = this.contract?.interface.parseLog({ topics: log.topics as string[], data: log.data });
          return parsed?.name === 'MarketItemCreated';
        } catch {
          return false;
        }
      });
      const tokenId = event ? this.contract?.interface.parseLog({ topics: event.topics as string[], data: event.data })?.args?.tokenId?.toString() : undefined;

      return {
        hash: tx.hash,
        tokenId: tokenId ? parseInt(tokenId) : undefined,
        success: true,
        gasUsed: receipt?.gasUsed?.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString()
      };
    } catch (error) {
      console.error('Failed to create NFT:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Purchase NFT from marketplace
   */
  async purchaseNFT(tokenId: number, priceInEth: string): Promise<TransactionResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      const priceWei = ethers.parseEther(priceInEth);
      
      const tx = await this.contract.purchaseNFT(tokenId, {
        value: priceWei
      });

      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        tokenId,
        success: true,
        gasUsed: receipt?.gasUsed?.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString()
      };
    } catch (error) {
      console.error('Failed to purchase NFT:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List existing NFT on marketplace
   */
  async listNFT(tokenId: number, priceInEth: string): Promise<TransactionResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      const priceWei = ethers.parseEther(priceInEth);
      const tx = await this.contract.listNFT(tokenId, priceWei);
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        tokenId,
        success: true,
        gasUsed: receipt?.gasUsed?.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString()
      };
    } catch (error) {
      console.error('Failed to list NFT:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delist NFT from marketplace
   */
  async delistNFT(tokenId: number): Promise<TransactionResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      const tx = await this.contract.delistNFT(tokenId);
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        tokenId,
        success: true,
        gasUsed: receipt?.gasUsed?.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString()
      };
    } catch (error) {
      console.error('Failed to delist NFT:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get active marketplace items
   */
  async getActiveMarketItems(): Promise<MarketItem[]> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const items = await this.contract.getActiveMarketItems();
      return items;
    } catch (error) {
      console.error('Failed to get market items:', error);
      return [];
    }
  }

  /**
   * Get user's NFTs
   */
  async getUserNFTs(userAddress: string): Promise<MarketItem[]> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const items = await this.contract.getUserNFTs(userAddress);
      return items;
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      return [];
    }
  }

  /**
   * Verify creator (admin function)
   */
  async verifyCreator(creatorAddress: string, platform: string): Promise<TransactionResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      const tx = await this.contract.verifyCreator(creatorAddress, platform);
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        success: true,
        gasUsed: receipt?.gasUsed?.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString()
      };
    } catch (error) {
      console.error('Failed to verify creator:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify user age (admin function)
   */
  async verifyAge(userAddress: string): Promise<TransactionResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      const tx = await this.contract.verifyAge(userAddress);
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        success: true,
        gasUsed: receipt?.gasUsed?.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString()
      };
    } catch (error) {
      console.error('Failed to verify age:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const gasPrice = await this.provider.getFeeData();
      return ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei');
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return '0';
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  /**
   * Estimate transaction gas
   */
  async estimateGas(
    method: string,
    params: any[]
  ): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const gasEstimate = await this.contract.estimateGas[method](...params);
      return gasEstimate.toString();
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return '0';
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<ethers.TransactionReceipt | null> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      return await this.provider.getTransactionReceipt(hash);
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      return null;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    hash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      return await this.provider.waitForTransaction(hash, confirmations);
    } catch (error) {
      console.error('Failed to wait for transaction:', error);
      return null;
    }
  }

  /**
   * Connect external wallet (for frontend)
   */
  async connectWallet(address: string): Promise<boolean> {
    try {
      // This would typically be handled on the frontend
      // Here we just validate the address format
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid wallet address');
      }

      this.emit('walletConnected', { address });
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    this.emit('walletDisconnected');
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ healthy: boolean; blockNumber?: number; error?: string }> {
    try {
      if (!this.provider) {
        return { healthy: false, error: 'Provider not initialized' };
      }

      const blockNumber = await this.provider.getBlockNumber();
      return { healthy: true, blockNumber };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export default Web3Service;