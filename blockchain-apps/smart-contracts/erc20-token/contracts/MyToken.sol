// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev Implementation of a feature-rich ERC20 token with voting, snapshots, and pausable transfers
 *
 * Features:
 * - Standard ERC20 functionality
 * - Burnable tokens
 * - Snapshot capability for historical balance queries
 * - Voting and delegation (ERC20Votes)
 * - Gasless approvals (ERC20Permit)
 * - Pausable transfers
 * - Minting with max supply cap
 */
contract MyToken is
    ERC20,
    ERC20Burnable,
    ERC20Snapshot,
    Ownable,
    Pausable,
    ERC20Permit,
    ERC20Votes
{
    /// @dev Maximum token supply (1 billion tokens)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    /// @dev Emitted when new tokens are minted
    event TokensMinted(address indexed to, uint256 amount);

    /// @dev Emitted when a snapshot is created
    event SnapshotCreated(uint256 indexed snapshotId);

    /**
     * @dev Constructor that gives msg.sender initial supply of tokens
     * Initial supply: 100 million tokens
     */
    constructor()
        ERC20("MyToken", "MTK")
        ERC20Permit("MyToken")
    {
        _mint(msg.sender, 100_000_000 * 10**18);
    }

    /**
     * @dev Mints new tokens to the specified address
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     *
     * Requirements:
     * - Only owner can call this function
     * - Total supply after minting must not exceed MAX_SUPPLY
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "MyToken: Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Creates a new snapshot and returns its id
     * @return The id of the newly created snapshot
     *
     * Requirements:
     * - Only owner can call this function
     */
    function snapshot() public onlyOwner returns (uint256) {
        uint256 snapshotId = _snapshot();
        emit SnapshotCreated(snapshotId);
        return snapshotId;
    }

    /**
     * @dev Pauses all token transfers
     *
     * Requirements:
     * - Only owner can call this function
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers
     *
     * Requirements:
     * - Only owner can call this function
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
