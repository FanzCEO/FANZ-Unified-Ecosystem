import { ethers } from 'ethers';
import { db } from '../../db';
import { blockchainWallets, blockchainEvents } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
export class Web3Service {
    constructor(blockchain = 'ethereum', privateKey) {
        this.signer = null;
        // Configure RPC URLs based on blockchain
        const rpcUrls = {
            ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
            polygon: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
            binance: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org'
        };
        const chainIds = {
            ethereum: 1,
            polygon: 137,
            binance: 56
        };
        this.rpcUrl = rpcUrls[blockchain];
        this.chainId = chainIds[blockchain];
        this.privateKey = privateKey || process.env.WALLET_PRIVATE_KEY;
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        if (this.privateKey) {
            this.signer = new ethers.Wallet(this.privateKey, this.provider);
        }
    }
    // Get provider
    getProvider() {
        return this.provider;
    }
    // Get signer
    getSigner() {
        return this.signer;
    }
    // Connect user wallet
    async connectWallet(address) {
        try {
            // Verify address format
            if (!ethers.isAddress(address)) {
                throw new Error('Invalid wallet address');
            }
            // Check if address has balance
            const balance = await this.provider.getBalance(address);
            return balance > 0n;
        }
        catch (error) {
            console.error('Error connecting wallet:', error);
            return false;
        }
    }
    // Store wallet in database
    async storeWallet(userId, address, blockchain = 'ethereum') {
        try {
            const walletData = {
                userId,
                address: address.toLowerCase(),
                blockchain,
                nonce: ethers.hexlify(ethers.randomBytes(16))
            };
            const [wallet] = await db.insert(blockchainWallets)
                .values(walletData)
                .returning();
            return wallet;
        }
        catch (error) {
            console.error('Error storing wallet:', error);
            throw error;
        }
    }
    // Get user wallets
    async getUserWallets(userId) {
        try {
            const wallets = await db.select()
                .from(blockchainWallets)
                .where(eq(blockchainWallets.userId, userId));
            return wallets;
        }
        catch (error) {
            console.error('Error fetching user wallets:', error);
            return [];
        }
    }
    // Verify wallet signature for authentication
    async verifySignature(address, message, signature) {
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === address.toLowerCase();
        }
        catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }
    // Get gas price
    async getGasPrice() {
        try {
            const feeData = await this.provider.getFeeData();
            const baseGas = feeData.gasPrice || 0n;
            return {
                slow: (baseGas * 90n) / 100n, // 90% of standard
                standard: baseGas,
                fast: (baseGas * 120n) / 100n // 120% of standard
            };
        }
        catch (error) {
            console.error('Error fetching gas price:', error);
            throw error;
        }
    }
    // Estimate gas for transaction
    async estimateGas(from, to, value, data) {
        try {
            const tx = {
                from,
                to,
                value,
                data: data || '0x'
            };
            const gasLimit = await this.provider.estimateGas(tx);
            return gasLimit;
        }
        catch (error) {
            console.error('Error estimating gas:', error);
            throw error;
        }
    }
    // Send transaction
    async sendTransaction(to, value, data) {
        if (!this.signer) {
            throw new Error('No signer available');
        }
        try {
            const tx = await this.signer.sendTransaction({
                to,
                value,
                data: data || '0x',
                gasLimit: await this.estimateGas(await this.signer.getAddress(), to, value, data)
            });
            return tx;
        }
        catch (error) {
            console.error('Error sending transaction:', error);
            throw error;
        }
    }
    // Wait for transaction confirmation
    async waitForTransaction(txHash, confirmations = 1) {
        try {
            const receipt = await this.provider.waitForTransaction(txHash, confirmations);
            return receipt;
        }
        catch (error) {
            console.error('Error waiting for transaction:', error);
            return null;
        }
    }
    // Get transaction details
    async getTransaction(txHash) {
        try {
            const tx = await this.provider.getTransaction(txHash);
            return tx;
        }
        catch (error) {
            console.error('Error fetching transaction:', error);
            return null;
        }
    }
    // Get wallet balance
    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return {
                wei: balance.toString(),
                ether: ethers.formatEther(balance)
            };
        }
        catch (error) {
            console.error('Error fetching balance:', error);
            throw error;
        }
    }
    // Convert between wei and ether
    weiToEther(wei) {
        return ethers.formatEther(wei);
    }
    etherToWei(ether) {
        return ethers.parseEther(ether);
    }
    // Format wallet address
    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    // Get block number
    async getBlockNumber() {
        try {
            return await this.provider.getBlockNumber();
        }
        catch (error) {
            console.error('Error fetching block number:', error);
            throw error;
        }
    }
    // Subscribe to events
    async subscribeToEvents(contractAddress, eventName, callback) {
        try {
            const filter = {
                address: contractAddress,
                topics: [ethers.id(eventName)]
            };
            this.provider.on(filter, callback);
        }
        catch (error) {
            console.error('Error subscribing to events:', error);
            throw error;
        }
    }
    // Log blockchain event
    async logBlockchainEvent(event) {
        try {
            await db.insert(blockchainEvents).values(event);
        }
        catch (error) {
            console.error('Error logging blockchain event:', error);
        }
    }
    // Get current network
    async getNetwork() {
        try {
            const network = await this.provider.getNetwork();
            return {
                name: network.name,
                chainId: Number(network.chainId)
            };
        }
        catch (error) {
            console.error('Error fetching network:', error);
            throw error;
        }
    }
    // Check if address is contract
    async isContract(address) {
        try {
            const code = await this.provider.getCode(address);
            return code !== '0x';
        }
        catch (error) {
            console.error('Error checking if address is contract:', error);
            return false;
        }
    }
    // Get USD price for ETH
    async getEthPrice() {
        try {
            // This would typically call a price oracle API
            // For now, return a placeholder value
            // In production, use Chainlink Price Feeds or CoinGecko API
            return 2000; // $2000 USD per ETH
        }
        catch (error) {
            console.error('Error fetching ETH price:', error);
            return 0;
        }
    }
    // Calculate transaction fee in USD
    async calculateTransactionFeeUSD(gasLimit, gasPrice) {
        try {
            const currentGasPrice = gasPrice || (await this.provider.getFeeData()).gasPrice || 0n;
            const feeInWei = gasLimit * currentGasPrice;
            const feeInEth = parseFloat(ethers.formatEther(feeInWei));
            const ethPrice = await this.getEthPrice();
            return feeInEth * ethPrice;
        }
        catch (error) {
            console.error('Error calculating transaction fee:', error);
            return 0;
        }
    }
}
// Export singleton instance
export const web3Service = new Web3Service();
