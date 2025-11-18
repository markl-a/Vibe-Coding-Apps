// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SocialPost
 * @dev 去中心化社交網絡的貼文管理合約
 * @notice 支持創建、點讚、評論等社交功能
 */
contract SocialPost is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _postIds;

    struct Post {
        uint256 id;
        address author;
        string ipfsHash;        // IPFS 內容哈希
        string[] tags;          // AI 生成的標籤
        uint256 timestamp;
        uint256 likes;
        uint256 tips;          // 收到的打賞總額
        bool isNFT;            // 是否已鑄造為 NFT
        bool isDeleted;
    }

    struct Comment {
        uint256 id;
        uint256 postId;
        address author;
        string content;
        uint256 timestamp;
    }

    // 貼文存儲
    mapping(uint256 => Post) public posts;

    // 用戶的貼文列表
    mapping(address => uint256[]) public userPosts;

    // 點讚記錄
    mapping(uint256 => mapping(address => bool)) public hasLiked;

    // 評論
    mapping(uint256 => Comment[]) public postComments;
    Counters.Counter private _commentIds;

    // 關注系統
    mapping(address => mapping(address => bool)) public isFollowing;
    mapping(address => address[]) public followers;
    mapping(address => address[]) public following;

    // 事件
    event PostCreated(
        uint256 indexed postId,
        address indexed author,
        string ipfsHash,
        string[] tags,
        uint256 timestamp
    );

    event PostLiked(
        uint256 indexed postId,
        address indexed liker,
        uint256 totalLikes
    );

    event PostUnliked(
        uint256 indexed postId,
        address indexed unliker,
        uint256 totalLikes
    );

    event CommentAdded(
        uint256 indexed postId,
        uint256 indexed commentId,
        address indexed author,
        string content
    );

    event PostDeleted(uint256 indexed postId, address indexed author);

    event UserFollowed(address indexed follower, address indexed following);
    event UserUnfollowed(address indexed follower, address indexed unfollowing);

    event TipReceived(
        uint256 indexed postId,
        address indexed tipper,
        uint256 amount
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev 創建新貼文
     * @param ipfsHash IPFS 內容哈希
     * @param tags AI 生成的標籤
     */
    function createPost(
        string memory ipfsHash,
        string[] memory tags
    ) external returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");

        _postIds.increment();
        uint256 newPostId = _postIds.current();

        Post storage newPost = posts[newPostId];
        newPost.id = newPostId;
        newPost.author = msg.sender;
        newPost.ipfsHash = ipfsHash;
        newPost.tags = tags;
        newPost.timestamp = block.timestamp;
        newPost.likes = 0;
        newPost.tips = 0;
        newPost.isNFT = false;
        newPost.isDeleted = false;

        userPosts[msg.sender].push(newPostId);

        emit PostCreated(newPostId, msg.sender, ipfsHash, tags, block.timestamp);

        return newPostId;
    }

    /**
     * @dev 點讚貼文
     * @param postId 貼文 ID
     */
    function likePost(uint256 postId) external {
        require(postId > 0 && postId <= _postIds.current(), "Invalid post ID");
        require(!posts[postId].isDeleted, "Post has been deleted");
        require(!hasLiked[postId][msg.sender], "Already liked");

        posts[postId].likes++;
        hasLiked[postId][msg.sender] = true;

        emit PostLiked(postId, msg.sender, posts[postId].likes);
    }

    /**
     * @dev 取消點讚
     * @param postId 貼文 ID
     */
    function unlikePost(uint256 postId) external {
        require(postId > 0 && postId <= _postIds.current(), "Invalid post ID");
        require(hasLiked[postId][msg.sender], "Not liked yet");

        posts[postId].likes--;
        hasLiked[postId][msg.sender] = false;

        emit PostUnliked(postId, msg.sender, posts[postId].likes);
    }

    /**
     * @dev 添加評論
     * @param postId 貼文 ID
     * @param content 評論內容
     */
    function addComment(uint256 postId, string memory content) external {
        require(postId > 0 && postId <= _postIds.current(), "Invalid post ID");
        require(!posts[postId].isDeleted, "Post has been deleted");
        require(bytes(content).length > 0, "Comment cannot be empty");

        _commentIds.increment();
        uint256 commentId = _commentIds.current();

        Comment memory newComment = Comment({
            id: commentId,
            postId: postId,
            author: msg.sender,
            content: content,
            timestamp: block.timestamp
        });

        postComments[postId].push(newComment);

        emit CommentAdded(postId, commentId, msg.sender, content);
    }

    /**
     * @dev 刪除貼文（僅作者可刪除）
     * @param postId 貼文 ID
     */
    function deletePost(uint256 postId) external {
        require(postId > 0 && postId <= _postIds.current(), "Invalid post ID");
        require(posts[postId].author == msg.sender, "Not the author");
        require(!posts[postId].isDeleted, "Already deleted");

        posts[postId].isDeleted = true;

        emit PostDeleted(postId, msg.sender);
    }

    /**
     * @dev 關注用戶
     * @param user 要關注的用戶地址
     */
    function followUser(address user) external {
        require(user != msg.sender, "Cannot follow yourself");
        require(!isFollowing[msg.sender][user], "Already following");

        isFollowing[msg.sender][user] = true;
        followers[user].push(msg.sender);
        following[msg.sender].push(user);

        emit UserFollowed(msg.sender, user);
    }

    /**
     * @dev 取消關注
     * @param user 要取消關注的用戶地址
     */
    function unfollowUser(address user) external {
        require(isFollowing[msg.sender][user], "Not following");

        isFollowing[msg.sender][user] = false;

        // 從數組中移除
        _removeFromArray(followers[user], msg.sender);
        _removeFromArray(following[msg.sender], user);

        emit UserUnfollowed(msg.sender, user);
    }

    /**
     * @dev 記錄打賞（由 TipJar 合約調用）
     * @param postId 貼文 ID
     * @param amount 打賞金額
     */
    function recordTip(uint256 postId, uint256 amount) external {
        require(postId > 0 && postId <= _postIds.current(), "Invalid post ID");
        require(!posts[postId].isDeleted, "Post has been deleted");

        posts[postId].tips += amount;

        emit TipReceived(postId, msg.sender, amount);
    }

    /**
     * @dev 標記為 NFT
     * @param postId 貼文 ID
     */
    function markAsNFT(uint256 postId) external {
        require(postId > 0 && postId <= _postIds.current(), "Invalid post ID");
        require(posts[postId].author == msg.sender, "Not the author");

        posts[postId].isNFT = true;
    }

    /**
     * @dev 獲取貼文詳情
     * @param postId 貼文 ID
     */
    function getPost(uint256 postId) external view returns (Post memory) {
        require(postId > 0 && postId <= _postIds.current(), "Invalid post ID");
        return posts[postId];
    }

    /**
     * @dev 獲取用戶的所有貼文
     * @param user 用戶地址
     */
    function getUserPosts(address user) external view returns (uint256[] memory) {
        return userPosts[user];
    }

    /**
     * @dev 獲取貼文的評論
     * @param postId 貼文 ID
     */
    function getComments(uint256 postId) external view returns (Comment[] memory) {
        return postComments[postId];
    }

    /**
     * @dev 獲取關注者列表
     * @param user 用戶地址
     */
    function getFollowers(address user) external view returns (address[] memory) {
        return followers[user];
    }

    /**
     * @dev 獲取關注列表
     * @param user 用戶地址
     */
    function getFollowing(address user) external view returns (address[] memory) {
        return following[user];
    }

    /**
     * @dev 獲取總貼文數
     */
    function getTotalPosts() external view returns (uint256) {
        return _postIds.current();
    }

    /**
     * @dev 從數組中移除元素
     */
    function _removeFromArray(address[] storage array, address element) private {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }
}
