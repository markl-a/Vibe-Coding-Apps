// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SocialPost.sol";

/**
 * @title TipJar
 * @dev 打賞系統合約 - 支持 ETH 和 ERC20 代幣打賞
 */
contract TipJar is Ownable, ReentrancyGuard {

    SocialPost public socialPost;

    // 平台手續費（基點，100 = 1%）
    uint256 public platformFee = 250; // 2.5%
    uint256 public constant MAX_FEE = 1000; // 最大 10%

    // 累積的平台手續費
    uint256 public accumulatedFees;
    mapping(address => uint256) public accumulatedTokenFees;

    // 打賞記錄
    struct Tip {
        address tipper;
        address recipient;
        uint256 postId;
        uint256 amount;
        address token; // address(0) 表示 ETH
        uint256 timestamp;
    }

    // 用戶收到的打賞
    mapping(address => Tip[]) public userTips;

    // 貼文收到的打賞
    mapping(uint256 => Tip[]) public postTips;

    // 支持的 ERC20 代幣
    mapping(address => bool) public supportedTokens;

    // 事件
    event TipSent(
        address indexed tipper,
        address indexed recipient,
        uint256 indexed postId,
        uint256 amount,
        address token
    );

    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event FeeUpdated(uint256 newFee);
    event FeesWithdrawn(address indexed token, uint256 amount);

    constructor(address _socialPostAddress) Ownable(msg.sender) {
        socialPost = SocialPost(_socialPostAddress);
    }

    /**
     * @dev 使用 ETH 打賞
     * @param postId 貼文 ID
     * @param recipient 接收者地址
     */
    function tipWithETH(uint256 postId, address recipient)
        external
        payable
        nonReentrant
    {
        require(msg.value > 0, "Tip amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");

        // 計算手續費
        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 netAmount = msg.value - fee;

        // 轉賬給接收者
        (bool success, ) = recipient.call{value: netAmount}("");
        require(success, "Transfer failed");

        // 累積手續費
        accumulatedFees += fee;

        // 記錄打賞
        Tip memory newTip = Tip({
            tipper: msg.sender,
            recipient: recipient,
            postId: postId,
            amount: msg.value,
            token: address(0),
            timestamp: block.timestamp
        });

        userTips[recipient].push(newTip);
        postTips[postId].push(newTip);

        // 更新貼文的打賞總額
        socialPost.recordTip(postId, msg.value);

        emit TipSent(msg.sender, recipient, postId, msg.value, address(0));
    }

    /**
     * @dev 使用 ERC20 代幣打賞
     * @param postId 貼文 ID
     * @param recipient 接收者地址
     * @param token 代幣地址
     * @param amount 打賞金額
     */
    function tipWithToken(
        uint256 postId,
        address recipient,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(amount > 0, "Tip amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        require(supportedTokens[token], "Token not supported");

        IERC20 erc20Token = IERC20(token);

        // 檢查授權
        require(
            erc20Token.allowance(msg.sender, address(this)) >= amount,
            "Insufficient allowance"
        );

        // 計算手續費
        uint256 fee = (amount * platformFee) / 10000;
        uint256 netAmount = amount - fee;

        // 轉移代幣給接收者
        require(
            erc20Token.transferFrom(msg.sender, recipient, netAmount),
            "Transfer to recipient failed"
        );

        // 轉移手續費到合約
        require(
            erc20Token.transferFrom(msg.sender, address(this), fee),
            "Fee transfer failed"
        );

        // 累積手續費
        accumulatedTokenFees[token] += fee;

        // 記錄打賞
        Tip memory newTip = Tip({
            tipper: msg.sender,
            recipient: recipient,
            postId: postId,
            amount: amount,
            token: token,
            timestamp: block.timestamp
        });

        userTips[recipient].push(newTip);
        postTips[postId].push(newTip);

        // 更新貼文的打賞總額
        socialPost.recordTip(postId, amount);

        emit TipSent(msg.sender, recipient, postId, amount, token);
    }

    /**
     * @dev 批量打賞（節省 gas）
     * @param postIds 貼文 ID 數組
     * @param recipients 接收者地址數組
     * @param amounts 打賞金額數組
     */
    function batchTipWithETH(
        uint256[] calldata postIds,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable nonReentrant {
        require(
            postIds.length == recipients.length &&
            recipients.length == amounts.length,
            "Array length mismatch"
        );

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(msg.value == totalAmount, "Incorrect total amount");

        for (uint256 i = 0; i < postIds.length; i++) {
            _tipETH(postIds[i], recipients[i], amounts[i]);
        }
    }

    /**
     * @dev 內部 ETH 打賞函數
     */
    function _tipETH(uint256 postId, address recipient, uint256 amount) private {
        require(amount > 0, "Tip amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");

        uint256 fee = (amount * platformFee) / 10000;
        uint256 netAmount = amount - fee;

        (bool success, ) = recipient.call{value: netAmount}("");
        require(success, "Transfer failed");

        accumulatedFees += fee;

        Tip memory newTip = Tip({
            tipper: msg.sender,
            recipient: recipient,
            postId: postId,
            amount: amount,
            token: address(0),
            timestamp: block.timestamp
        });

        userTips[recipient].push(newTip);
        postTips[postId].push(newTip);

        socialPost.recordTip(postId, amount);

        emit TipSent(msg.sender, recipient, postId, amount, address(0));
    }

    /**
     * @dev 添加支持的代幣
     * @param token 代幣地址
     */
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!supportedTokens[token], "Token already supported");

        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    /**
     * @dev 移除支持的代幣
     * @param token 代幣地址
     */
    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");

        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    /**
     * @dev 更新平台手續費
     * @param newFee 新的手續費率（基點）
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        platformFee = newFee;
        emit FeeUpdated(newFee);
    }

    /**
     * @dev 提取累積的 ETH 手續費
     */
    function withdrawETHFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");

        accumulatedFees = 0;

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FeesWithdrawn(address(0), amount);
    }

    /**
     * @dev 提取累積的代幣手續費
     * @param token 代幣地址
     */
    function withdrawTokenFees(address token) external onlyOwner nonReentrant {
        uint256 amount = accumulatedTokenFees[token];
        require(amount > 0, "No fees to withdraw");

        accumulatedTokenFees[token] = 0;

        IERC20 erc20Token = IERC20(token);
        require(
            erc20Token.transfer(owner(), amount),
            "Withdrawal failed"
        );

        emit FeesWithdrawn(token, amount);
    }

    /**
     * @dev 獲取用戶收到的打賞
     * @param user 用戶地址
     */
    function getUserTips(address user) external view returns (Tip[] memory) {
        return userTips[user];
    }

    /**
     * @dev 獲取貼文收到的打賞
     * @param postId 貼文 ID
     */
    function getPostTips(uint256 postId) external view returns (Tip[] memory) {
        return postTips[postId];
    }

    /**
     * @dev 獲取用戶收到的總打賞（ETH）
     * @param user 用戶地址
     */
    function getTotalETHTips(address user) external view returns (uint256) {
        Tip[] memory tips = userTips[user];
        uint256 total = 0;

        for (uint256 i = 0; i < tips.length; i++) {
            if (tips[i].token == address(0)) {
                total += tips[i].amount;
            }
        }

        return total;
    }

    /**
     * @dev 獲取用戶收到的總打賞（特定代幣）
     * @param user 用戶地址
     * @param token 代幣地址
     */
    function getTotalTokenTips(address user, address token)
        external
        view
        returns (uint256)
    {
        Tip[] memory tips = userTips[user];
        uint256 total = 0;

        for (uint256 i = 0; i < tips.length; i++) {
            if (tips[i].token == token) {
                total += tips[i].amount;
            }
        }

        return total;
    }

    // 接收 ETH
    receive() external payable {}
}
