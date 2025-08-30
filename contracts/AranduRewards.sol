// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AranduCertificates.sol";

/**
 * @title AranduRewards
 * @dev Orchestrator contract for distributing rewards and issuing certificates.
 */
contract AranduRewards is Ownable {
    address public anduTokenAddress;
    address public certificateContractAddress;

    /**
     * @dev Constructor that sets the initial owner.
     * @param initialOwner The address that will own the contract.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Sets the addresses of the token and certificate contracts. Only callable by the owner.
     * @param _tokenAddress The address of the ANDU token contract.
     * @param _certificateAddress The address of the certificate contract.
     */
    function setAddresses(
        address _tokenAddress,
        address _certificateAddress
    ) public onlyOwner {
        anduTokenAddress = _tokenAddress;
        certificateContractAddress = _certificateAddress;
    }

    /**
     * @dev Grants token rewards to a student. Only callable by the owner.
     * @param _student The address of the student.
     * @param _amount The amount of tokens to grant.
     */
    function grantTokenReward(
        address _student,
        uint256 _amount
    ) public onlyOwner {
        require(
            anduTokenAddress != address(0),
            "AranduRewards: Token address not set"
        );
        IERC20 token = IERC20(anduTokenAddress);
        require(
            token.balanceOf(address(this)) >= _amount,
            "AranduRewards: Insufficient balance"
        );
        token.transfer(_student, _amount);
    }

    /**
     * @dev Issues a certificate to a student. Only callable by the owner.
     * @param _student The address of the student.
     * @param _uri The metadata URI for the certificate.
     * @param _certType The type of certificate: "student" or "teacher".
     */
    function issueCertificate(
        address _student,
        string memory _uri,
        string memory _certType
    ) public onlyOwner {
        require(
            certificateContractAddress != address(0),
            "AranduRewards: Certificate address not set"
        );
        AranduCertificates certificate = AranduCertificates(
            certificateContractAddress
        );
        certificate.safeMint(_student, _uri, _certType);
    }
}
