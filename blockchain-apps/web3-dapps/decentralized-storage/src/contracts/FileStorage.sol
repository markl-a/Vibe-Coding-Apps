// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title FileStorage
 * @dev 去中心化文件存儲元數據管理
 */
contract FileStorage is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _fileIds;

    struct FileMetadata {
        uint256 id;
        address owner;
        string cid;              // IPFS CID
        string name;
        uint256 size;
        string fileType;
        string[] tags;
        uint256 uploadedAt;
        uint256 lastModified;
        bool isEncrypted;
        bool isPublic;
        bool isDeleted;
    }

    struct FileVersion {
        string cid;
        uint256 timestamp;
        string comment;
    }

    // 文件元數據存儲
    mapping(uint256 => FileMetadata) public files;

    // 用戶的文件列表
    mapping(address => uint256[]) public userFiles;

    // 文件版本歷史
    mapping(uint256 => FileVersion[]) public fileVersions;

    // 文件分享
    mapping(uint256 => mapping(address => bool)) public sharedWith;
    mapping(uint256 => address[]) public sharedUsers;

    // CID 到文件 ID 的映射
    mapping(string => uint256) public cidToFileId;

    // 事件
    event FileUploaded(
        uint256 indexed fileId,
        address indexed owner,
        string cid,
        string name,
        uint256 size
    );

    event FileUpdated(
        uint256 indexed fileId,
        string newCid,
        string comment
    );

    event FileShared(
        uint256 indexed fileId,
        address indexed owner,
        address indexed recipient
    );

    event FileAccessRevoked(
        uint256 indexed fileId,
        address indexed owner,
        address indexed user
    );

    event FileDeleted(
        uint256 indexed fileId,
        address indexed owner
    );

    event FileRestored(
        uint256 indexed fileId,
        string cid
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev 上傳文件元數據
     */
    function uploadFile(
        string memory cid,
        string memory name,
        uint256 size,
        string memory fileType,
        string[] memory tags,
        bool isEncrypted,
        bool isPublic
    ) external returns (uint256) {
        require(bytes(cid).length > 0, "CID cannot be empty");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(size > 0, "Size must be greater than 0");

        _fileIds.increment();
        uint256 newFileId = _fileIds.current();

        FileMetadata storage newFile = files[newFileId];
        newFile.id = newFileId;
        newFile.owner = msg.sender;
        newFile.cid = cid;
        newFile.name = name;
        newFile.size = size;
        newFile.fileType = fileType;
        newFile.tags = tags;
        newFile.uploadedAt = block.timestamp;
        newFile.lastModified = block.timestamp;
        newFile.isEncrypted = isEncrypted;
        newFile.isPublic = isPublic;
        newFile.isDeleted = false;

        userFiles[msg.sender].push(newFileId);
        cidToFileId[cid] = newFileId;

        // 添加初始版本
        fileVersions[newFileId].push(
            FileVersion({
                cid: cid,
                timestamp: block.timestamp,
                comment: "Initial upload"
            })
        );

        emit FileUploaded(newFileId, msg.sender, cid, name, size);

        return newFileId;
    }

    /**
     * @dev 更新文件（新版本）
     */
    function updateFile(
        uint256 fileId,
        string memory newCid,
        string memory comment
    ) external {
        require(fileId > 0 && fileId <= _fileIds.current(), "Invalid file ID");
        require(files[fileId].owner == msg.sender, "Not the owner");
        require(!files[fileId].isDeleted, "File is deleted");

        files[fileId].cid = newCid;
        files[fileId].lastModified = block.timestamp;

        // 添加版本記錄
        fileVersions[fileId].push(
            FileVersion({
                cid: newCid,
                timestamp: block.timestamp,
                comment: comment
            })
        );

        cidToFileId[newCid] = fileId;

        emit FileUpdated(fileId, newCid, comment);
    }

    /**
     * @dev 分享文件給其他用戶
     */
    function shareFile(uint256 fileId, address recipient) external {
        require(fileId > 0 && fileId <= _fileIds.current(), "Invalid file ID");
        require(files[fileId].owner == msg.sender, "Not the owner");
        require(!files[fileId].isDeleted, "File is deleted");
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot share with yourself");
        require(!sharedWith[fileId][recipient], "Already shared");

        sharedWith[fileId][recipient] = true;
        sharedUsers[fileId].push(recipient);

        emit FileShared(fileId, msg.sender, recipient);
    }

    /**
     * @dev 批量分享
     */
    function batchShareFile(uint256 fileId, address[] memory recipients) external {
        require(fileId > 0 && fileId <= _fileIds.current(), "Invalid file ID");
        require(files[fileId].owner == msg.sender, "Not the owner");
        require(!files[fileId].isDeleted, "File is deleted");

        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            if (
                recipient != address(0) &&
                recipient != msg.sender &&
                !sharedWith[fileId][recipient]
            ) {
                sharedWith[fileId][recipient] = true;
                sharedUsers[fileId].push(recipient);
                emit FileShared(fileId, msg.sender, recipient);
            }
        }
    }

    /**
     * @dev 撤銷分享
     */
    function revokeAccess(uint256 fileId, address user) external {
        require(fileId > 0 && fileId <= _fileIds.current(), "Invalid file ID");
        require(files[fileId].owner == msg.sender, "Not the owner");
        require(sharedWith[fileId][user], "Not shared with this user");

        sharedWith[fileId][user] = false;

        // 從數組中移除
        address[] storage users = sharedUsers[fileId];
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] == user) {
                users[i] = users[users.length - 1];
                users.pop();
                break;
            }
        }

        emit FileAccessRevoked(fileId, msg.sender, user);
    }

    /**
     * @dev 刪除文件
     */
    function deleteFile(uint256 fileId) external {
        require(fileId > 0 && fileId <= _fileIds.current(), "Invalid file ID");
        require(files[fileId].owner == msg.sender, "Not the owner");
        require(!files[fileId].isDeleted, "Already deleted");

        files[fileId].isDeleted = true;

        emit FileDeleted(fileId, msg.sender);
    }

    /**
     * @dev 恢復到特定版本
     */
    function restoreVersion(uint256 fileId, string memory cid) external {
        require(fileId > 0 && fileId <= _fileIds.current(), "Invalid file ID");
        require(files[fileId].owner == msg.sender, "Not the owner");

        // 驗證 CID 存在於版本歷史中
        bool cidExists = false;
        FileVersion[] storage versions = fileVersions[fileId];
        for (uint256 i = 0; i < versions.length; i++) {
            if (
                keccak256(abi.encodePacked(versions[i].cid)) ==
                keccak256(abi.encodePacked(cid))
            ) {
                cidExists = true;
                break;
            }
        }
        require(cidExists, "CID not found in version history");

        files[fileId].cid = cid;
        files[fileId].lastModified = block.timestamp;

        emit FileRestored(fileId, cid);
    }

    /**
     * @dev 更新文件標籤
     */
    function updateTags(uint256 fileId, string[] memory newTags) external {
        require(fileId > 0 && fileId <= _fileIds.current(), "Invalid file ID");
        require(files[fileId].owner == msg.sender, "Not the owner");

        files[fileId].tags = newTags;
    }

    /**
     * @dev 切換公開狀態
     */
    function togglePublic(uint256 fileId) external {
        require(fileId > 0 && fileId <= _fileIds.current(), "Invalid file ID");
        require(files[fileId].owner == msg.sender, "Not the owner");

        files[fileId].isPublic = !files[fileId].isPublic;
    }

    /**
     * @dev 獲取文件元數據
     */
    function getFile(uint256 fileId) external view returns (FileMetadata memory) {
        require(fileId > 0 && fileId <= _fileIds.current(), "Invalid file ID");
        return files[fileId];
    }

    /**
     * @dev 獲取用戶的所有文件
     */
    function getUserFiles(address user) external view returns (uint256[] memory) {
        return userFiles[user];
    }

    /**
     * @dev 獲取文件版本歷史
     */
    function getFileVersions(uint256 fileId)
        external
        view
        returns (FileVersion[] memory)
    {
        return fileVersions[fileId];
    }

    /**
     * @dev 獲取文件分享列表
     */
    function getSharedUsers(uint256 fileId)
        external
        view
        returns (address[] memory)
    {
        return sharedUsers[fileId];
    }

    /**
     * @dev 檢查用戶是否有訪問權限
     */
    function canAccess(uint256 fileId, address user) external view returns (bool) {
        FileMetadata memory file = files[fileId];

        // 文件已刪除
        if (file.isDeleted) return false;

        // 是所有者
        if (file.owner == user) return true;

        // 是公開文件
        if (file.isPublic) return true;

        // 已分享
        if (sharedWith[fileId][user]) return true;

        return false;
    }

    /**
     * @dev 獲取總文件數
     */
    function getTotalFiles() external view returns (uint256) {
        return _fileIds.current();
    }

    /**
     * @dev 按標籤搜索文件（簡單實現）
     */
    function searchByTag(string memory tag)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory results = new uint256[](_fileIds.current());
        uint256 count = 0;

        for (uint256 i = 1; i <= _fileIds.current(); i++) {
            if (!files[i].isDeleted && files[i].isPublic) {
                for (uint256 j = 0; j < files[i].tags.length; j++) {
                    if (
                        keccak256(abi.encodePacked(files[i].tags[j])) ==
                        keccak256(abi.encodePacked(tag))
                    ) {
                        results[count] = i;
                        count++;
                        break;
                    }
                }
            }
        }

        // 調整數組大小
        uint256[] memory finalResults = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResults[i] = results[i];
        }

        return finalResults;
    }
}
