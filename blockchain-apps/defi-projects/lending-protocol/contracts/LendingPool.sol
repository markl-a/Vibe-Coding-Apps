// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AToken.sol";

/**
 * @title LendingPool
 * @dev 去中心化借貸協議主合約
 * 功能: 存款、借款、還款、清算
 */
contract LendingPool is ReentrancyGuard, Ownable {
    struct ReserveData {
        uint256 ltv;                    // 貸款價值比 (basis points)
        uint256 liquidationThreshold;    // 清算閾值
        uint256 liquidationBonus;        // 清算獎勵
        address aTokenAddress;           // aToken 地址
        uint256 totalDeposits;           // 總存款
        uint256 totalBorrows;            // 總借款
        uint256 borrowRate;              // 借款利率
        uint256 depositRate;             // 存款利率
        uint256 lastUpdateTimestamp;     // 最後更新時間
        bool isActive;                   // 是否啟用
    }

    struct UserData {
        uint256 deposited;
        uint256 borrowed;
    }

    // 資產地址 => ReserveData
    mapping(address => ReserveData) public reserves;
    // 用戶 => 資產 => UserData
    mapping(address => mapping(address => UserData)) public userData;
    // 支持的資產列表
    address[] public reservesList;
    // 價格預言機 (簡化版,實際應使用 Chainlink)
    mapping(address => uint256) public assetPrices;

    uint256 public constant PRECISION = 1e18;
    uint256 public constant LIQUIDATION_CLOSE_FACTOR = 5000; // 50%

    event Deposit(address indexed user, address indexed asset, uint256 amount);
    event Withdraw(address indexed user, address indexed asset, uint256 amount);
    event Borrow(address indexed user, address indexed asset, uint256 amount);
    event Repay(address indexed user, address indexed asset, uint256 amount);
    event Liquidation(
        address indexed liquidator,
        address indexed user,
        address indexed collateralAsset,
        address debtAsset,
        uint256 debtAmount,
        uint256 collateralAmount
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev 初始化資產儲備
     */
    function initReserve(
        address asset,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        string memory aTokenName,
        string memory aTokenSymbol
    ) external onlyOwner {
        require(!reserves[asset].isActive, "Reserve already initialized");

        // 部署 aToken
        AToken aToken = new AToken(asset, aTokenName, aTokenSymbol, address(this));

        reserves[asset] = ReserveData({
            ltv: ltv,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus,
            aTokenAddress: address(aToken),
            totalDeposits: 0,
            totalBorrows: 0,
            borrowRate: 0,
            depositRate: 0,
            lastUpdateTimestamp: block.timestamp,
            isActive: true
        });

        reservesList.push(asset);
    }

    /**
     * @dev 存款
     */
    function deposit(address asset, uint256 amount) external nonReentrant {
        require(reserves[asset].isActive, "Reserve not active");
        require(amount > 0, "Amount must be > 0");

        ReserveData storage reserve = reserves[asset];
        _updateInterestRates(asset);

        // 轉移代幣
        IERC20(asset).transferFrom(msg.sender, address(this), amount);

        // 鑄造 aToken
        AToken(reserve.aTokenAddress).mint(msg.sender, amount);

        // 更新狀態
        reserve.totalDeposits += amount;
        userData[msg.sender][asset].deposited += amount;

        emit Deposit(msg.sender, asset, amount);
    }

    /**
     * @dev 提款
     */
    function withdraw(address asset, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        ReserveData storage reserve = reserves[asset];
        UserData storage user = userData[msg.sender][asset];

        require(user.deposited >= amount, "Insufficient balance");
        _updateInterestRates(asset);

        // 檢查健康係數
        uint256 newHealthFactor = _calculateHealthFactorAfterWithdraw(msg.sender, asset, amount);
        require(newHealthFactor >= PRECISION, "Health factor too low");

        // 燒毀 aToken
        AToken(reserve.aTokenAddress).burn(msg.sender, amount);

        // 轉移代幣
        IERC20(asset).transfer(msg.sender, amount);

        // 更新狀態
        reserve.totalDeposits -= amount;
        user.deposited -= amount;

        emit Withdraw(msg.sender, asset, amount);
    }

    /**
     * @dev 借款
     */
    function borrow(address asset, uint256 amount) external nonReentrant {
        require(reserves[asset].isActive, "Reserve not active");
        require(amount > 0, "Amount must be > 0");

        ReserveData storage reserve = reserves[asset];
        require(reserve.totalDeposits >= reserve.totalBorrows + amount, "Insufficient liquidity");

        _updateInterestRates(asset);

        // 檢查借款能力
        require(_checkBorrowingPower(msg.sender, asset, amount), "Insufficient collateral");

        // 轉移代幣
        IERC20(asset).transfer(msg.sender, amount);

        // 更新狀態
        reserve.totalBorrows += amount;
        userData[msg.sender][asset].borrowed += amount;

        emit Borrow(msg.sender, asset, amount);
    }

    /**
     * @dev 還款
     */
    function repay(address asset, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        ReserveData storage reserve = reserves[asset];
        UserData storage user = userData[msg.sender][asset];

        uint256 repayAmount = amount > user.borrowed ? user.borrowed : amount;
        require(repayAmount > 0, "No debt to repay");

        _updateInterestRates(asset);

        // 轉移代幣
        IERC20(asset).transferFrom(msg.sender, address(this), repayAmount);

        // 更新狀態
        reserve.totalBorrows -= repayAmount;
        user.borrowed -= repayAmount;

        emit Repay(msg.sender, asset, repayAmount);
    }

    /**
     * @dev 清算
     */
    function liquidate(
        address user,
        address collateralAsset,
        address debtAsset,
        uint256 debtToCover
    ) external nonReentrant {
        require(getHealthFactor(user) < PRECISION, "Health factor OK");

        UserData storage debtData = userData[user][debtAsset];
        require(debtData.borrowed >= debtToCover, "Invalid debt amount");

        // 計算清算獎勵
        uint256 collateralPrice = assetPrices[collateralAsset];
        uint256 debtPrice = assetPrices[debtAsset];
        uint256 liquidationBonus = reserves[collateralAsset].liquidationBonus;

        uint256 collateralAmount = (debtToCover * debtPrice * (10000 + liquidationBonus)) /
            (collateralPrice * 10000);

        UserData storage collateralData = userData[user][collateralAsset];
        require(collateralData.deposited >= collateralAmount, "Insufficient collateral");

        // 轉移債務
        IERC20(debtAsset).transferFrom(msg.sender, address(this), debtToCover);

        // 轉移抵押品
        AToken(reserves[collateralAsset].aTokenAddress).transferFrom(
            user,
            msg.sender,
            collateralAmount
        );

        // 更新狀態
        debtData.borrowed -= debtToCover;
        collateralData.deposited -= collateralAmount;
        reserves[debtAsset].totalBorrows -= debtToCover;

        emit Liquidation(
            msg.sender,
            user,
            collateralAsset,
            debtAsset,
            debtToCover,
            collateralAmount
        );
    }

    /**
     * @dev 獲取用戶健康係數
     */
    function getHealthFactor(address user) public view returns (uint256) {
        uint256 totalCollateralETH;
        uint256 totalDebtETH;

        for (uint256 i = 0; i < reservesList.length; i++) {
            address asset = reservesList[i];
            UserData memory data = userData[user][asset];
            uint256 price = assetPrices[asset];

            if (data.deposited > 0) {
                uint256 ltv = reserves[asset].liquidationThreshold;
                totalCollateralETH += (data.deposited * price * ltv) / (PRECISION * 10000);
            }

            if (data.borrowed > 0) {
                totalDebtETH += (data.borrowed * price) / PRECISION;
            }
        }

        if (totalDebtETH == 0) return type(uint256).max;
        return (totalCollateralETH * PRECISION) / totalDebtETH;
    }

    /**
     * @dev 設置資產價格 (測試用,實際應使用 Chainlink)
     */
    function setAssetPrice(address asset, uint256 price) external onlyOwner {
        assetPrices[asset] = price;
    }

    function _updateInterestRates(address asset) internal {
        ReserveData storage reserve = reserves[asset];
        uint256 utilization = _getUtilizationRate(asset);

        // 簡化的利率模型
        reserve.borrowRate = _calculateBorrowRate(utilization);
        reserve.depositRate = (reserve.borrowRate * utilization) / PRECISION;
        reserve.lastUpdateTimestamp = block.timestamp;
    }

    function _getUtilizationRate(address asset) internal view returns (uint256) {
        ReserveData memory reserve = reserves[asset];
        if (reserve.totalDeposits == 0) return 0;
        return (reserve.totalBorrows * PRECISION) / reserve.totalDeposits;
    }

    function _calculateBorrowRate(uint256 utilization) internal pure returns (uint256) {
        uint256 optimalRate = 80 * PRECISION / 100; // 80%

        if (utilization <= optimalRate) {
            return (5 * PRECISION / 100 * utilization) / optimalRate; // 0-5%
        } else {
            return 5 * PRECISION / 100 +
                ((utilization - optimalRate) * 45 * PRECISION / 100) /
                (PRECISION - optimalRate); // 5-50%
        }
    }

    function _checkBorrowingPower(address user, address asset, uint256 amount)
        internal
        view
        returns (bool)
    {
        uint256 totalCollateralETH;
        uint256 totalDebtETH;

        for (uint256 i = 0; i < reservesList.length; i++) {
            address currentAsset = reservesList[i];
            UserData memory data = userData[user][currentAsset];
            uint256 price = assetPrices[currentAsset];

            if (data.deposited > 0) {
                uint256 ltv = reserves[currentAsset].ltv;
                totalCollateralETH += (data.deposited * price * ltv) / (PRECISION * 10000);
            }

            if (data.borrowed > 0) {
                totalDebtETH += (data.borrowed * price) / PRECISION;
            }
        }

        // 加上新的借款
        uint256 newDebtETH = totalDebtETH + (amount * assetPrices[asset]) / PRECISION;

        return totalCollateralETH >= newDebtETH;
    }

    function _calculateHealthFactorAfterWithdraw(address user, address asset, uint256 amount)
        internal
        view
        returns (uint256)
    {
        uint256 totalCollateralETH;
        uint256 totalDebtETH;

        for (uint256 i = 0; i < reservesList.length; i++) {
            address currentAsset = reservesList[i];
            UserData memory data = userData[user][currentAsset];
            uint256 price = assetPrices[currentAsset];

            uint256 deposited = data.deposited;
            if (currentAsset == asset) {
                deposited = deposited > amount ? deposited - amount : 0;
            }

            if (deposited > 0) {
                uint256 ltv = reserves[currentAsset].liquidationThreshold;
                totalCollateralETH += (deposited * price * ltv) / (PRECISION * 10000);
            }

            if (data.borrowed > 0) {
                totalDebtETH += (data.borrowed * price) / PRECISION;
            }
        }

        if (totalDebtETH == 0) return type(uint256).max;
        return (totalCollateralETH * PRECISION) / totalDebtETH;
    }
}
