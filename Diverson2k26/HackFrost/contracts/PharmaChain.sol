// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PharmaChain - Anti-Counterfeit Drug Infrastructure
 * @notice Pharmaceutical Trust Layer with physical-digital authentication,
 *         inspector approval, cascading recalls, and first-scan ownership transfer.
 */
contract PharmaChain {

    // ──────────────────────────────────────────────
    // ENUMS
    // ──────────────────────────────────────────────

    enum Role { None, Manufacturer, Distributor, Retailer, Inspector, Auditor }

    enum Status {
        Manufactured,
        InTransit_ToDistributor,
        AtDistributor,
        InTransit_ToRetailer,
        AtRetailer,
        InspectorApproved,
        Sold,
        Recalled,
        Flagged
    }

    // ──────────────────────────────────────────────
    // STRUCTS
    // ──────────────────────────────────────────────

    struct TransferRecord {
        address from;
        address to;
        uint256 timestamp;
        Status status;
        string location;
    }

    struct Batch {
        bytes32 batchId;
        bytes32 metadataHash;
        address manufacturer;
        address currentHolder;
        Status status;
        bytes32 scratchCodeHash;        // keccak256(scratchCode) — physical auth
        bool activated;                  // one-time activation
        address activatedBy;             // consumer who activated
        uint256 firstScanBlock;          // block number of first activation
        bool inspectorApproved;          // inspector gate
        address inspectorAddress;        // who approved
        bytes32 parentBatchId;           // for batch splitting
        bool recalled;                   // recall flag
        string recallReason;             // reason for recall
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    // ──────────────────────────────────────────────
    // STATE
    // ──────────────────────────────────────────────

    address public owner;

    mapping(address => Role) public roles;
    mapping(bytes32 => Batch) public batches;
    mapping(bytes32 => TransferRecord[]) public batchHistory;
    mapping(bytes32 => bytes32[]) public childBatches;   // parent → children
    
    bytes32[] public allBatchIds;
    address[] public allRoleHolders;

    // ──────────────────────────────────────────────
    // EVENTS
    // ──────────────────────────────────────────────

    event RoleChanged(address indexed account, Role role, bool granted);
    event BatchCreated(bytes32 indexed batchId, address indexed manufacturer, bytes32 metadataHash);
    event BatchTransferred(bytes32 indexed batchId, address indexed from, address indexed to, Status newStatus, string location);
    event BatchVerified(bytes32 indexed batchId, address indexed consumer, bool firstActivation);
    event BatchRecalled(bytes32 indexed batchId, string reason, uint256 childrenAffected);
    event BatchFlagged(bytes32 indexed batchId, address indexed inspector);
    event BatchInspected(bytes32 indexed batchId, address indexed inspector);
    event BatchSplit(bytes32 indexed parentBatchId, bytes32 indexed childBatchId);
    event ScratchCodeUsed(bytes32 indexed batchId, address indexed consumer, uint256 blockNumber);

    // ──────────────────────────────────────────────
    // MODIFIERS
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Unauthorized role");
        _;
    }

    modifier batchExists(bytes32 _batchId) {
        require(batches[_batchId].exists, "Batch does not exist");
        _;
    }

    modifier onlyHolder(bytes32 _batchId) {
        require(batches[_batchId].currentHolder == msg.sender, "Not current holder");
        _;
    }

    // ──────────────────────────────────────────────
    // CONSTRUCTOR
    // ──────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ──────────────────────────────────────────────
    // ROLE MANAGEMENT
    // ──────────────────────────────────────────────

    function grantRole(address _account, Role _role) external onlyOwner {
        require(_role != Role.None, "Cannot grant None role");
        // Only track first-time role holders to avoid duplicates
        if (roles[_account] == Role.None) {
            allRoleHolders.push(_account);
        }
        roles[_account] = _role;
        emit RoleChanged(_account, _role, true);
    }

    function revokeRole(address _account) external onlyOwner {
        Role prev = roles[_account];
        require(prev != Role.None, "Account has no role");
        roles[_account] = Role.None;
        emit RoleChanged(_account, prev, false);
    }

    function getRole(address _account) external view returns (Role) {
        return roles[_account];
    }

    function getAllRoleHolders() external view returns (address[] memory) {
        return allRoleHolders;
    }

    // ──────────────────────────────────────────────
    // BATCH CREATION
    // ──────────────────────────────────────────────

    function createBatch(
        bytes32 _batchId,
        bytes32 _metadataHash,
        bytes32 _scratchCodeHash
    ) external onlyRole(Role.Manufacturer) {
        require(!batches[_batchId].exists, "Batch already exists");

        Batch storage b = batches[_batchId];
        b.batchId = _batchId;
        b.metadataHash = _metadataHash;
        b.manufacturer = msg.sender;
        b.currentHolder = msg.sender;
        b.status = Status.Manufactured;
        b.scratchCodeHash = _scratchCodeHash;
        b.activated = false;
        b.inspectorApproved = false;
        b.recalled = false;
        b.createdAt = block.timestamp;
        b.updatedAt = block.timestamp;
        b.exists = true;

        allBatchIds.push(_batchId);

        // Record creation in history
        batchHistory[_batchId].push(TransferRecord({
            from: address(0),
            to: msg.sender,
            timestamp: block.timestamp,
            status: Status.Manufactured,
            location: "Manufacturing Facility"
        }));

        emit BatchCreated(_batchId, msg.sender, _metadataHash);
    }

    // ──────────────────────────────────────────────
    // TRANSFERS (CHAIN OF CUSTODY)
    // ──────────────────────────────────────────────

    function transferToDistributor(
        bytes32 _batchId,
        address _distributor,
        string calldata _location
    ) external batchExists(_batchId) onlyHolder(_batchId) {
        require(roles[msg.sender] == Role.Manufacturer, "Only manufacturer can initiate");
        require(roles[_distributor] == Role.Distributor, "Recipient must be distributor");
        require(!batches[_batchId].recalled, "Batch is recalled");
        require(batches[_batchId].status == Status.Manufactured, "Batch must be in Manufactured status");

        Batch storage b = batches[_batchId];
        b.status = Status.InTransit_ToDistributor;
        b.currentHolder = _distributor;
        b.updatedAt = block.timestamp;

        batchHistory[_batchId].push(TransferRecord({
            from: msg.sender,
            to: _distributor,
            timestamp: block.timestamp,
            status: Status.InTransit_ToDistributor,
            location: _location
        }));

        emit BatchTransferred(_batchId, msg.sender, _distributor, Status.InTransit_ToDistributor, _location);
    }

    function acknowledgeByDistributor(
        bytes32 _batchId,
        string calldata _location
    ) external batchExists(_batchId) onlyHolder(_batchId) onlyRole(Role.Distributor) {
        require(!batches[_batchId].recalled, "Batch is recalled");

        Batch storage b = batches[_batchId];
        require(b.status == Status.InTransit_ToDistributor, "Not in transit to distributor");
        b.status = Status.AtDistributor;
        b.updatedAt = block.timestamp;

        batchHistory[_batchId].push(TransferRecord({
            from: msg.sender,
            to: msg.sender,
            timestamp: block.timestamp,
            status: Status.AtDistributor,
            location: _location
        }));

        emit BatchTransferred(_batchId, msg.sender, msg.sender, Status.AtDistributor, _location);
    }

    function transferToRetailer(
        bytes32 _batchId,
        address _retailer,
        string calldata _location
    ) external batchExists(_batchId) onlyHolder(_batchId) {
        require(roles[msg.sender] == Role.Distributor, "Only distributor can transfer to retailer");
        require(roles[_retailer] == Role.Retailer, "Recipient must be retailer");
        require(!batches[_batchId].recalled, "Batch is recalled");
        require(batches[_batchId].status == Status.AtDistributor, "Batch must be at Distributor");

        Batch storage b = batches[_batchId];
        b.status = Status.InTransit_ToRetailer;
        b.currentHolder = _retailer;
        b.updatedAt = block.timestamp;

        batchHistory[_batchId].push(TransferRecord({
            from: msg.sender,
            to: _retailer,
            timestamp: block.timestamp,
            status: Status.InTransit_ToRetailer,
            location: _location
        }));

        emit BatchTransferred(_batchId, msg.sender, _retailer, Status.InTransit_ToRetailer, _location);
    }

    function acknowledgeByRetailer(
        bytes32 _batchId,
        string calldata _location
    ) external batchExists(_batchId) onlyHolder(_batchId) onlyRole(Role.Retailer) {
        require(!batches[_batchId].recalled, "Batch is recalled");

        Batch storage b = batches[_batchId];
        require(b.status == Status.InTransit_ToRetailer, "Not in transit to retailer");
        b.status = Status.AtRetailer;
        b.updatedAt = block.timestamp;

        batchHistory[_batchId].push(TransferRecord({
            from: msg.sender,
            to: msg.sender,
            timestamp: block.timestamp,
            status: Status.AtRetailer,
            location: _location
        }));

        emit BatchTransferred(_batchId, msg.sender, msg.sender, Status.AtRetailer, _location);
    }

    // ──────────────────────────────────────────────
    // INSPECTOR GATE
    // ──────────────────────────────────────────────

    function inspectAndApprove(
        bytes32 _batchId
    ) external batchExists(_batchId) onlyRole(Role.Inspector) {
        Batch storage b = batches[_batchId];
        require(!b.recalled, "Batch is recalled");
        require(b.status == Status.AtRetailer, "Batch must be at retailer for inspection");

        b.inspectorApproved = true;
        b.inspectorAddress = msg.sender;
        b.status = Status.InspectorApproved;
        b.updatedAt = block.timestamp;

        batchHistory[_batchId].push(TransferRecord({
            from: msg.sender,
            to: b.currentHolder,
            timestamp: block.timestamp,
            status: Status.InspectorApproved,
            location: "Inspection Complete"
        }));

        emit BatchInspected(_batchId, msg.sender);
    }

    // ──────────────────────────────────────────────
    // FIRST SCAN OWNERSHIP TRANSFER (KILLER FEATURE)
    // ──────────────────────────────────────────────

    /**
     * @notice Consumer activates product with scratch code.
     *         - First activation: ownership transfers to consumer, status→Sold
     *         - Second activation: flags as SUSPICIOUS
     */
    function activateProduct(
        bytes32 _batchId,
        string calldata _scratchCode
    ) external batchExists(_batchId) returns (bool firstActivation) {
        Batch storage b = batches[_batchId];
        require(!b.recalled, "Product has been recalled");

        bytes32 codeHash = keccak256(abi.encodePacked(_scratchCode));
        require(codeHash == b.scratchCodeHash, "Invalid scratch code");

        if (!b.activated) {
            // FIRST SCAN — transfer ownership to consumer
            require(b.inspectorApproved, "Product not yet inspector-approved");
            
            address previousHolder = b.currentHolder;
            b.activated = true;
            b.activatedBy = msg.sender;
            b.firstScanBlock = block.number;
            b.currentHolder = msg.sender;
            b.status = Status.Sold;
            b.updatedAt = block.timestamp;

            batchHistory[_batchId].push(TransferRecord({
                from: previousHolder,
                to: msg.sender,
                timestamp: block.timestamp,
                status: Status.Sold,
                location: "Consumer Activation"
            }));

            emit ScratchCodeUsed(_batchId, msg.sender, block.number);
            emit BatchVerified(_batchId, msg.sender, true);
            return true;
        } else {
            // SECOND SCAN — suspicious, possible counterfeit — flag the batch
            b.status = Status.Flagged;
            b.updatedAt = block.timestamp;

            batchHistory[_batchId].push(TransferRecord({
                from: b.currentHolder,
                to: address(0),
                timestamp: block.timestamp,
                status: Status.Flagged,
                location: "Duplicate activation attempt"
            }));

            emit BatchFlagged(_batchId, msg.sender);
            emit BatchVerified(_batchId, msg.sender, false);
            return false;
        }
    }

    // ──────────────────────────────────────────────
    // RECALL (CASCADING)
    // ──────────────────────────────────────────────

    function recallBatch(
        bytes32 _batchId,
        string calldata _reason
    ) external batchExists(_batchId) onlyRole(Role.Inspector) {
        Batch storage b = batches[_batchId];
        b.recalled = true;
        b.recallReason = _reason;
        b.status = Status.Recalled;
        b.updatedAt = block.timestamp;

        // Cascade to all children
        uint256 childCount = _cascadeRecall(_batchId, _reason);

        batchHistory[_batchId].push(TransferRecord({
            from: msg.sender,
            to: address(0),
            timestamp: block.timestamp,
            status: Status.Recalled,
            location: _reason
        }));

        emit BatchRecalled(_batchId, _reason, childCount);
    }

    function _cascadeRecall(bytes32 _parentId, string calldata _reason) internal returns (uint256 count) {
        bytes32[] storage children = childBatches[_parentId];
        count = children.length;
        for (uint256 i = 0; i < children.length; i++) {
            Batch storage child = batches[children[i]];
            if (child.exists && !child.recalled) {
                child.recalled = true;
                child.recallReason = _reason;
                child.status = Status.Recalled;
                child.updatedAt = block.timestamp;
                count += _cascadeRecall(children[i], _reason);
            }
        }
    }

    function flagBatch(
        bytes32 _batchId
    ) external batchExists(_batchId) onlyRole(Role.Inspector) {
        Batch storage b = batches[_batchId];
        require(!b.recalled, "Cannot flag a recalled batch");
        b.status = Status.Flagged;
        b.updatedAt = block.timestamp;

        batchHistory[_batchId].push(TransferRecord({
            from: msg.sender,
            to: address(0),
            timestamp: block.timestamp,
            status: Status.Flagged,
            location: "Flagged by Inspector"
        }));

        emit BatchFlagged(_batchId, msg.sender);
    }

    // ──────────────────────────────────────────────
    // BATCH SPLITTING
    // ──────────────────────────────────────────────

    function splitBatch(
        bytes32 _parentBatchId,
        bytes32 _newBatchId,
        bytes32 _metadataHash,
        bytes32 _scratchCodeHash
    ) external batchExists(_parentBatchId) onlyHolder(_parentBatchId) {
        // Only supply-chain participants (Manufacturer/Distributor/Retailer) may split
        Role callerRole = roles[msg.sender];
        require(
            callerRole == Role.Manufacturer ||
            callerRole == Role.Distributor  ||
            callerRole == Role.Retailer,
            "Only supply-chain participants can split batches"
        );
        require(!batches[_parentBatchId].recalled, "Parent batch is recalled");
        require(!batches[_newBatchId].exists, "Child batch ID already exists");

        Batch storage parent = batches[_parentBatchId];

        Batch storage child = batches[_newBatchId];
        child.batchId = _newBatchId;
        child.metadataHash = _metadataHash;
        child.manufacturer = parent.manufacturer;
        child.currentHolder = msg.sender;
        child.status = parent.status;
        child.scratchCodeHash = _scratchCodeHash;
        child.activated = false;
        child.inspectorApproved = false;
        child.parentBatchId = _parentBatchId;
        child.recalled = false;
        child.createdAt = block.timestamp;
        child.updatedAt = block.timestamp;
        child.exists = true;

        allBatchIds.push(_newBatchId);
        childBatches[_parentBatchId].push(_newBatchId);

        batchHistory[_newBatchId].push(TransferRecord({
            from: address(0),
            to: msg.sender,
            timestamp: block.timestamp,
            status: parent.status,
            location: "Split from parent batch"
        }));

        emit BatchSplit(_parentBatchId, _newBatchId);
    }

    // ──────────────────────────────────────────────
    // VIEW FUNCTIONS
    // ──────────────────────────────────────────────

    function getBatchDetails(bytes32 _batchId) external view returns (
        bytes32 batchId,
        bytes32 metadataHash,
        address manufacturer,
        address currentHolder,
        Status status,
        bool activated,
        address activatedBy,
        uint256 firstScanBlock,
        bool inspectorApproved,
        address inspectorAddress,
        bytes32 parentBatchId,
        bool recalled,
        string memory recallReason,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        require(batches[_batchId].exists, "Batch does not exist");
        Batch storage b = batches[_batchId];
        return (
            b.batchId, b.metadataHash, b.manufacturer, b.currentHolder,
            b.status, b.activated, b.activatedBy, b.firstScanBlock,
            b.inspectorApproved, b.inspectorAddress, b.parentBatchId,
            b.recalled, b.recallReason, b.createdAt, b.updatedAt
        );
    }

    function getBatchHistory(bytes32 _batchId) external view returns (TransferRecord[] memory) {
        return batchHistory[_batchId];
    }

    function getChildBatches(bytes32 _batchId) external view returns (bytes32[] memory) {
        return childBatches[_batchId];
    }

    function getAllBatchIds() external view returns (bytes32[] memory) {
        return allBatchIds;
    }

    function getBatchCount() external view returns (uint256) {
        return allBatchIds.length;
    }
}
