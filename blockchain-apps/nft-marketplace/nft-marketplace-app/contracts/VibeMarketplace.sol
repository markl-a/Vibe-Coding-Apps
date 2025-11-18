// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title VibeMarketplace
 * @dev Advanced NFT Marketplace with multiple trading modes
 * Features:
 * - Fixed price listings
 * - English auctions (highest bidder wins)
 * - Dutch auctions (price decreases over time)
 * - Make offers on unlisted NFTs
 * - ERC2981 royalty support
 * - Platform fees
 */
contract VibeMarketplace is ReentrancyGuard, Pausable, Ownable {
    using Counters for Counters.Counter;

    // Listing types
    enum ListingType {
        FixedPrice,
        EnglishAuction,
        DutchAuction
    }

    // Fixed price listing
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        uint256 timestamp;
        bool active;
    }

    // English auction (highest bidder wins)
    struct EnglishAuction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startPrice;
        uint256 reservePrice;
        uint256 highestBid;
        address highestBidder;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool settled;
    }

    // Dutch auction (price decreases over time)
    struct DutchAuction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startPrice;
        uint256 endPrice;
        uint256 startTime;
        uint256 duration;
        bool active;
    }

    // Offer on unlisted NFT
    struct Offer {
        address offerer;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        uint256 expiration;
        bool active;
    }

    // Storage
    mapping(bytes32 => Listing) public listings;
    mapping(bytes32 => EnglishAuction) public englishAuctions;
    mapping(bytes32 => DutchAuction) public dutchAuctions;
    mapping(bytes32 => Offer) public offers;

    // Counters
    Counters.Counter private _auctionIdCounter;
    Counters.Counter private _offerIdCounter;

    // Platform configuration
    uint256 public platformFee = 250; // 2.5% (basis points)
    uint256 public constant MAX_FEE = 1000; // 10% maximum
    address public feeRecipient;

    // Minimum auction duration
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;

    // Events
    event ItemListed(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );

    event ItemSold(
        bytes32 indexed listingId,
        address indexed buyer,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );

    event ListingCancelled(bytes32 indexed listingId);

    event EnglishAuctionCreated(
        bytes32 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 reservePrice,
        uint256 endTime
    );

    event BidPlaced(
        bytes32 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionSettled(
        bytes32 indexed auctionId,
        address indexed winner,
        uint256 amount
    );

    event DutchAuctionCreated(
        bytes32 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration
    );

    event DutchAuctionFilled(
        bytes32 indexed auctionId,
        address indexed buyer,
        uint256 price
    );

    event OfferMade(
        bytes32 indexed offerId,
        address indexed offerer,
        address indexed nftContract,
        uint256 tokenId,
        uint256 amount
    );

    event OfferAccepted(
        bytes32 indexed offerId,
        address indexed seller
    );

    event OfferCancelled(bytes32 indexed offerId);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // ============ Fixed Price Listings ============

    /**
     * @dev List NFT at fixed price
     */
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external whenNotPaused returns (bytes32) {
        require(price > 0, "Price must be > 0");
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        bytes32 listingId = keccak256(
            abi.encodePacked(nftContract, tokenId, msg.sender, block.timestamp)
        );

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            timestamp: block.timestamp,
            active: true
        });

        emit ItemListed(listingId, msg.sender, nftContract, tokenId, price);
        return listingId;
    }

    /**
     * @dev Buy listed NFT
     */
    function buyItem(bytes32 listingId)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");

        listing.active = false;

        // Process payment with royalties
        _processPayment(
            listing.nftContract,
            listing.tokenId,
            listing.seller,
            listing.price
        );

        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Refund excess payment
        if (msg.value > listing.price) {
            (bool success, ) = payable(msg.sender).call{
                value: msg.value - listing.price
            }("");
            require(success, "Refund failed");
        }

        emit ItemSold(
            listingId,
            msg.sender,
            listing.nftContract,
            listing.tokenId,
            listing.price
        );
    }

    /**
     * @dev Cancel listing
     */
    function cancelListing(bytes32 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;
        emit ListingCancelled(listingId);
    }

    /**
     * @dev Update listing price
     */
    function updateListingPrice(bytes32 listingId, uint256 newPrice) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");
        require(newPrice > 0, "Price must be > 0");

        listing.price = newPrice;
    }

    // ============ English Auctions ============

    /**
     * @dev Create English auction (highest bidder wins)
     */
    function createEnglishAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 reservePrice,
        uint256 duration
    ) external whenNotPaused returns (bytes32) {
        require(startPrice > 0, "Start price must be > 0");
        require(reservePrice >= startPrice, "Reserve < start price");
        require(
            duration >= MIN_AUCTION_DURATION && duration <= MAX_AUCTION_DURATION,
            "Invalid duration"
        );
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        bytes32 auctionId = keccak256(
            abi.encodePacked(
                nftContract,
                tokenId,
                msg.sender,
                block.timestamp,
                _auctionIdCounter.current()
            )
        );
        _auctionIdCounter.increment();

        englishAuctions[auctionId] = EnglishAuction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startPrice: startPrice,
            reservePrice: reservePrice,
            highestBid: 0,
            highestBidder: address(0),
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            active: true,
            settled: false
        });

        emit EnglishAuctionCreated(
            auctionId,
            msg.sender,
            nftContract,
            tokenId,
            startPrice,
            reservePrice,
            block.timestamp + duration
        );

        return auctionId;
    }

    /**
     * @dev Place bid on English auction
     */
    function placeBid(bytes32 auctionId) external payable nonReentrant {
        EnglishAuction storage auction = englishAuctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value >= auction.startPrice, "Below start price");
        require(msg.value > auction.highestBid, "Bid not high enough");

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            (bool success, ) = payable(auction.highestBidder).call{
                value: auction.highestBid
            }("");
            require(success, "Refund failed");
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        // Extend auction if bid placed in last 10 minutes
        if (auction.endTime - block.timestamp < 10 minutes) {
            auction.endTime = block.timestamp + 10 minutes;
        }

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    /**
     * @dev Settle English auction
     */
    function settleEnglishAuction(bytes32 auctionId) external nonReentrant {
        EnglishAuction storage auction = englishAuctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.settled, "Already settled");

        auction.active = false;
        auction.settled = true;

        // Check if reserve price met
        if (auction.highestBid >= auction.reservePrice) {
            // Process payment
            _processPayment(
                auction.nftContract,
                auction.tokenId,
                auction.seller,
                auction.highestBid
            );

            // Transfer NFT to winner
            IERC721(auction.nftContract).safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                auction.tokenId
            );

            emit AuctionSettled(
                auctionId,
                auction.highestBidder,
                auction.highestBid
            );
        } else {
            // Reserve not met, refund highest bidder
            if (auction.highestBidder != address(0)) {
                (bool success, ) = payable(auction.highestBidder).call{
                    value: auction.highestBid
                }("");
                require(success, "Refund failed");
            }
        }
    }

    // ============ Dutch Auctions ============

    /**
     * @dev Create Dutch auction (price decreases over time)
     */
    function createDutchAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration
    ) external whenNotPaused returns (bytes32) {
        require(startPrice > endPrice, "Start price must > end price");
        require(endPrice > 0, "End price must be > 0");
        require(duration >= 1 hours, "Duration too short");
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        bytes32 auctionId = keccak256(
            abi.encodePacked(
                nftContract,
                tokenId,
                msg.sender,
                block.timestamp,
                _auctionIdCounter.current()
            )
        );
        _auctionIdCounter.increment();

        dutchAuctions[auctionId] = DutchAuction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startPrice: startPrice,
            endPrice: endPrice,
            startTime: block.timestamp,
            duration: duration,
            active: true
        });

        emit DutchAuctionCreated(
            auctionId,
            msg.sender,
            nftContract,
            tokenId,
            startPrice,
            endPrice,
            duration
        );

        return auctionId;
    }

    /**
     * @dev Buy from Dutch auction
     */
    function buyDutchAuction(bytes32 auctionId)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        DutchAuction storage auction = dutchAuctions[auctionId];
        require(auction.active, "Auction not active");

        uint256 currentPrice = getCurrentDutchPrice(auctionId);
        require(msg.value >= currentPrice, "Insufficient payment");

        auction.active = false;

        // Process payment
        _processPayment(
            auction.nftContract,
            auction.tokenId,
            auction.seller,
            currentPrice
        );

        // Transfer NFT
        IERC721(auction.nftContract).safeTransferFrom(
            auction.seller,
            msg.sender,
            auction.tokenId
        );

        // Refund excess
        if (msg.value > currentPrice) {
            (bool success, ) = payable(msg.sender).call{
                value: msg.value - currentPrice
            }("");
            require(success, "Refund failed");
        }

        emit DutchAuctionFilled(auctionId, msg.sender, currentPrice);
    }

    /**
     * @dev Get current Dutch auction price
     */
    function getCurrentDutchPrice(bytes32 auctionId)
        public
        view
        returns (uint256)
    {
        DutchAuction storage auction = dutchAuctions[auctionId];
        require(auction.active, "Auction not active");

        uint256 elapsed = block.timestamp - auction.startTime;

        if (elapsed >= auction.duration) {
            return auction.endPrice;
        }

        uint256 priceRange = auction.startPrice - auction.endPrice;
        uint256 priceDecrease = (priceRange * elapsed) / auction.duration;

        return auction.startPrice - priceDecrease;
    }

    /**
     * @dev Cancel Dutch auction
     */
    function cancelDutchAuction(bytes32 auctionId) external {
        DutchAuction storage auction = dutchAuctions[auctionId];
        require(auction.active, "Auction not active");
        require(auction.seller == msg.sender, "Not seller");

        auction.active = false;
    }

    // ============ Offers ============

    /**
     * @dev Make offer on NFT
     */
    function makeOffer(
        address nftContract,
        uint256 tokenId,
        uint256 expiration
    ) external payable returns (bytes32) {
        require(msg.value > 0, "Offer must be > 0");
        require(expiration > block.timestamp, "Invalid expiration");
        require(
            expiration <= block.timestamp + 30 days,
            "Expiration too far"
        );

        bytes32 offerId = keccak256(
            abi.encodePacked(
                msg.sender,
                nftContract,
                tokenId,
                block.timestamp,
                _offerIdCounter.current()
            )
        );
        _offerIdCounter.increment();

        offers[offerId] = Offer({
            offerer: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: msg.value,
            expiration: expiration,
            active: true
        });

        emit OfferMade(offerId, msg.sender, nftContract, tokenId, msg.value);
        return offerId;
    }

    /**
     * @dev Accept offer
     */
    function acceptOffer(bytes32 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.active, "Offer not active");
        require(block.timestamp <= offer.expiration, "Offer expired");
        require(
            IERC721(offer.nftContract).ownerOf(offer.tokenId) == msg.sender,
            "Not token owner"
        );
        require(
            IERC721(offer.nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(offer.nftContract).getApproved(offer.tokenId) == address(this),
            "Marketplace not approved"
        );

        offer.active = false;

        // Process payment
        _processPayment(
            offer.nftContract,
            offer.tokenId,
            msg.sender,
            offer.amount
        );

        // Transfer NFT
        IERC721(offer.nftContract).safeTransferFrom(
            msg.sender,
            offer.offerer,
            offer.tokenId
        );

        emit OfferAccepted(offerId, msg.sender);
    }

    /**
     * @dev Cancel offer and get refund
     */
    function cancelOffer(bytes32 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.active, "Offer not active");
        require(offer.offerer == msg.sender, "Not offerer");

        offer.active = false;

        (bool success, ) = payable(msg.sender).call{value: offer.amount}("");
        require(success, "Refund failed");

        emit OfferCancelled(offerId);
    }

    // ============ Internal Functions ============

    /**
     * @dev Process payment with royalties and platform fee
     */
    function _processPayment(
        address nftContract,
        uint256 tokenId,
        address seller,
        uint256 amount
    ) internal {
        // Calculate platform fee
        uint256 fee = (amount * platformFee) / 10000;

        // Try to get royalty info
        uint256 royaltyAmount = 0;
        address royaltyRecipient = address(0);

        try IERC2981(nftContract).royaltyInfo(tokenId, amount) returns (
            address receiver,
            uint256 royalty
        ) {
            royaltyAmount = royalty;
            royaltyRecipient = receiver;
        } catch {
            // No royalty
        }

        // Calculate seller proceeds
        uint256 sellerProceeds = amount - fee - royaltyAmount;

        // Transfer to seller
        (bool success1, ) = payable(seller).call{value: sellerProceeds}("");
        require(success1, "Seller payment failed");

        // Transfer platform fee
        (bool success2, ) = payable(feeRecipient).call{value: fee}("");
        require(success2, "Fee payment failed");

        // Transfer royalty
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            (bool success3, ) = payable(royaltyRecipient).call{
                value: royaltyAmount
            }("");
            require(success3, "Royalty payment failed");
        }
    }

    // ============ Admin Functions ============

    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        platformFee = newFee;
    }

    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }

    /**
     * @dev Pause marketplace
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw (only for stuck funds)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
