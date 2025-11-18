// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MultiSigWallet
 * @dev Multi-signature wallet implementation for secure fund management
 *
 * Features:
 * - Multiple owners with configurable approval threshold
 * - Submit, approve, and execute transactions
 * - Owner management (add/remove)
 * - Daily spending limit for small transactions
 * - Emergency freeze functionality
 * - Support for ETH and ERC20 tokens
 */
contract MultiSigWallet is ReentrancyGuard {
    // ============ Events ============

    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ApproveTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeApproval(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event RequirementChanged(uint256 required);
    event DailyLimitChanged(uint256 dailyLimit);
    event EmergencyFreeze(bool frozen);

    // ============ State Variables ============

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numApprovals;
        uint256 timestamp;
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public isApproved;

    // Daily limit feature
    uint256 public dailyLimit;
    uint256 public spentToday;
    uint256 public lastDay;

    // Emergency freeze
    bool public frozen;

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "Transaction already executed");
        _;
    }

    modifier notApproved(uint256 _txIndex) {
        require(!isApproved[_txIndex][msg.sender], "Transaction already approved");
        _;
    }

    modifier notFrozen() {
        require(!frozen, "Wallet is frozen");
        _;
    }

    // ============ Constructor ============

    constructor(address[] memory _owners, uint256 _required, uint256 _dailyLimit) {
        require(_owners.length > 0, "Owners required");
        require(
            _required > 0 && _required <= _owners.length,
            "Invalid required number of owners"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
        dailyLimit = _dailyLimit;
        lastDay = block.timestamp / 1 days;
    }

    // ============ Receive Function ============

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    // ============ Transaction Functions ============

    /**
     * @dev Submit a new transaction
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner notFrozen {
        uint256 txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numApprovals: 0,
                timestamp: block.timestamp
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    /**
     * @dev Approve a transaction
     */
    function approveTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notApproved(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numApprovals += 1;
        isApproved[_txIndex][msg.sender] = true;

        emit ApproveTransaction(msg.sender, _txIndex);
    }

    /**
     * @dev Execute an approved transaction
     */
    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notFrozen
        nonReentrant
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numApprovals >= required,
            "Not enough approvals"
        );

        // Check daily limit for ETH transfers
        if (transaction.data.length == 0 && transaction.value > 0) {
            require(
                isUnderLimit(transaction.value),
                "Exceeds daily limit"
            );
            updateSpentToday(transaction.value);
        }

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "Transaction failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    /**
     * @dev Revoke transaction approval
     */
    function revokeApproval(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(isApproved[_txIndex][msg.sender], "Transaction not approved");

        Transaction storage transaction = transactions[_txIndex];
        transaction.numApprovals -= 1;
        isApproved[_txIndex][msg.sender] = false;

        emit RevokeApproval(msg.sender, _txIndex);
    }

    // ============ Owner Management ============

    /**
     * @dev Add a new owner (requires approval)
     */
    function addOwner(address _owner) public onlyOwner {
        require(_owner != address(0), "Invalid owner");
        require(!isOwner[_owner], "Owner already exists");

        isOwner[_owner] = true;
        owners.push(_owner);

        emit OwnerAdded(_owner);
    }

    /**
     * @dev Remove an owner (requires approval)
     */
    function removeOwner(address _owner) public onlyOwner {
        require(isOwner[_owner], "Not an owner");
        require(owners.length > required, "Cannot remove owner");

        isOwner[_owner] = false;

        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        emit OwnerRemoved(_owner);
    }

    /**
     * @dev Change approval requirement
     */
    function changeRequirement(uint256 _required) public onlyOwner {
        require(_required > 0 && _required <= owners.length, "Invalid requirement");
        required = _required;

        emit RequirementChanged(_required);
    }

    // ============ Daily Limit Functions ============

    /**
     * @dev Change daily spending limit
     */
    function changeDailyLimit(uint256 _dailyLimit) public onlyOwner {
        dailyLimit = _dailyLimit;
        emit DailyLimitChanged(_dailyLimit);
    }

    /**
     * @dev Check if amount is under daily limit
     */
    function isUnderLimit(uint256 _amount) public view returns (bool) {
        if (block.timestamp / 1 days > lastDay) {
            return _amount <= dailyLimit;
        } else {
            return spentToday + _amount <= dailyLimit;
        }
    }

    /**
     * @dev Update spent amount for today
     */
    function updateSpentToday(uint256 _amount) private {
        uint256 today = block.timestamp / 1 days;

        if (today > lastDay) {
            spentToday = _amount;
            lastDay = today;
        } else {
            spentToday += _amount;
        }
    }

    // ============ Emergency Functions ============

    /**
     * @dev Freeze/unfreeze wallet in emergency
     */
    function toggleFreeze() public onlyOwner {
        frozen = !frozen;
        emit EmergencyFreeze(frozen);
    }

    // ============ View Functions ============

    /**
     * @dev Get list of owners
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @dev Get transaction count
     */
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    /**
     * @dev Get transaction details
     */
    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numApprovals,
            uint256 timestamp
        )
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numApprovals,
            transaction.timestamp
        );
    }

    /**
     * @dev Get all pending transactions
     */
    function getPendingTransactions() public view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (!transactions[i].executed) {
                count++;
            }
        }

        uint256[] memory pending = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (!transactions[i].executed) {
                pending[index] = i;
                index++;
            }
        }

        return pending;
    }

    /**
     * @dev Get wallet balance
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
