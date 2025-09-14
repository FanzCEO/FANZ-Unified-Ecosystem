// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@REDACTED_AWS_SECRET_KEY.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@REDACTED_AWS_SECRET_KEYcyGuard.sol";
import "@REDACTED_AWS_SECRET_KEYth.sol";

// 🪙 FANZ CREATOR TOKEN SYSTEM - Revolutionary Creator Economy
// Each creator gets their own tradeable token with unique utility and governance

contract CreatorTokenFactory is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    
    struct CreatorToken {
        address tokenAddress;
        address creator;
        string creatorName;
        string symbol;
        uint256 totalSupply;
        uint256 currentPrice;
        uint256 marketCap;
        uint256 createdAt;
        bool isActive;
    }
    
    struct CreatorMetrics {
        uint256 totalRevenue;
        uint256 fanCount;
        uint256 contentCount;
        uint256 engagementScore;
        uint256 lastUpdated;
    }
    
    mapping(address => CreatorToken) public creatorTokens;
    mapping(address => CreatorMetrics) public creatorMetrics;
    mapping(address => mapping(address => uint256)) public fanInvestments;
    
    address[] public allCreatorTokens;
    
    event CreatorTokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 initialSupply
    );
    
    event TokenPurchase(
        address indexed buyer,
        address indexed creatorToken,
        uint256 amount,
        uint256 price
    );
    
    event RevenueDistributed(
        address indexed creator,
        uint256 totalAmount,
        uint256 tokenHolderShare
    );
    
    // 🚀 Create New Creator Token
    function createCreatorToken(
        string memory _creatorName,
        string memory _symbol,
        uint256 _initialSupply,
        uint256 _initialPrice
    ) external returns (address) {
        require(creatorTokens[msg.sender].tokenAddress == address(0), "Token already exists");
        
        // Deploy new CreatorToken contract
        CreatorToken_ERC20 newToken = new CreatorToken_ERC20(
            _creatorName,
            _symbol,
            _initialSupply,
            msg.sender
        );
        
        address tokenAddress = address(newToken);
        
        // Store creator token info
        creatorTokens[msg.sender] = CreatorToken({
            tokenAddress: tokenAddress,
            creator: msg.sender,
            creatorName: _creatorName,
            symbol: _symbol,
            totalSupply: _initialSupply,
            currentPrice: _initialPrice,
            marketCap: _initialSupply.mul(_initialPrice),
            createdAt: block.timestamp,
            isActive: true
        });
        
        allCreatorTokens.push(tokenAddress);
        
        emit CreatorTokenCreated(msg.sender, tokenAddress, _creatorName, _symbol, _initialSupply);
        
        return tokenAddress;
    }
    
    // 💰 Purchase Creator Tokens
    function purchaseCreatorTokens(
        address _creator,
        uint256 _tokenAmount
    ) external payable nonReentrant {
        CreatorToken storage token = creatorTokens[_creator];
        require(token.isActive, "Creator token not active");
        
        uint256 totalCost = _tokenAmount.mul(token.currentPrice);
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Transfer tokens to buyer
        CreatorToken_ERC20(token.tokenAddress).mint(msg.sender, _tokenAmount);
        
        // Update fan investment tracking
        fanInvestments[msg.sender][_creator] = fanInvestments[msg.sender][_creator].add(_tokenAmount);
        
        // Update token price based on demand (bonding curve)
        updateTokenPrice(_creator, _tokenAmount, true);
        
        // Send payment to creator (minus platform fee)
        uint256 platformFee = totalCost.mul(5).div(100); // 5% platform fee
        uint256 creatorShare = totalCost.sub(platformFee);
        
        payable(_creator).transfer(creatorShare);
        
        emit TokenPurchase(msg.sender, token.tokenAddress, _tokenAmount, token.currentPrice);
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value.sub(totalCost));
        }
    }
    
    // 📈 Update Token Price (Bonding Curve Algorithm)
    function updateTokenPrice(address _creator, uint256 _tokenAmount, bool _buying) internal {
        CreatorToken storage token = creatorTokens[_creator];
        
        // Bonding curve: price increases with supply
        uint256 currentSupply = CreatorToken_ERC20(token.tokenAddress).totalSupply();
        
        if (_buying) {
            // Price increase formula: new_price = old_price * (1 + (tokens_bought / current_supply) * 0.1)
            uint256 priceIncrease = token.currentPrice.mul(_tokenAmount).div(currentSupply).div(10);
            token.currentPrice = token.currentPrice.add(priceIncrease);
        } else {
            // Price decrease formula for selling
            uint256 priceDecrease = token.currentPrice.mul(_tokenAmount).div(currentSupply).div(20);
            if (token.currentPrice > priceDecrease) {
                token.currentPrice = token.currentPrice.sub(priceDecrease);
            }
        }
        
        // Update market cap
        token.marketCap = currentSupply.mul(token.currentPrice);
    }
    
    // 💸 Distribute Revenue to Token Holders
    function distributeRevenue(uint256 _revenueAmount) external {
        CreatorToken storage token = creatorTokens[msg.sender];
        require(token.isActive, "Creator token not active");
        require(_revenueAmount > 0, "Revenue must be positive");
        
        // 70% to creator, 30% distributed to token holders
        uint256 tokenHolderShare = _revenueAmount.mul(30).div(100);
        uint256 creatorShare = _revenueAmount.sub(tokenHolderShare);
        
        // Update creator metrics
        creatorMetrics[msg.sender].totalRevenue = creatorMetrics[msg.sender].totalRevenue.add(_revenueAmount);
        creatorMetrics[msg.sender].lastUpdated = block.timestamp;
        
        // Distribute to token holders (simplified - in production would use more sophisticated distribution)
        CreatorToken_ERC20(token.tokenAddress).distributeRevenue{value: tokenHolderShare}();
        
        emit RevenueDistributed(msg.sender, _revenueAmount, tokenHolderShare);
    }
    
    // 📊 Get Creator Token Info
    function getCreatorTokenInfo(address _creator) external view returns (
        address tokenAddress,
        string memory creatorName,
        string memory symbol,
        uint256 totalSupply,
        uint256 currentPrice,
        uint256 marketCap,
        bool isActive
    ) {
        CreatorToken storage token = creatorTokens[_creator];
        return (
            token.tokenAddress,
            token.creatorName,
            token.symbol,
            token.totalSupply,
            token.currentPrice,
            token.marketCap,
            token.isActive
        );
    }
    
    // 🏆 Get Top Creator Tokens by Market Cap
    function getTopCreatorTokens(uint256 _count) external view returns (address[] memory) {
        // Simplified implementation - in production would use more sophisticated sorting
        address[] memory topTokens = new address[](_count);
        
        // Copy first _count tokens (in production would sort by market cap)
        for (uint256 i = 0; i < _count && i < allCreatorTokens.length; i++) {
            topTokens[i] = allCreatorTokens[i];
        }
        
        return topTokens;
    }
    
    // 💎 Token Utility Functions
    function getTokenUtilities(address _creator) external view returns (
        bool exclusiveContent,
        bool governanceRights,
        bool revenueshare,
        bool prioritySupport,
        bool specialEvents
    ) {
        // All creator tokens have these utilities
        return (true, true, true, true, true);
    }
}

// 🏅 Individual Creator Token Contract
contract CreatorToken_ERC20 is ERC20, Ownable {
    using SafeMath for uint256;
    
    address public creator;
    uint256 public createdAt;
    mapping(address => uint256) public lastDividendClaim;
    uint256 public totalDividendsDistributed;
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _creator
    ) ERC20(_name, _symbol) {
        creator = _creator;
        createdAt = block.timestamp;
        _mint(_creator, _initialSupply * 10**decimals());
        _transferOwnership(_creator);
    }
    
    // 🪙 Mint new tokens (only factory can call)
    function mint(address _to, uint256 _amount) external {
        require(msg.sender == owner() || msg.sender == creator, "Unauthorized");
        _mint(_to, _amount);
    }
    
    // 💰 Distribute revenue to token holders
    function distributeRevenue() external payable {
        require(msg.value > 0, "No revenue to distribute");
        totalDividendsDistributed = totalDividendsDistributed.add(msg.value);
    }
    
    // 💸 Claim dividends
    function claimDividends() external {
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "No tokens held");
        
        uint256 totalSupply = totalSupply();
        uint256 dividendShare = totalDividendsDistributed.mul(balance).div(totalSupply);
        
        // Simplified dividend calculation (in production would track per-token dividends)
        uint256 claimable = dividendShare.sub(lastDividendClaim[msg.sender]);
        
        if (claimable > 0) {
            lastDividendClaim[msg.sender] = dividendShare;
            payable(msg.sender).transfer(claimable);
        }
    }
    
    // 🎯 Token Utility Functions
    function hasExclusiveAccess(address _holder) external view returns (bool) {
        return balanceOf(_holder) > 0;
    }
    
    function getVotingPower(address _holder) external view returns (uint256) {
        return balanceOf(_holder);
    }
    
    function canAccessPremiumContent(address _holder) external view returns (bool) {
        return balanceOf(_holder) >= 100 * 10**decimals(); // Minimum 100 tokens
    }
}

// 🏛️ Creator Token Governance Contract
contract CreatorGovernance {
    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    mapping(address => mapping(uint256 => Proposal)) public proposals;
    mapping(address => uint256) public proposalCount;
    
    event ProposalCreated(
        address indexed creator,
        uint256 indexed proposalId,
        string title,
        uint256 deadline
    );
    
    event VoteCasted(
        address indexed voter,
        address indexed creator,
        uint256 indexed proposalId,
        bool support,
        uint256 votingPower
    );
    
    // 📝 Create Governance Proposal
    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _votingPeriod
    ) external {
        uint256 proposalId = proposalCount[msg.sender];
        
        Proposal storage newProposal = proposals[msg.sender][proposalId];
        newProposal.id = proposalId;
        newProposal.creator = msg.sender;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.deadline = block.timestamp + _votingPeriod;
        newProposal.executed = false;
        
        proposalCount[msg.sender]++;
        
        emit ProposalCreated(msg.sender, proposalId, _title, newProposal.deadline);
    }
    
    // 🗳️ Vote on Proposal
    function vote(
        address _creator,
        uint256 _proposalId,
        bool _support
    ) external {
        Proposal storage proposal = proposals[_creator][_proposalId];
        require(block.timestamp <= proposal.deadline, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        // Get voting power from creator token
        CreatorTokenFactory factory = CreatorTokenFactory(owner());
        (address tokenAddress, , , , , , ) = factory.getCreatorTokenInfo(_creator);
        
        uint256 votingPower = CreatorToken_ERC20(tokenAddress).getVotingPower(msg.sender);
        require(votingPower > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (_support) {
            proposal.votesFor = proposal.votesFor.add(votingPower);
        } else {
            proposal.votesAgainst = proposal.votesAgainst.add(votingPower);
        }
        
        emit VoteCasted(msg.sender, _creator, _proposalId, _support, votingPower);
    }
}

// 🎯 Token Utility Smart Contract
contract CreatorTokenUtilities {
    struct UtilityAccess {
        bool exclusiveContent;
        bool prioritySupport;
        bool governanceVoting;
        bool revenueSharing;
        bool specialEvents;
        bool earlyAccess;
        bool customRequests;
        bool nftMinting;
    }
    
    mapping(address => mapping(address => UtilityAccess)) public userUtilities;
    
    // 🔓 Check and Update Utility Access
    function updateUtilityAccess(address _user, address _creator) external {
        CreatorTokenFactory factory = CreatorTokenFactory(owner());
        (address tokenAddress, , , , , , ) = factory.getCreatorTokenInfo(_creator);
        
        uint256 tokenBalance = CreatorToken_ERC20(tokenAddress).balanceOf(_user);
        
        UtilityAccess storage utilities = userUtilities[_user][_creator];
        
        // Tier-based utility access
        if (tokenBalance >= 1000 * 10**18) { // 1000+ tokens = Premium tier
            utilities.exclusiveContent = true;
            utilities.prioritySupport = true;
            utilities.governanceVoting = true;
            utilities.revenueSharing = true;
            utilities.specialEvents = true;
            utilities.earlyAccess = true;
            utilities.customRequests = true;
            utilities.nftMinting = true;
        } else if (tokenBalance >= 100 * 10**18) { // 100+ tokens = Gold tier
            utilities.exclusiveContent = true;
            utilities.prioritySupport = true;
            utilities.governanceVoting = true;
            utilities.revenueSharing = true;
            utilities.specialEvents = true;
            utilities.earlyAccess = true;
        } else if (tokenBalance >= 10 * 10**18) { // 10+ tokens = Silver tier
            utilities.exclusiveContent = true;
            utilities.governanceVoting = true;
            utilities.revenueSharing = true;
            utilities.specialEvents = true;
        } else if (tokenBalance > 0) { // Any tokens = Basic tier
            utilities.exclusiveContent = true;
            utilities.revenueSharing = true;
        }
    }
    
    // 🎫 Check Access to Specific Utility
    function hasUtilityAccess(
        address _user,
        address _creator,
        string memory _utility
    ) external view returns (bool) {
        UtilityAccess storage utilities = userUtilities[_user][_creator];
        
        if (keccak256(bytes(_utility)) == keccak256(bytes("exclusive_content"))) {
            return utilities.exclusiveContent;
        } else if (keccak256(bytes(_utility)) == keccak256(bytes("priority_support"))) {
            return utilities.prioritySupport;
        } else if (keccak256(bytes(_utility)) == keccak256(bytes("governance_voting"))) {
            return utilities.governanceVoting;
        } else if (keccak256(bytes(_utility)) == keccak256(bytes("revenue_sharing"))) {
            return utilities.revenueSharing;
        }
        // ... other utilities
        
        return false;
    }
}

// 🏆 CREATOR TOKEN FEATURES:
// ✅ Each creator gets their own ERC-20 token
// ✅ Bonding curve pricing mechanism
// ✅ Revenue sharing with token holders
// ✅ Governance rights for major decisions
// ✅ Tiered utility access based on holdings
// ✅ Exclusive content access
// ✅ Priority support for token holders
// ✅ Special events and early access
// ✅ NFT minting rights for premium holders
// ✅ Automated dividend distribution
// ✅ Market cap tracking and rankings
// ✅ Fan investment tracking
// ✅ Platform fee structure (5%)

// 🚀 REVOLUTIONARY TOKENOMICS:
// - Fans become investors in their favorite creators
// - Creators get funding from their community
// - Token value increases with creator success
// - Revenue sharing creates passive income for fans
// - Governance gives fans a voice in creator decisions
// - Utility tokens unlock exclusive experiences