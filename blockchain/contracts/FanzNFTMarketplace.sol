// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title FanzNFTMarketplace
 * @dev NFT Marketplace contract for FANZ creator economy platform
 * Supports minting, trading, royalties, and creator-specific features
 */
contract FanzNFTMarketplace is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Royalty, 
    ReentrancyGuard, 
    Ownable, 
    Pausable 
{
    using Counters for Counters.Counter;
    
    // State variables
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;
    
    // Platform fee (2.5%)
    uint256 public platformFeePercentage = 250; // 250 basis points = 2.5%
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10% max
    
    // Minimum listing price (0.001 ETH)
    uint256 public minimumPrice = 0.001 ether;
    
    // Platform wallet for fee collection
    address payable public platformWallet;
    
    // Content verification requirements
    bool public requireContentVerification = true;
    mapping(address => bool) public verifiedCreators;
    mapping(address => bool) public contentModerators;
    
    // Marketplace item structure
    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        address payable creator;
        uint256 price;
        bool sold;
        bool active;
        uint256 listingTime;
        string category;
        bool isAdultContent;
        bool requiresAgeVerification;
    }
    
    // Creator profile structure
    struct CreatorProfile {
        string username;
        string profileImageURI;
        string socialLinks;
        uint256 totalSales;
        uint256 totalItems;
        bool verified;
        string platform; // girlfanz, boyfanz, etc.
    }
    
    // Mappings
    mapping(uint256 => MarketItem) public marketItems;
    mapping(address => CreatorProfile) public creatorProfiles;
    mapping(address => bool) public ageVerifiedUsers;
    mapping(string => bool) public bannedContent;
    
    // Events
    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        string category,
        bool isAdultContent
    );
    
    event MarketItemSold(
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price,
        uint256 platformFee,
        uint256 royaltyFee
    );
    
    event MarketItemListed(
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    
    event MarketItemDelisted(
        uint256 indexed tokenId,
        address seller
    );
    
    event CreatorVerified(address indexed creator, string platform);
    event ContentModerated(uint256 indexed tokenId, bool approved);
    event AgeVerified(address indexed user);
    
    // Modifiers
    modifier onlyVerifiedCreator() {
        require(verifiedCreators[msg.sender], "Creator not verified");
        _;
    }
    
    modifier onlyContentModerator() {
        require(contentModerators[msg.sender] || owner() == msg.sender, "Not authorized moderator");
        _;
    }
    
    modifier onlyAgeVerified() {
        require(ageVerifiedUsers[msg.sender], "Age verification required");
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }
    
    constructor(address payable _platformWallet) ERC721("FANZ NFT", "FANZ") {
        platformWallet = _platformWallet;
        
        // Set deployer as first verified creator and moderator
        verifiedCreators[msg.sender] = true;
        contentModerators[msg.sender] = true;
    }
    
    /**
     * @dev Create and mint NFT with marketplace listing
     */
    function createAndListNFT(
        string memory tokenURI,
        uint256 price,
        string memory category,
        bool isAdultContent,
        uint96 royaltyFeeNumerator,
        string memory platform
    ) public nonReentrant whenNotPaused returns (uint256) {
        require(price >= minimumPrice, "Price below minimum");
        
        if (requireContentVerification) {
            require(verifiedCreators[msg.sender], "Creator verification required");
        }
        
        if (isAdultContent) {
            require(ageVerifiedUsers[msg.sender], "Age verification required for adult content");
        }
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Mint NFT to creator
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Set royalty (max 10%)
        require(royaltyFeeNumerator <= 1000, "Royalty fee too high");
        _setTokenRoyalty(newTokenId, msg.sender, royaltyFeeNumerator);
        
        // Create marketplace item
        marketItems[newTokenId] = MarketItem(
            newTokenId,
            payable(msg.sender),
            payable(address(this)),
            payable(msg.sender),
            price,
            false,
            true,
            block.timestamp,
            category,
            isAdultContent,
            isAdultContent
        );
        
        // Transfer to marketplace contract
        _transfer(msg.sender, address(this), newTokenId);
        
        // Update creator profile
        _updateCreatorProfile(msg.sender, platform);
        
        emit MarketItemCreated(
            newTokenId,
            msg.sender,
            address(this),
            price,
            category,
            isAdultContent
        );
        
        return newTokenId;
    }
    
    /**
     * @dev Purchase NFT from marketplace
     */
    function purchaseNFT(uint256 tokenId) 
        public 
        payable 
        nonReentrant 
        whenNotPaused 
        validTokenId(tokenId) 
    {
        MarketItem storage item = marketItems[tokenId];
        
        require(item.active, "Item not active");
        require(!item.sold, "Item already sold");
        require(msg.value >= item.price, "Insufficient payment");
        
        if (item.requiresAgeVerification) {
            require(ageVerifiedUsers[msg.sender], "Age verification required");
        }
        
        address seller = item.seller;
        uint256 price = item.price;
        
        // Calculate fees
        uint256 platformFee = (price * platformFeePercentage) / 10000;
        uint256 royaltyFee = 0;
        address royaltyRecipient;
        
        if (seller != item.creator) {
            (royaltyRecipient, royaltyFee) = royaltyInfo(tokenId, price);
        }
        
        uint256 sellerPayment = price - platformFee - royaltyFee;
        
        // Mark as sold
        item.sold = true;
        item.active = false;
        item.owner = payable(msg.sender);
        
        _itemsSold.increment();
        
        // Transfer NFT to buyer
        _transfer(address(this), msg.sender, tokenId);
        
        // Process payments
        platformWallet.transfer(platformFee);
        
        if (royaltyFee > 0 && royaltyRecipient != address(0)) {
            payable(royaltyRecipient).transfer(royaltyFee);
        }
        
        payable(seller).transfer(sellerPayment);
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        // Update creator stats
        creatorProfiles[item.creator].totalSales += price;
        
        emit MarketItemSold(
            tokenId,
            seller,
            msg.sender,
            price,
            platformFee,
            royaltyFee
        );
    }
    
    /**
     * @dev List existing NFT on marketplace
     */
    function listNFT(uint256 tokenId, uint256 price) 
        public 
        nonReentrant 
        whenNotPaused 
        validTokenId(tokenId) 
    {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price >= minimumPrice, "Price below minimum");
        require(!marketItems[tokenId].active, "Already listed");
        
        MarketItem storage item = marketItems[tokenId];
        
        if (item.requiresAgeVerification) {
            require(ageVerifiedUsers[msg.sender], "Age verification required");
        }
        
        // Update item details
        item.seller = payable(msg.sender);
        item.price = price;
        item.active = true;
        item.sold = false;
        item.listingTime = block.timestamp;
        
        // Transfer to marketplace
        _transfer(msg.sender, address(this), tokenId);
        
        emit MarketItemListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Delist NFT from marketplace
     */
    function delistNFT(uint256 tokenId) 
        public 
        nonReentrant 
        validTokenId(tokenId) 
    {
        MarketItem storage item = marketItems[tokenId];
        require(item.seller == msg.sender, "Not seller");
        require(item.active, "Not listed");
        
        item.active = false;
        
        // Transfer back to owner
        _transfer(address(this), msg.sender, tokenId);
        
        emit MarketItemDelisted(tokenId, msg.sender);
    }
    
    /**
     * @dev Verify creator for platform
     */
    function verifyCreator(address creator, string memory platform) 
        public 
        onlyContentModerator 
    {
        verifiedCreators[creator] = true;
        creatorProfiles[creator].verified = true;
        creatorProfiles[creator].platform = platform;
        
        emit CreatorVerified(creator, platform);
    }
    
    /**
     * @dev Verify user age for adult content access
     */
    function verifyAge(address user) public onlyContentModerator {
        ageVerifiedUsers[user] = true;
        emit AgeVerified(user);
    }
    
    /**
     * @dev Moderate content (approve/reject)
     */
    function moderateContent(uint256 tokenId, bool approved) 
        public 
        onlyContentModerator 
        validTokenId(tokenId) 
    {
        if (!approved) {
            marketItems[tokenId].active = false;
        }
        
        emit ContentModerated(tokenId, approved);
    }
    
    /**
     * @dev Get active marketplace items
     */
    function getActiveMarketItems() public view returns (MarketItem[] memory) {
        uint256 totalItems = _tokenIds.current();
        uint256 activeCount = 0;
        
        // Count active items
        for (uint256 i = 1; i <= totalItems; i++) {
            if (marketItems[i].active && !marketItems[i].sold) {
                activeCount++;
            }
        }
        
        MarketItem[] memory items = new MarketItem[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= totalItems; i++) {
            if (marketItems[i].active && !marketItems[i].sold) {
                items[currentIndex] = marketItems[i];
                currentIndex++;
            }
        }
        
        return items;
    }
    
    /**
     * @dev Get user's owned NFTs
     */
    function getUserNFTs(address user) public view returns (MarketItem[] memory) {
        uint256 totalItems = _tokenIds.current();
        uint256 userItemCount = 0;
        
        // Count user items
        for (uint256 i = 1; i <= totalItems; i++) {
            if (ownerOf(i) == user) {
                userItemCount++;
            }
        }
        
        MarketItem[] memory items = new MarketItem[](userItemCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= totalItems; i++) {
            if (ownerOf(i) == user) {
                items[currentIndex] = marketItems[i];
                currentIndex++;
            }
        }
        
        return items;
    }
    
    /**
     * @dev Update creator profile
     */
    function _updateCreatorProfile(address creator, string memory platform) internal {
        CreatorProfile storage profile = creatorProfiles[creator];
        profile.totalItems++;
        if (bytes(profile.platform).length == 0) {
            profile.platform = platform;
        }
    }
    
    /**
     * @dev Admin functions
     */
    function setPlatformFee(uint256 _platformFeePercentage) public onlyOwner {
        require(_platformFeePercentage <= MAX_PLATFORM_FEE, "Fee too high");
        platformFeePercentage = _platformFeePercentage;
    }
    
    function setMinimumPrice(uint256 _minimumPrice) public onlyOwner {
        minimumPrice = _minimumPrice;
    }
    
    function setPlatformWallet(address payable _platformWallet) public onlyOwner {
        platformWallet = _platformWallet;
    }
    
    function addContentModerator(address moderator) public onlyOwner {
        contentModerators[moderator] = true;
    }
    
    function removeContentModerator(address moderator) public onlyOwner {
        contentModerators[moderator] = false;
    }
    
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        platformWallet.transfer(balance);
    }
    
    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}