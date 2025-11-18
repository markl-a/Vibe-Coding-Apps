// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VibeNFT
 * @dev Enhanced ERC721 NFT with Royalty (ERC2981) support
 * Features:
 * - Automatic royalty support
 * - Pausable minting
 * - Burnable tokens
 * - Max supply limit
 * - Public and whitelist minting
 * - Configurable mint price
 */
contract VibeNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Burnable,
    ERC2981,
    Ownable,
    Pausable,
    ReentrancyGuard
{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Collection configuration
    uint256 public maxSupply;
    uint256 public mintPrice;
    uint256 public maxMintPerAddress;

    // Royalty configuration (basis points: 1000 = 10%)
    uint96 public royaltyBasisPoints;

    // Whitelist
    mapping(address => bool) public whitelist;
    bool public whitelistActive;

    // Minting tracking
    mapping(address => uint256) public mintedPerAddress;

    // Events
    event NFTMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    event RoyaltyUpdated(address indexed receiver, uint96 feeNumerator);
    event WhitelistUpdated(address indexed account, bool status);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    event MintPriceUpdated(uint256 newPrice);

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        uint256 _mintPrice,
        uint96 _royaltyBasisPoints,
        uint256 _maxMintPerAddress
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_maxSupply > 0, "Max supply must be > 0");
        require(_royaltyBasisPoints <= 10000, "Royalty too high");

        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        royaltyBasisPoints = _royaltyBasisPoints;
        maxMintPerAddress = _maxMintPerAddress;

        // Set default royalty
        _setDefaultRoyalty(msg.sender, _royaltyBasisPoints);
    }

    /**
     * @dev Mint new NFT
     * @param to Address to mint to
     * @param uri Token metadata URI
     */
    function mint(address to, string memory uri)
        public
        payable
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(
            mintedPerAddress[to] < maxMintPerAddress || maxMintPerAddress == 0,
            "Max mint per address reached"
        );

        if (whitelistActive) {
            require(whitelist[msg.sender], "Not whitelisted");
        }

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        mintedPerAddress[to]++;

        emit NFTMinted(to, tokenId, uri);

        return tokenId;
    }

    /**
     * @dev Batch mint NFTs (owner only)
     * @param to Address to mint to
     * @param uris Array of metadata URIs
     */
    function batchMint(address to, string[] memory uris)
        public
        onlyOwner
        returns (uint256[] memory)
    {
        require(_tokenIdCounter.current() + uris.length <= maxSupply, "Exceeds max supply");

        uint256[] memory tokenIds = new uint256[](uris.length);

        for (uint256 i = 0; i < uris.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uris[i]);

            tokenIds[i] = tokenId;
            emit NFTMinted(to, tokenId, uris[i]);
        }

        return tokenIds;
    }

    /**
     * @dev Update royalty information
     * @param receiver Royalty receiver address
     * @param feeNumerator Royalty percentage in basis points
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        public
        onlyOwner
    {
        require(feeNumerator <= 10000, "Royalty too high");
        _setDefaultRoyalty(receiver, feeNumerator);
        royaltyBasisPoints = feeNumerator;
        emit RoyaltyUpdated(receiver, feeNumerator);
    }

    /**
     * @dev Set royalty for specific token
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) public onlyOwner {
        require(feeNumerator <= 10000, "Royalty too high");
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev Update whitelist status
     */
    function updateWhitelist(address[] calldata accounts, bool status)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = status;
            emit WhitelistUpdated(accounts[i], status);
        }
    }

    /**
     * @dev Toggle whitelist active status
     */
    function setWhitelistActive(bool active) public onlyOwner {
        whitelistActive = active;
    }

    /**
     * @dev Update max supply (can only decrease)
     */
    function updateMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply < maxSupply, "Can only decrease max supply");
        require(newMaxSupply >= _tokenIdCounter.current(), "Below current supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    /**
     * @dev Update mint price
     */
    function updateMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    /**
     * @dev Update max mint per address
     */
    function updateMaxMintPerAddress(uint256 newMax) public onlyOwner {
        maxMintPerAddress = newMax;
    }

    /**
     * @dev Pause minting
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause minting
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw contract balance
     */
    function withdraw() public onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get total minted supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Check if address can mint
     */
    function canMint(address account) public view returns (bool) {
        if (_tokenIdCounter.current() >= maxSupply) return false;
        if (whitelistActive && !whitelist[account]) return false;
        if (maxMintPerAddress > 0 && mintedPerAddress[account] >= maxMintPerAddress) return false;
        return true;
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
}
