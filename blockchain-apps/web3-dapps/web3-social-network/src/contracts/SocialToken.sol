// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SocialToken
 * @dev 社交網絡的治理和獎勵代幣
 * @notice 支持投票治理、質押獎勵和內容激勵
 */
contract SocialToken is ERC20, ERC20Burnable, ERC20Votes, Ownable, Pausable {

    // 代幣分配
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 10億代幣

    // 獎勵池
    uint256 public rewardPool;

    // 質押系統
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }

    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    uint256 public rewardPerSecond = 1 * 10**18; // 每秒獎勵

    // 內容獎勵
    mapping(address => uint256) public contentRewards;

    // 事件
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event ContentRewarded(address indexed creator, uint256 amount);
    event RewardPoolRefilled(uint256 amount);

    constructor()
        ERC20("Social Network Token", "SOCIAL")
        ERC20Permit("Social Network Token")
        Ownable(msg.sender)
    {
        // 初始分配
        _mint(msg.sender, TOTAL_SUPPLY * 20 / 100);        // 20% 團隊
        _mint(address(this), TOTAL_SUPPLY * 40 / 100);     // 40% 獎勵池
        // 40% 用於公開發售、流動性等（可由 owner 分配）

        rewardPool = TOTAL_SUPPLY * 40 / 100;
    }

    /**
     * @dev 質押代幣
     * @param amount 質押數量
     */
    function stake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // 先領取之前的獎勵
        if (stakes[msg.sender].amount > 0) {
            _claimReward();
        }

        // 轉移代幣到合約
        _transfer(msg.sender, address(this), amount);

        // 更新質押信息
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev 解除質押
     * @param amount 解除質押數量
     */
    function unstake(uint256 amount) external {
        require(amount > 0, "Cannot unstake 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");

        // 先領取獎勵
        _claimReward();

        // 更新質押信息
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;

        // 轉回代幣
        _transfer(address(this), msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev 領取質押獎勵
     */
    function claimReward() external {
        _claimReward();
    }

    /**
     * @dev 內部領取獎勵函數
     */
    function _claimReward() private {
        uint256 reward = calculateReward(msg.sender);

        if (reward > 0 && reward <= rewardPool) {
            stakes[msg.sender].timestamp = block.timestamp;
            rewardPool -= reward;

            _transfer(address(this), msg.sender, reward);

            emit RewardClaimed(msg.sender, reward);
        }
    }

    /**
     * @dev 計算待領取獎勵
     * @param user 用戶地址
     */
    function calculateReward(address user) public view returns (uint256) {
        if (stakes[user].amount == 0 || totalStaked == 0) {
            return 0;
        }

        uint256 timeStaked = block.timestamp - stakes[user].timestamp;
        uint256 userShare = (stakes[user].amount * 10**18) / totalStaked;
        uint256 reward = (timeStaked * rewardPerSecond * userShare) / 10**18;

        return reward;
    }

    /**
     * @dev 獎勵內容創作者（僅 owner 可調用）
     * @param creator 創作者地址
     * @param amount 獎勵數量
     */
    function rewardCreator(address creator, uint256 amount) external onlyOwner {
        require(amount <= rewardPool, "Insufficient reward pool");

        rewardPool -= amount;
        contentRewards[creator] += amount;

        _transfer(address(this), creator, amount);

        emit ContentRewarded(creator, amount);
    }

    /**
     * @dev 批量獎勵創作者
     * @param creators 創作者地址數組
     * @param amounts 獎勵數量數組
     */
    function batchRewardCreators(
        address[] calldata creators,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(creators.length == amounts.length, "Array length mismatch");

        for (uint256 i = 0; i < creators.length; i++) {
            require(amounts[i] <= rewardPool, "Insufficient reward pool");

            rewardPool -= amounts[i];
            contentRewards[creators[i]] += amounts[i];

            _transfer(address(this), creators[i], amounts[i]);

            emit ContentRewarded(creators[i], amounts[i]);
        }
    }

    /**
     * @dev 補充獎勵池
     * @param amount 補充數量
     */
    function refillRewardPool(uint256 amount) external onlyOwner {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _transfer(msg.sender, address(this), amount);
        rewardPool += amount;

        emit RewardPoolRefilled(amount);
    }

    /**
     * @dev 更新每秒獎勵率
     * @param newRate 新的獎勵率
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardPerSecond = newRate;
    }

    /**
     * @dev 暫停合約
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢復合約
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 獲取用戶質押信息
     * @param user 用戶地址
     */
    function getStakeInfo(address user)
        external
        view
        returns (uint256 amount, uint256 timestamp, uint256 pendingReward)
    {
        return (
            stakes[user].amount,
            stakes[user].timestamp,
            calculateReward(user)
        );
    }

    /**
     * @dev 獲取年化收益率 (APY)
     */
    function getAPY() external view returns (uint256) {
        if (totalStaked == 0) return 0;

        uint256 yearlyReward = rewardPerSecond * 365 days;
        return (yearlyReward * 100 * 10**18) / totalStaked;
    }

    // 重寫必要的函數
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
