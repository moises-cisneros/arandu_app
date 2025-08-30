// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ANDUToken
 * @dev ERC20 token for the ARANDU platform currency.
 */
contract ANDUToken is ERC20, Ownable {
    /**
     * @dev Constructor that sets the initial owner and mints initial supply.
     * @param initialOwner The address that will own the contract.
     */
    constructor(
        address initialOwner
    ) ERC20("ANDU Token", "ANDU") Ownable(initialOwner) {
        _mint(initialOwner, 1_000_000 * (10 ** decimals()));
    }

    /**
     * @dev Mints new tokens. Only callable by the owner.
     * @param to The address to receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
