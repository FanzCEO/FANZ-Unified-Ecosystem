require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "REDACTED_AWS_SECRET_KEY00000000000000000000000000";
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development network
    hardhat: {
      chainId: 31337,
      mining: {
        auto: false,
        interval: 5000
      },
      accounts: {
        count: 20,
        accountsBalance: "10000000000000000000000" // 10000 ETH
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    
    // Ethereum Mainnet
    mainnet: {
      url: ALCHEMY_API_KEY 
        ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
        : `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY],
      chainId: 1,
      gasPrice: "auto",
    },
    
    // Ethereum Goerli Testnet
    goerli: {
      url: ALCHEMY_API_KEY 
        ? `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
        : `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      gasPrice: "auto",
    },
    
    // Ethereum Sepolia Testnet
    sepolia: {
      url: ALCHEMY_API_KEY 
        ? `https://eth-sepolia.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
        : `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasPrice: "auto",
    },
    
    // Polygon Mainnet
    polygon: {
      url: ALCHEMY_API_KEY 
        ? `https://polygon-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
        : `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY],
      chainId: 137,
      gasPrice: 30000000000, // 30 gwei
    },
    
    // Polygon Mumbai Testnet
    mumbai: {
      url: ALCHEMY_API_KEY 
        ? `https://polygon-mumbai.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
        : `https://polygon-mumbai.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      gasPrice: 30000000000, // 30 gwei
    },
    
    // Binance Smart Chain
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      accounts: [PRIVATE_KEY],
      chainId: 56,
      gasPrice: 20000000000, // 20 gwei
    },
    
    // BSC Testnet
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: [PRIVATE_KEY],
      chainId: 97,
      gasPrice: 20000000000, // 20 gwei
    },
    
    // Avalanche Mainnet
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 43114,
      gasPrice: 225000000000, // 225 gwei
    },
    
    // Avalanche Fuji Testnet
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 43113,
      gasPrice: 225000000000, // 225 gwei
    },
  },
  
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
    }
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    gasPrice: 20,
    showTimeSpent: true,
    showMethodSig: true,
  },
  
  mocha: {
    timeout: 300000, // 5 minutes
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};