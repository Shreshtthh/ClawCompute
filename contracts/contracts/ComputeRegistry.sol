// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ComputeRegistry
 * @dev Registry for AI compute providers on BNB Chain
 * @notice Agents register as providers with pricing; consumers discover and select providers
 */
contract ComputeRegistry is Ownable, ReentrancyGuard {

    struct Provider {
        address wallet;           // Provider's wallet address
        string modelName;         // e.g., "llama-3-70b", "gemma-7b"
        uint256 pricePerSecond;   // Price in wei per second of inference
        string endpoint;          // HTTP endpoint for inference requests
        bool isActive;            // Currently accepting requests
        uint256 totalEarned;      // Lifetime earnings (tracked off-chain updates)
        uint256 totalRequests;    // Lifetime completed requests
        uint256 registeredAt;     // Registration timestamp
        uint256 serviceType;      // 0 = compute, 1 = audit, 2 = data (future ClawWork)
    }

    // Provider storage
    mapping(uint256 => Provider) public providers;
    uint256 public nextProviderId = 1;

    // Lookup helpers
    mapping(address => uint256[]) public walletProviders; // wallet -> providerIds
    uint256[] public activeProviderIds;
    mapping(uint256 => uint256) private activeProviderIndex;

    // Stats
    uint256 public totalProviders;
    uint256 public totalActiveProviders;

    // Events
    event ProviderRegistered(
        uint256 indexed providerId,
        address indexed wallet,
        string modelName,
        uint256 pricePerSecond,
        string endpoint,
        uint256 serviceType
    );

    event ProviderUpdated(
        uint256 indexed providerId,
        uint256 pricePerSecond,
        string endpoint,
        bool isActive
    );

    event ProviderDeactivated(uint256 indexed providerId);

    event RequestCompleted(
        uint256 indexed providerId,
        uint256 totalRequests,
        uint256 totalEarned
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Register as a compute provider
     * @param modelName Name of the model offered (e.g., "llama-3-70b")
     * @param pricePerSecond Price in wei per second of inference
     * @param endpoint HTTP endpoint for inference requests
     * @param serviceType 0 = compute, 1 = audit, 2 = data
     */
    function registerProvider(
        string memory modelName,
        uint256 pricePerSecond,
        string memory endpoint,
        uint256 serviceType
    ) external returns (uint256 providerId) {
        require(bytes(modelName).length > 0, "ComputeRegistry: Model name required");
        require(pricePerSecond > 0, "ComputeRegistry: Price must be > 0");
        require(bytes(endpoint).length > 0, "ComputeRegistry: Endpoint required");
        require(serviceType <= 2, "ComputeRegistry: Invalid service type");

        providerId = nextProviderId++;

        providers[providerId] = Provider({
            wallet: msg.sender,
            modelName: modelName,
            pricePerSecond: pricePerSecond,
            endpoint: endpoint,
            isActive: true,
            totalEarned: 0,
            totalRequests: 0,
            registeredAt: block.timestamp,
            serviceType: serviceType
        });

        // Add to active list
        activeProviderIds.push(providerId);
        activeProviderIndex[providerId] = activeProviderIds.length - 1;

        // Add to wallet lookup
        walletProviders[msg.sender].push(providerId);

        // Update stats
        totalProviders++;
        totalActiveProviders++;

        emit ProviderRegistered(
            providerId,
            msg.sender,
            modelName,
            pricePerSecond,
            endpoint,
            serviceType
        );
    }

    /**
     * @dev Update provider details (only provider owner)
     */
    function updateProvider(
        uint256 providerId,
        uint256 newPricePerSecond,
        string memory newEndpoint,
        bool newIsActive
    ) external {
        Provider storage provider = providers[providerId];
        require(provider.wallet == msg.sender, "ComputeRegistry: Not provider owner");
        require(newPricePerSecond > 0, "ComputeRegistry: Price must be > 0");

        bool wasActive = provider.isActive;

        provider.pricePerSecond = newPricePerSecond;
        provider.endpoint = newEndpoint;
        provider.isActive = newIsActive;

        // Handle activation/deactivation
        if (wasActive && !newIsActive) {
            _removeFromActive(providerId);
            totalActiveProviders--;
        } else if (!wasActive && newIsActive) {
            activeProviderIds.push(providerId);
            activeProviderIndex[providerId] = activeProviderIds.length - 1;
            totalActiveProviders++;
        }

        emit ProviderUpdated(providerId, newPricePerSecond, newEndpoint, newIsActive);
    }

    /**
     * @dev Record a completed inference request (called by payment contract or provider)
     */
    function recordCompletion(uint256 providerId, uint256 earned) external {
        Provider storage provider = providers[providerId];
        require(provider.wallet != address(0), "ComputeRegistry: Provider not found");

        provider.totalRequests++;
        provider.totalEarned += earned;

        emit RequestCompleted(providerId, provider.totalRequests, provider.totalEarned);
    }

    // ============ View Functions ============

    /**
     * @dev Get all active provider IDs
     */
    function getActiveProviderIds() external view returns (uint256[] memory) {
        return activeProviderIds;
    }

    /**
     * @dev Get provider details
     */
    function getProvider(uint256 providerId) external view returns (
        address wallet,
        string memory modelName,
        uint256 pricePerSecond,
        string memory endpoint,
        bool isActive,
        uint256 totalEarned,
        uint256 totalRequests,
        uint256 registeredAt,
        uint256 serviceType
    ) {
        Provider storage p = providers[providerId];
        return (
            p.wallet,
            p.modelName,
            p.pricePerSecond,
            p.endpoint,
            p.isActive,
            p.totalEarned,
            p.totalRequests,
            p.registeredAt,
            p.serviceType
        );
    }

    /**
     * @dev Find the cheapest active provider for a given model name
     * @return providerId The ID of the cheapest provider (0 if none found)
     * @return pricePerSecond The price of the cheapest provider
     */
    function getCheapestProvider(string memory modelName) external view returns (
        uint256 providerId,
        uint256 pricePerSecond
    ) {
        uint256 cheapestPrice = type(uint256).max;
        uint256 cheapestId = 0;

        for (uint256 i = 0; i < activeProviderIds.length; i++) {
            Provider storage p = providers[activeProviderIds[i]];
            if (
                p.isActive &&
                p.pricePerSecond < cheapestPrice &&
                _stringsEqual(p.modelName, modelName)
            ) {
                cheapestPrice = p.pricePerSecond;
                cheapestId = activeProviderIds[i];
            }
        }

        return (cheapestId, cheapestId > 0 ? cheapestPrice : 0);
    }

    /**
     * @dev Get all provider IDs for a wallet
     */
    function getWalletProviders(address wallet) external view returns (uint256[] memory) {
        return walletProviders[wallet];
    }

    /**
     * @dev Get registry stats
     */
    function getRegistryStats() external view returns (
        uint256 _totalProviders,
        uint256 _totalActiveProviders
    ) {
        return (totalProviders, totalActiveProviders);
    }

    // ============ Internal Functions ============

    function _removeFromActive(uint256 providerId) internal {
        if (activeProviderIds.length == 0) return;

        uint256 index = activeProviderIndex[providerId];
        uint256 lastId = activeProviderIds[activeProviderIds.length - 1];

        activeProviderIds[index] = lastId;
        activeProviderIndex[lastId] = index;
        activeProviderIds.pop();

        delete activeProviderIndex[providerId];
    }

    function _stringsEqual(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}
