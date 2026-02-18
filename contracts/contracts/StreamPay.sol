// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title StreamPay
 * @dev Per-second payment streaming for AI agent compute on opBNB
 * @notice Adapted from StreamPay (Somnia) for the ClawCompute inference marketplace
 */
contract StreamPay is ReentrancyGuard, Ownable, Pausable {

    struct Stream {
        address sender;              // Who's paying (consumer agent)
        address recipient;           // Who's receiving (provider agent)
        uint256 totalAmount;         // Total amount deposited
        uint256 flowRate;            // Wei per second
        uint256 startTime;           // When stream starts
        uint256 lastUpdateTime;      // Last time balance was updated
        uint256 stopTime;            // When stream ends
        uint256 amountWithdrawn;     // Total withdrawn by recipient
        uint256 realTimeBalance;     // Current streamed amount
        bool isActive;               // Stream status
        string streamType;           // "compute", "audit", "data"
        uint256 computeProviderId;   // Links to ComputeRegistry provider
    }

    // Core mappings
    mapping(uint256 => Stream) public streams;
    mapping(address => uint256[]) public senderStreams;
    mapping(address => uint256[]) public recipientStreams;

    // Active stream management
    uint256[] public activeStreamIds;
    mapping(uint256 => uint256) private activeStreamIndex;

    // Stream counter
    uint256 private nextStreamId = 1;
    address public keeper;

    // Protocol stats
    uint256 public totalStreamsCreated;
    uint256 public totalUpdatesPerformed;
    uint256 public totalVolumeStreamed;
    uint256 public lastBatchUpdateTime;
    uint256 public activeStreamCount;

    // Constants
    uint256 public constant MAX_BATCH_SIZE = 200;
    uint256 public constant MIN_UPDATE_INTERVAL = 1;
    uint256 public constant KEEPER_REWARD_BPS = 10; // 0.1% = 10 basis points

    // Events
    event StreamCreated(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 totalAmount,
        uint256 flowRate,
        uint256 startTime,
        uint256 stopTime,
        string streamType,
        uint256 computeProviderId
    );

    event StreamUpdated(
        uint256 indexed streamId,
        uint256 realTimeBalance,
        uint256 timestamp
    );

    event Withdrawn(
        uint256 indexed streamId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event StreamCancelled(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 senderRefund,
        uint256 recipientPayout
    );

    event BatchUpdatePerformed(
        uint256 streamsUpdated,
        uint256 timestamp,
        uint256 gasUsed
    );

    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);

    modifier onlyKeeper() {
        require(msg.sender == keeper, "StreamPay: Only keeper");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        keeper = initialOwner;
    }

    /**
     * @dev Creates a payment stream for compute inference
     * @param recipient Provider agent's wallet
     * @param duration Max duration in seconds
     * @param streamType "compute", "audit", "data"
     * @param computeProviderId Provider ID from ComputeRegistry
     */
    function createStream(
        address recipient,
        uint256 duration,
        string memory streamType,
        uint256 computeProviderId
    ) external payable nonReentrant whenNotPaused returns (uint256 streamId) {
        require(msg.value > 0, "StreamPay: Amount must be > 0");
        require(recipient != address(0), "StreamPay: Invalid recipient");
        // require(recipient != msg.sender, "StreamPay: Cannot stream to self"); // Disabled for demo
        require(duration > 0, "StreamPay: Duration must be > 0");
        require(duration <= 365 days, "StreamPay: Duration too long");
        require(msg.value >= duration, "StreamPay: Amount too small for duration");

        uint256 flowRate = msg.value / duration;
        require(flowRate > 0, "StreamPay: Flow rate too low");

        streamId = nextStreamId++;
        uint256 startTime = block.timestamp;
        uint256 stopTime = startTime + duration;

        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            totalAmount: msg.value,
            flowRate: flowRate,
            startTime: startTime,
            lastUpdateTime: startTime,
            stopTime: stopTime,
            amountWithdrawn: 0,
            realTimeBalance: 0,
            isActive: true,
            streamType: streamType,
            computeProviderId: computeProviderId
        });

        // Add to active streams
        activeStreamIds.push(streamId);
        activeStreamIndex[streamId] = activeStreamIds.length - 1;

        // Add to user mappings
        senderStreams[msg.sender].push(streamId);
        recipientStreams[recipient].push(streamId);

        // Update stats
        totalStreamsCreated++;
        activeStreamCount++;
        totalVolumeStreamed += msg.value;

        emit StreamCreated(
            streamId,
            msg.sender,
            recipient,
            msg.value,
            flowRate,
            startTime,
            stopTime,
            streamType,
            computeProviderId
        );
    }

    /**
     * @dev Batch update multiple streams — keeper earns 0.1% reward
     */
    function batchUpdateStreams(uint256[] memory streamIds)
        public
        nonReentrant
        whenNotPaused
    {
        require(streamIds.length <= MAX_BATCH_SIZE, "StreamPay: Batch too large");
        require(
            block.timestamp >= lastBatchUpdateTime + MIN_UPDATE_INTERVAL,
            "StreamPay: Too frequent"
        );

        uint256 gasStart = gasleft();
        uint256 updatedCount = 0;

        for (uint256 i = 0; i < streamIds.length; i++) {
            if (_updateStreamBalance(streamIds[i])) {
                updatedCount++;
            }
        }

        totalUpdatesPerformed += updatedCount;
        lastBatchUpdateTime = block.timestamp;

        emit BatchUpdatePerformed(updatedCount, block.timestamp, gasStart - gasleft());
    }

    /**
     * @dev Internal: update a single stream's balance + pay keeper reward
     */
    function _updateStreamBalance(uint256 streamId) internal returns (bool) {
        Stream storage stream = streams[streamId];

        if (!stream.isActive || block.timestamp <= stream.lastUpdateTime) {
            return false;
        }

        uint256 timeElapsed = block.timestamp - stream.lastUpdateTime;
        uint256 maxTimeElapsed = stream.stopTime > stream.lastUpdateTime
            ? stream.stopTime - stream.lastUpdateTime
            : 0;

        if (maxTimeElapsed == 0) {
            _deactivateStream(streamId);
            return false;
        }

        uint256 effectiveTime = timeElapsed > maxTimeElapsed ? maxTimeElapsed : timeElapsed;
        uint256 newAmount = effectiveTime * stream.flowRate;

        // Keeper reward: 0.1%
        uint256 keeperReward = (newAmount * KEEPER_REWARD_BPS) / 10000;

        if (keeperReward > 0 && newAmount > keeperReward) {
            stream.realTimeBalance += (newAmount - keeperReward);
            (bool success, ) = payable(msg.sender).call{value: keeperReward}("");
            if (!success) {
                // If keeper reward fails, give full amount to recipient
                stream.realTimeBalance += keeperReward;
            }
        } else {
            stream.realTimeBalance += newAmount;
        }

        stream.lastUpdateTime = block.timestamp;

        if (block.timestamp >= stream.stopTime) {
            _deactivateStream(streamId);
        }

        emit StreamUpdated(streamId, stream.realTimeBalance, block.timestamp);
        return true;
    }

    /**
     * @dev Recipient withdraws earned funds
     */
    function withdrawFromStream(uint256 streamId) external nonReentrant whenNotPaused {
        Stream storage stream = streams[streamId];
        require(stream.isActive || stream.realTimeBalance > stream.amountWithdrawn, "StreamPay: Nothing to withdraw");
        require(msg.sender == stream.recipient, "StreamPay: Not recipient");

        if (stream.isActive) {
            _updateStreamBalance(streamId);
        }

        uint256 withdrawable = stream.realTimeBalance - stream.amountWithdrawn;
        require(withdrawable > 0, "StreamPay: No funds");

        stream.amountWithdrawn += withdrawable;

        (bool success, ) = payable(stream.recipient).call{value: withdrawable}("");
        require(success, "StreamPay: Transfer failed");

        emit Withdrawn(streamId, stream.recipient, withdrawable, block.timestamp);
    }

    /**
     * @dev Cancel stream — refund sender, pay recipient earned amount
     */
    function cancelStream(uint256 streamId) external nonReentrant whenNotPaused {
        Stream storage stream = streams[streamId];
        require(stream.isActive, "StreamPay: Not active");
        require(
            msg.sender == stream.sender || msg.sender == stream.recipient,
            "StreamPay: Unauthorized"
        );

        _updateStreamBalance(streamId);

        uint256 recipientBalance = stream.realTimeBalance - stream.amountWithdrawn;
        uint256 totalUsed = stream.amountWithdrawn + recipientBalance;
        uint256 senderRefund = stream.totalAmount > totalUsed
            ? stream.totalAmount - totalUsed
            : 0;

        _deactivateStream(streamId);

        if (recipientBalance > 0) {
            (bool success, ) = payable(stream.recipient).call{value: recipientBalance}("");
            require(success, "StreamPay: Recipient transfer failed");
        }

        if (senderRefund > 0) {
            (bool success, ) = payable(stream.sender).call{value: senderRefund}("");
            require(success, "StreamPay: Sender refund failed");
        }

        emit StreamCancelled(streamId, stream.sender, stream.recipient, senderRefund, recipientBalance);
    }

    // ============ View Functions ============

    function getCurrentBalance(uint256 streamId) external view returns (uint256) {
        return _getCurrentBalance(streamId);
    }

    function _getCurrentBalance(uint256 streamId) internal view returns (uint256) {
        Stream storage stream = streams[streamId];
        if (!stream.isActive && stream.realTimeBalance <= stream.amountWithdrawn) return 0;

        uint256 currentTime = block.timestamp > stream.stopTime ? stream.stopTime : block.timestamp;
        if (currentTime <= stream.lastUpdateTime) {
            return stream.realTimeBalance > stream.amountWithdrawn
                ? stream.realTimeBalance - stream.amountWithdrawn
                : 0;
        }

        uint256 timeElapsed = currentTime - stream.lastUpdateTime;
        uint256 additionalAmount = timeElapsed * stream.flowRate;
        uint256 totalBalance = stream.realTimeBalance + additionalAmount;

        return totalBalance > stream.amountWithdrawn ? totalBalance - stream.amountWithdrawn : 0;
    }

    function getStreamInfo(uint256 streamId) external view returns (
        address sender,
        address recipient,
        uint256 totalAmount,
        uint256 flowRate,
        uint256 startTime,
        uint256 stopTime,
        uint256 currentBalance,
        bool isActive,
        string memory streamType,
        uint256 computeProviderId
    ) {
        Stream storage s = streams[streamId];
        return (
            s.sender,
            s.recipient,
            s.totalAmount,
            s.flowRate,
            s.startTime,
            s.stopTime,
            _getCurrentBalance(streamId),
            s.isActive,
            s.streamType,
            s.computeProviderId
        );
    }

    function getSenderStreams(address sender) external view returns (uint256[] memory) {
        return senderStreams[sender];
    }

    function getRecipientStreams(address recipient) external view returns (uint256[] memory) {
        return recipientStreams[recipient];
    }

    function getActiveStreamIds() external view returns (uint256[] memory) {
        return activeStreamIds;
    }

    function getProtocolStats() external view returns (
        uint256 totalStreams,
        uint256 totalUpdates,
        uint256 totalVolume,
        uint256 activeStreams,
        uint256 lastUpdate
    ) {
        return (
            totalStreamsCreated,
            totalUpdatesPerformed,
            totalVolumeStreamed,
            activeStreamCount,
            lastBatchUpdateTime
        );
    }

    // ============ Admin Functions ============

    function setKeeper(address newKeeper) external onlyOwner {
        require(newKeeper != address(0), "StreamPay: Invalid keeper");
        emit KeeperUpdated(keeper, newKeeper);
        keeper = newKeeper;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function emergencyWithdraw() external onlyOwner whenPaused {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "StreamPay: Emergency withdrawal failed");
    }

    // ============ Internal ============

    function _deactivateStream(uint256 streamId) internal {
        Stream storage stream = streams[streamId];
        if (!stream.isActive || activeStreamIds.length == 0) return;

        stream.isActive = false;
        if (activeStreamCount > 0) activeStreamCount--;

        uint256 index = activeStreamIndex[streamId];
        uint256 lastId = activeStreamIds[activeStreamIds.length - 1];
        activeStreamIds[index] = lastId;
        activeStreamIndex[lastId] = index;
        activeStreamIds.pop();
        delete activeStreamIndex[streamId];
    }

    receive() external payable {
        revert("StreamPay: Use createStream()");
    }
}
