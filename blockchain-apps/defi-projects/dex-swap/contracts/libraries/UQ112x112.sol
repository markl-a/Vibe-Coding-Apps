// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UQ112x112
 * @dev 定點數庫 (112x112 位)，用於價格計算
 */
library UQ112x112 {
    uint224 constant Q112 = 2**112;

    /**
     * @dev 編碼 uint112 為 UQ112x112
     */
    function encode(uint112 y) internal pure returns (uint224 z) {
        z = uint224(y) * Q112;
    }

    /**
     * @dev UQ112x112 除法
     */
    function uqdiv(uint224 x, uint112 y) internal pure returns (uint224 z) {
        z = x / uint224(y);
    }
}
