// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DataAnchor
 * @dev Contract to anchor data hashes on-chain for transparency.
 */
contract DataAnchor is Ownable {
    struct AnchorData {
        bytes32 hash;
        uint256 timestamp;
        address publisher;
    }

    mapping(bytes32 => AnchorData) public anchors;

    event HashAnchored(bytes32 indexed hash, address indexed publisher, uint256 timestamp);

    /**
     * @dev Constructor that sets the initial owner.
     * @param initialOwner The address that will own the contract.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Anchors a new data hash. Only callable by the owner.
     * @param _hash The hash to anchor.
     */
    function anchorHash(bytes32 _hash) public onlyOwner {
        require(anchors[_hash].timestamp == 0, "Hash already anchored");
        anchors[_hash] = AnchorData({
            hash: _hash,
            timestamp: block.timestamp,
            publisher: msg.sender
        });
        emit HashAnchored(_hash, msg.sender, block.timestamp);
    }

    /**
     * @dev Retrieves the anchor data for a hash.
     * @param _hash The hash to query.
     * @return The anchor data.
     */
    function getAnchorData(bytes32 _hash) public view returns (AnchorData memory) {
        return anchors[_hash];
    }
}
