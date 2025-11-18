// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title AToken
 * @dev 生息代幣,代表存款憑證
 */
contract AToken is ERC20 {
    address public immutable UNDERLYING_ASSET;
    address public immutable POOL;

    modifier onlyPool() {
        require(msg.sender == POOL, "Only pool can call");
        _;
    }

    constructor(
        address underlyingAsset,
        string memory name,
        string memory symbol,
        address pool
    ) ERC20(name, symbol) {
        UNDERLYING_ASSET = underlyingAsset;
        POOL = pool;
    }

    function mint(address user, uint256 amount) external onlyPool {
        _mint(user, amount);
    }

    function burn(address user, uint256 amount) external onlyPool {
        _burn(user, amount);
    }
}
