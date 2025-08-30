// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AranduMarketplace
 * @dev Marketplace for selling educational resource NFTs.
 */
contract AranduMarketplace is Ownable {
    address public resourceNftAddress;
    address public anduTokenAddress;

    mapping(uint256 => uint256) public itemPrices;
    mapping(uint256 => address) public itemSellers;

    /**
     * @dev Constructor that sets the initial owner.
     * @param initialOwner The address that will own the contract.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Sets the addresses of the NFT and token contracts. Only callable by the owner.
     * @param _nftAddress The address of the resource NFT contract.
     * @param _tokenAddress The address of the ANDU token contract.
     */
    function setAddresses(
        address _nftAddress,
        address _tokenAddress
    ) public onlyOwner {
        resourceNftAddress = _nftAddress;
        anduTokenAddress = _tokenAddress;
    }

    /**
     * @dev Lists an NFT for sale.
     * @param _tokenId The ID of the NFT to list.
     * @param _price The price in ANDU tokens.
     */
    function listItem(uint256 _tokenId, uint256 _price) public {
        require(
            resourceNftAddress != address(0),
            "AranduMarketplace: NFT address not set"
        );
        IERC1155 nft = IERC1155(resourceNftAddress);
        require(
            nft.balanceOf(msg.sender, _tokenId) > 0,
            "AranduMarketplace: Not the owner"
        );
        require(
            nft.isApprovedForAll(msg.sender, address(this)),
            "AranduMarketplace: NFT not approved"
        );

        itemPrices[_tokenId] = _price;
        itemSellers[_tokenId] = msg.sender;
    }

    /**
     * @dev Buys a listed NFT.
     * @param _tokenId The ID of the NFT to buy.
     */
    function buyItem(uint256 _tokenId) public {
        require(itemPrices[_tokenId] > 0, "AranduMarketplace: Item not listed");
        address seller = itemSellers[_tokenId];
        uint256 price = itemPrices[_tokenId];

        // Transfer tokens from buyer to seller
        IERC20 token = IERC20(anduTokenAddress);
        require(
            token.transferFrom(msg.sender, seller, price),
            "AranduMarketplace: Token transfer failed"
        );

        // Transfer NFT from seller to buyer
        IERC1155 nft = IERC1155(resourceNftAddress);
        nft.safeTransferFrom(seller, msg.sender, _tokenId, 1, "");

        // Remove listing
        delete itemPrices[_tokenId];
        delete itemSellers[_tokenId];
    }

    /**
     * @dev Cancels a listing.
     * @param _tokenId The ID of the NFT to cancel.
     */
    function cancelListing(uint256 _tokenId) public {
        require(
            itemSellers[_tokenId] == msg.sender,
            "AranduMarketplace: Not the seller"
        );
        delete itemPrices[_tokenId];
        delete itemSellers[_tokenId];
    }
}
