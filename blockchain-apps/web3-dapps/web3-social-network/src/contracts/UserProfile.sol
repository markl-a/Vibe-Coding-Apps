// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UserProfile
 * @dev 用戶資料管理合約 - 存儲用戶基本資料和信譽系統
 */
contract UserProfile is Ownable {

    struct Profile {
        string username;
        string bio;
        string avatarIPFS;      // IPFS 上的頭像
        string ceramicDID;      // Ceramic DID
        uint256 reputation;     // 信譽分數
        uint256 createdAt;
        bool isVerified;        // 是否已驗證
        bool exists;
    }

    // 地址 => 資料
    mapping(address => Profile) public profiles;

    // 用戶名 => 地址（確保用戶名唯一）
    mapping(string => address) public usernameToAddress;

    // 信譽等級名稱
    string[] public reputationLevels = [
        "Newbie",      // 0-100
        "Member",      // 101-500
        "Active",      // 501-1000
        "Trusted",     // 1001-5000
        "Leader",      // 5001-10000
        "Legend"       // 10000+
    ];

    // 徽章系統
    struct Badge {
        string name;
        string description;
        string imageIPFS;
        uint256 requiredReputation;
    }

    Badge[] public badges;
    mapping(address => mapping(uint256 => bool)) public userBadges;

    // 事件
    event ProfileCreated(
        address indexed user,
        string username,
        uint256 timestamp
    );

    event ProfileUpdated(
        address indexed user,
        string username,
        string bio
    );

    event ReputationChanged(
        address indexed user,
        uint256 oldReputation,
        uint256 newReputation
    );

    event UserVerified(address indexed user);

    event BadgeAwarded(
        address indexed user,
        uint256 indexed badgeId,
        string badgeName
    );

    constructor() Ownable(msg.sender) {
        // 初始化一些徽章
        _createBadge("Early Adopter", "Platform early supporter", "", 0);
        _createBadge("Content Creator", "Posted 50+ posts", "", 100);
        _createBadge("Community Leader", "100+ followers", "", 500);
        _createBadge("Influencer", "1000+ followers", "", 2000);
        _createBadge("Philanthropist", "Tipped 100+ times", "", 300);
    }

    /**
     * @dev 創建用戶資料
     * @param username 用戶名
     * @param bio 個人簡介
     * @param avatarIPFS 頭像 IPFS 哈希
     * @param ceramicDID Ceramic DID
     */
    function createProfile(
        string memory username,
        string memory bio,
        string memory avatarIPFS,
        string memory ceramicDID
    ) external {
        require(!profiles[msg.sender].exists, "Profile already exists");
        require(bytes(username).length >= 3, "Username too short");
        require(bytes(username).length <= 20, "Username too long");
        require(usernameToAddress[username] == address(0), "Username taken");

        profiles[msg.sender] = Profile({
            username: username,
            bio: bio,
            avatarIPFS: avatarIPFS,
            ceramicDID: ceramicDID,
            reputation: 0,
            createdAt: block.timestamp,
            isVerified: false,
            exists: true
        });

        usernameToAddress[username] = msg.sender;

        emit ProfileCreated(msg.sender, username, block.timestamp);
    }

    /**
     * @dev 更新用戶資料
     * @param bio 新的個人簡介
     * @param avatarIPFS 新的頭像 IPFS
     */
    function updateProfile(
        string memory bio,
        string memory avatarIPFS
    ) external {
        require(profiles[msg.sender].exists, "Profile does not exist");

        Profile storage profile = profiles[msg.sender];
        profile.bio = bio;
        profile.avatarIPFS = avatarIPFS;

        emit ProfileUpdated(msg.sender, profile.username, bio);
    }

    /**
     * @dev 增加信譽分數
     * @param user 用戶地址
     * @param amount 增加的分數
     */
    function increaseReputation(address user, uint256 amount) external onlyOwner {
        require(profiles[user].exists, "Profile does not exist");

        uint256 oldReputation = profiles[user].reputation;
        profiles[user].reputation += amount;

        emit ReputationChanged(user, oldReputation, profiles[user].reputation);

        // 檢查是否獲得新徽章
        _checkAndAwardBadges(user);
    }

    /**
     * @dev 減少信譽分數
     * @param user 用戶地址
     * @param amount 減少的分數
     */
    function decreaseReputation(address user, uint256 amount) external onlyOwner {
        require(profiles[user].exists, "Profile does not exist");

        uint256 oldReputation = profiles[user].reputation;

        if (profiles[user].reputation >= amount) {
            profiles[user].reputation -= amount;
        } else {
            profiles[user].reputation = 0;
        }

        emit ReputationChanged(user, oldReputation, profiles[user].reputation);
    }

    /**
     * @dev 驗證用戶
     * @param user 用戶地址
     */
    function verifyUser(address user) external onlyOwner {
        require(profiles[user].exists, "Profile does not exist");
        require(!profiles[user].isVerified, "Already verified");

        profiles[user].isVerified = true;

        emit UserVerified(user);
    }

    /**
     * @dev 檢查並授予徽章
     */
    function _checkAndAwardBadges(address user) private {
        uint256 reputation = profiles[user].reputation;

        for (uint256 i = 0; i < badges.length; i++) {
            if (
                reputation >= badges[i].requiredReputation &&
                !userBadges[user][i]
            ) {
                userBadges[user][i] = true;
                emit BadgeAwarded(user, i, badges[i].name);
            }
        }
    }

    /**
     * @dev 創建新徽章（僅管理員）
     */
    function _createBadge(
        string memory name,
        string memory description,
        string memory imageIPFS,
        uint256 requiredReputation
    ) private {
        badges.push(Badge({
            name: name,
            description: description,
            imageIPFS: imageIPFS,
            requiredReputation: requiredReputation
        }));
    }

    /**
     * @dev 添加徽章（對外接口）
     */
    function addBadge(
        string memory name,
        string memory description,
        string memory imageIPFS,
        uint256 requiredReputation
    ) external onlyOwner {
        _createBadge(name, description, imageIPFS, requiredReputation);
    }

    /**
     * @dev 獲取用戶資料
     * @param user 用戶地址
     */
    function getProfile(address user) external view returns (Profile memory) {
        require(profiles[user].exists, "Profile does not exist");
        return profiles[user];
    }

    /**
     * @dev 通過用戶名獲取地址
     * @param username 用戶名
     */
    function getAddressByUsername(string memory username)
        external
        view
        returns (address)
    {
        address userAddress = usernameToAddress[username];
        require(userAddress != address(0), "Username not found");
        return userAddress;
    }

    /**
     * @dev 獲取信譽等級
     * @param user 用戶地址
     */
    function getReputationLevel(address user)
        external
        view
        returns (string memory)
    {
        require(profiles[user].exists, "Profile does not exist");

        uint256 reputation = profiles[user].reputation;

        if (reputation <= 100) return reputationLevels[0];
        if (reputation <= 500) return reputationLevels[1];
        if (reputation <= 1000) return reputationLevels[2];
        if (reputation <= 5000) return reputationLevels[3];
        if (reputation <= 10000) return reputationLevels[4];
        return reputationLevels[5];
    }

    /**
     * @dev 獲取用戶的所有徽章
     * @param user 用戶地址
     */
    function getUserBadges(address user)
        external
        view
        returns (Badge[] memory)
    {
        uint256 badgeCount = 0;

        // 計算徽章數量
        for (uint256 i = 0; i < badges.length; i++) {
            if (userBadges[user][i]) {
                badgeCount++;
            }
        }

        // 創建結果數組
        Badge[] memory userBadgeList = new Badge[](badgeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < badges.length; i++) {
            if (userBadges[user][i]) {
                userBadgeList[index] = badges[i];
                index++;
            }
        }

        return userBadgeList;
    }

    /**
     * @dev 獲取所有徽章
     */
    function getAllBadges() external view returns (Badge[] memory) {
        return badges;
    }

    /**
     * @dev 檢查用戶名是否可用
     * @param username 用戶名
     */
    function isUsernameAvailable(string memory username)
        external
        view
        returns (bool)
    {
        return usernameToAddress[username] == address(0);
    }
}
