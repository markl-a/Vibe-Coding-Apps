// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title MyNFT
 * @dev Advanced ERC721 NFT implementation with multiple features
 *
 * Features:
 * - ERC721 standard with enumeration and URI storage
 * - ERC2981 royalty standard
 * - Whitelist minting with Merkle proof
 * - Public minting with price
 * - Batch minting capability
 * - Pausable transfers
 * - Burnable tokens
 * - Royalty payments
 * - Reveal mechanism
 */
contract MyNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    ERC721Burnable,
    ERC2981,
    Ownable,
    Pausable,
    ReentrancyGuard
{
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // ============ State Variables ============

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_PER_WALLET = 5;
    uint256 public constant WHITELIST_PRICE = 0.05 ether;
    uint256 public constant PUBLIC_PRICE = 0.08 ether;

    bool public whitelistMintEnabled = false;
    bool public publicMintEnabled = false;
    bool public revealed = false;

    bytes32 public merkleRoot;
    string public baseTokenURI;
    string public notRevealedURI;

    mapping(address => uint256) public mintedPerWallet;

    // ============ Events ============

    event Minted(address indexed to, uint256 indexed tokenId);
    event BatchMinted(address indexed to, uint256 quantity);
    event WhitelistMintToggled(bool enabled);
    event PublicMintToggled(bool enabled);
    event Revealed();
    event BaseURIUpdated(string newBaseURI);
    event MerkleRootUpdated(bytes32 newRoot);

    // ============ Errors ============

    error ExceedsMaxSupply();
    error ExceedsMaxPerWallet();
    error InsufficientPayment();
    error WhitelistMintNotActive();
    error PublicMintNotActive();
    error InvalidProof();
    error WithdrawalFailed();
    error InvalidQuantity();

    // ============ Constructor ============

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _initNotRevealedURI
    ) ERC721(_name, _symbol) {
        baseTokenURI = _initBaseURI;
        notRevealedURI = _initNotRevealedURI;

        // Set default royalty to 5% (500 basis points)
        _setDefaultRoyalty(msg.sender, 500);
    }

    // ============ Minting Functions ============

    /**
     * @dev Whitelist mint with Merkle proof
     * @param quantity Number of tokens to mint
     * @param merkleProof Merkle proof for whitelist verification
     */
    function whitelistMint(uint256 quantity, bytes32[] calldata merkleProof)
        external
        payable
        nonReentrant
    {
        if (!whitelistMintEnabled) revert WhitelistMintNotActive();
        if (quantity == 0) revert InvalidQuantity();
        if (_tokenIdCounter.current() + quantity > MAX_SUPPLY) revert ExceedsMaxSupply();
        if (mintedPerWallet[msg.sender] + quantity > MAX_PER_WALLET) revert ExceedsMaxPerWallet();
        if (msg.value < WHITELIST_PRICE * quantity) revert InsufficientPayment();

        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) revert InvalidProof();

        mintedPerWallet[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            _safeMintToken(msg.sender);
        }

        emit BatchMinted(msg.sender, quantity);
    }

    /**
     * @dev Public mint function
     * @param quantity Number of tokens to mint
     */
    function publicMint(uint256 quantity)
        external
        payable
        nonReentrant
    {
        if (!publicMintEnabled) revert PublicMintNotActive();
        if (quantity == 0) revert InvalidQuantity();
        if (_tokenIdCounter.current() + quantity > MAX_SUPPLY) revert ExceedsMaxSupply();
        if (mintedPerWallet[msg.sender] + quantity > MAX_PER_WALLET) revert ExceedsMaxPerWallet();
        if (msg.value < PUBLIC_PRICE * quantity) revert InsufficientPayment();

        mintedPerWallet[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            _safeMintToken(msg.sender);
        }

        emit BatchMinted(msg.sender, quantity);
    }

    /**
     * @dev Owner can mint tokens for free
     * @param to Address to mint to
     * @param quantity Number of tokens to mint
     */
    function ownerMint(address to, uint256 quantity)
        external
        onlyOwner
    {
        if (quantity == 0) revert InvalidQuantity();
        if (_tokenIdCounter.current() + quantity > MAX_SUPPLY) revert ExceedsMaxSupply();

        for (uint256 i = 0; i < quantity; i++) {
            _safeMintToken(to);
        }

        emit BatchMinted(to, quantity);
    }

    /**
     * @dev Internal minting function
     */
    function _safeMintToken(address to) private {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        emit Minted(to, tokenId);
    }

    // ============ Admin Functions ============

    /**
     * @dev Toggle whitelist minting
     */
    function toggleWhitelistMint() external onlyOwner {
        whitelistMintEnabled = !whitelistMintEnabled;
        emit WhitelistMintToggled(whitelistMintEnabled);
    }

    /**
     * @dev Toggle public minting
     */
    function togglePublicMint() external onlyOwner {
        publicMintEnabled = !publicMintEnabled;
        emit PublicMintToggled(publicMintEnabled);
    }

    /**
     * @dev Set Merkle root for whitelist
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }

    /**
     * @dev Reveal the NFTs
     */
    function reveal() external onlyOwner {
        revealed = true;
        emit Revealed();
    }

    /**
     * @dev Set base URI
     */
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseTokenURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    /**
     * @dev Set not revealed URI
     */
    function setNotRevealedURI(string memory _notRevealedURI) external onlyOwner {
        notRevealedURI = _notRevealedURI;
    }

    /**
     * @dev Set default royalty
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @dev Set token-specific royalty
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev Pause transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert WithdrawalFailed();
    }

    // ============ View Functions ============

    /**
     * @dev Get current token ID
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Get tokens owned by an address
     */
    function tokensOfOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    // ============ Overrides ============

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(_exists(tokenId), "Token does not exist");

        if (!revealed) {
            return notRevealedURI;
        }

        return super.tokenURI(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
