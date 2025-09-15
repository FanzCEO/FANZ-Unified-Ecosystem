const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  // Platform wallet for fee collection
  platformWallet: process.env.PLATFORM_WALLET || "0x0000000000000000000000000000000000000000",
  
  // Initial configuration
  platformFeePercentage: 250, // 2.5%
  minimumPrice: ethers.utils.parseEther("0.001"), // 0.001 ETH
  requireContentVerification: true,
  
  // Gas settings per network
  gasSettings: {
    mainnet: {
      gasPrice: ethers.utils.parseUnits("20", "gwei"),
      gasLimit: 8000000
    },
    goerli: {
      gasPrice: ethers.utils.parseUnits("20", "gwei"),
      gasLimit: 8000000
    },
    sepolia: {
      gasPrice: ethers.utils.parseUnits("20", "gwei"),
      gasLimit: 8000000
    },
    polygon: {
      gasPrice: ethers.utils.parseUnits("30", "gwei"),
      gasLimit: 8000000
    },
    mumbai: {
      gasPrice: ethers.utils.parseUnits("30", "gwei"),
      gasLimit: 8000000
    },
    localhost: {
      gasPrice: ethers.utils.parseUnits("20", "gwei"),
      gasLimit: 8000000
    },
    hardhat: {
      gasPrice: ethers.utils.parseUnits("20", "gwei"),
      gasLimit: 8000000
    }
  }
};

async function main() {
  console.log("\n🚀 Starting FANZ NFT Marketplace Deployment...\n");
  
  // Get network information
  const networkName = network.name;
  console.log(`📡 Network: ${networkName}`);
  console.log(`🔗 Chain ID: ${network.config.chainId}`);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH\n`);
  
  // Validate platform wallet
  if (DEPLOYMENT_CONFIG.platformWallet === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️  Warning: Using zero address for platform wallet");
    console.log("   Set PLATFORM_WALLET environment variable for production");
    DEPLOYMENT_CONFIG.platformWallet = deployer.address;
  }
  
  console.log(`🏛️  Platform Wallet: ${DEPLOYMENT_CONFIG.platformWallet}`);
  console.log(`💸 Platform Fee: ${DEPLOYMENT_CONFIG.platformFeePercentage / 100}%`);
  console.log(`💎 Minimum Price: ${ethers.utils.formatEther(DEPLOYMENT_CONFIG.minimumPrice)} ETH\n`);
  
  try {
    // Get contract factory
    const FanzNFTMarketplace = await ethers.getContractFactory("FanzNFTMarketplace");
    
    console.log("📝 Deploying FanzNFTMarketplace contract...");
    
    // Get gas settings for network
    const gasSettings = DEPLOYMENT_CONFIG.gasSettings[networkName] || DEPLOYMENT_CONFIG.gasSettings.mainnet;
    
    // Deploy contract
    const marketplace = await FanzNFTMarketplace.deploy(
      DEPLOYMENT_CONFIG.platformWallet,
      {
        gasPrice: gasSettings.gasPrice,
        gasLimit: gasSettings.gasLimit
      }
    );
    
    console.log("⏳ Waiting for deployment transaction...");
    await marketplace.deployed();
    
    console.log("\n✅ Contract deployed successfully!");
    console.log(`📍 Contract Address: ${marketplace.address}`);
    console.log(`🧾 Transaction Hash: ${marketplace.deployTransaction.hash}`);
    
    // Wait for block confirmations on mainnet
    if (networkName === "mainnet" || networkName === "polygon") {
      console.log("\n⏳ Waiting for block confirmations...");
      await marketplace.deployTransaction.wait(5);
      console.log("✅ 5 block confirmations received");
    } else if (networkName !== "localhost" && networkName !== "hardhat") {
      console.log("\n⏳ Waiting for block confirmations...");
      await marketplace.deployTransaction.wait(2);
      console.log("✅ 2 block confirmations received");
    }
    
    // Get deployment gas cost
    const deploymentReceipt = await marketplace.deployTransaction.wait();
    const gasUsed = deploymentReceipt.gasUsed;
    const gasPrice = marketplace.deployTransaction.gasPrice;
    const deploymentCost = gasUsed.mul(gasPrice);
    
    console.log(`\n⛽ Gas Used: ${gasUsed.toString()}`);
    console.log(`💸 Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(`💰 Deployment Cost: ${ethers.utils.formatEther(deploymentCost)} ETH`);
    
    // Configure initial settings
    console.log("\n🔧 Configuring initial settings...");
    
    // Set platform fee if different from default
    if (DEPLOYMENT_CONFIG.platformFeePercentage !== 250) {
      console.log(`Setting platform fee to ${DEPLOYMENT_CONFIG.platformFeePercentage / 100}%...`);
      const tx1 = await marketplace.setPlatformFee(DEPLOYMENT_CONFIG.platformFeePercentage);
      await tx1.wait();
      console.log("✅ Platform fee set");
    }
    
    // Set minimum price if different from default
    const currentMinPrice = await marketplace.minimumPrice();
    if (!currentMinPrice.eq(DEPLOYMENT_CONFIG.minimumPrice)) {
      console.log(`Setting minimum price to ${ethers.utils.formatEther(DEPLOYMENT_CONFIG.minimumPrice)} ETH...`);
      const tx2 = await marketplace.setMinimumPrice(DEPLOYMENT_CONFIG.minimumPrice);
      await tx2.wait();
      console.log("✅ Minimum price set");
    }
    
    // Add initial content moderators (deployer)
    console.log("Adding deployer as content moderator...");
    // Deployer is automatically added as moderator in constructor
    console.log("✅ Content moderator added");
    
    // Save deployment information
    console.log("\n💾 Saving deployment information...");
    const deploymentInfo = {
      network: networkName,
      chainId: network.config.chainId,
      contractAddress: marketplace.address,
      transactionHash: marketplace.deployTransaction.hash,
      deployerAddress: deployer.address,
      platformWallet: DEPLOYMENT_CONFIG.platformWallet,
      platformFeePercentage: DEPLOYMENT_CONFIG.platformFeePercentage,
      minimumPrice: ethers.utils.formatEther(DEPLOYMENT_CONFIG.minimumPrice),
      gasUsed: gasUsed.toString(),
      gasPrice: ethers.utils.formatUnits(gasPrice, "gwei"),
      deploymentCost: ethers.utils.formatEther(deploymentCost),
      timestamp: new Date().toISOString(),
      blockNumber: deploymentReceipt.blockNumber
    };
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    // Save ABI
    const artifacts = await ethers.getContractFactory("FanzNFTMarketplace");
    const abiFile = path.join(deploymentsDir, "FanzNFTMarketplace-ABI.json");
    fs.writeFileSync(abiFile, JSON.stringify(artifacts.interface.format("json"), null, 2));
    
    console.log(`✅ Deployment info saved to: ${deploymentFile}`);
    console.log(`✅ ABI saved to: ${abiFile}`);
    
    // Verification instructions
    if (networkName !== "localhost" && networkName !== "hardhat") {
      console.log("\n🔍 Contract Verification:");
      console.log(`Run: npx hardhat verify --network ${networkName} ${marketplace.address} "${DEPLOYMENT_CONFIG.platformWallet}"`);
    }
    
    // Next steps
    console.log("\n🎯 Next Steps:");
    console.log("1. Verify the contract on block explorer (if not localhost)");
    console.log("2. Add content moderators using addContentModerator()");
    console.log("3. Verify creators using verifyCreator()");
    console.log("4. Set up age verification for adult content");
    console.log("5. Configure IPFS for metadata storage");
    console.log("6. Test NFT creation and trading functionality");
    
    // Configuration summary
    console.log("\n📋 Deployment Summary:");
    console.log(`   Network: ${networkName}`);
    console.log(`   Contract: ${marketplace.address}`);
    console.log(`   Platform Wallet: ${DEPLOYMENT_CONFIG.platformWallet}`);
    console.log(`   Platform Fee: ${DEPLOYMENT_CONFIG.platformFeePercentage / 100}%`);
    console.log(`   Min Price: ${ethers.utils.formatEther(DEPLOYMENT_CONFIG.minimumPrice)} ETH`);
    console.log(`   Gas Used: ${gasUsed.toString()}`);
    console.log(`   Cost: ${ethers.utils.formatEther(deploymentCost)} ETH`);
    
    console.log("\n🎉 Deployment completed successfully!\n");
    
    return {
      contractAddress: marketplace.address,
      transactionHash: marketplace.deployTransaction.hash,
      deploymentInfo
    };
    
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main, DEPLOYMENT_CONFIG };