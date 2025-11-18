// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TokenStaking
 * @dev Staking contract with rewards and flexible lock periods
 */
contract TokenStaking is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public constant REWARD_RATE = 100; // 100% APY
    uint256 public constant MIN_STAKE = 1e18; // 1 token minimum
    uint256 public constant YEAR = 365 days;

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lockPeriod;
        uint256 rewardDebt;
    }

    mapping(address => Stake[]) public stakes;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Withdrawn(address indexed user, uint256 stakeId, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 reward);

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    function stake(uint256 _amount, uint256 _lockPeriod) external nonReentrant whenNotPaused {
        require(_amount >= MIN_STAKE, "Amount too low");
        require(_lockPeriod == 0 || _lockPeriod == 30 days || _lockPeriod == 90 days || _lockPeriod == 180 days, "Invalid lock period");

        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        stakes[msg.sender].push(Stake({
            amount: _amount,
            timestamp: block.timestamp,
            lockPeriod: _lockPeriod,
            rewardDebt: 0
        }));

        totalStaked += _amount;
        emit Staked(msg.sender, _amount, _lockPeriod);
    }

    function withdraw(uint256 _stakeId) external nonReentrant {
        require(_stakeId < stakes[msg.sender].length, "Invalid stake ID");
        Stake storage userStake = stakes[msg.sender][_stakeId];

        require(block.timestamp >= userStake.timestamp + userStake.lockPeriod, "Still locked");

        uint256 reward = calculateReward(msg.sender, _stakeId);
        uint256 amount = userStake.amount;

        totalStaked -= amount;

        // Remove stake
        stakes[msg.sender][_stakeId] = stakes[msg.sender][stakes[msg.sender].length - 1];
        stakes[msg.sender].pop();

        stakingToken.safeTransfer(msg.sender, amount);
        if (reward > 0) {
            rewardToken.safeTransfer(msg.sender, reward);
        }

        emit Withdrawn(msg.sender, _stakeId, amount, reward);
    }

    function calculateReward(address _user, uint256 _stakeId) public view returns (uint256) {
        Stake storage userStake = stakes[_user][_stakeId];
        uint256 duration = block.timestamp - userStake.timestamp;

        uint256 multiplier = userStake.lockPeriod == 180 days ? 150 :
                            userStake.lockPeriod == 90 days ? 125 :
                            userStake.lockPeriod == 30 days ? 110 : 100;

        return (userStake.amount * REWARD_RATE * multiplier * duration) / (YEAR * 100 * 100) - userStake.rewardDebt;
    }

    function getStakeCount(address _user) external view returns (uint256) {
        return stakes[_user].length;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
