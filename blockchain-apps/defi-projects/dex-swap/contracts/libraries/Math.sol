// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Math
 * @dev 數學運算庫
 */
library Math {
    /**
     * @dev 計算平方根 (Babylonian method)
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    /**
     * @dev 返回兩個數中較小的一個
     */
    function min(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x < y ? x : y;
    }
}
