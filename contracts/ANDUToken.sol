// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ANDUToken
 * @dev ERC20 token for the ARANDU platform currency with role-based access control.
 */
contract ANDUToken is ERC20, Ownable, AccessControl {
    // Role definitions
    bytes32 public constant TEACHER_ROLE = keccak256("TEACHER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Events
    event TeacherAdded(address indexed teacher);
    event TeacherRemoved(address indexed teacher);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    /**
     * @dev Constructor that sets the initial owner and mints initial supply.
     * @param initialOwner The address that will own the contract.
     */
    constructor(
        address initialOwner
    ) ERC20("ANDU Token", "ANDU") Ownable(initialOwner) {
        _mint(initialOwner, 1_000_000 * (10 ** decimals()));
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        
        // Set role admin relationships
        _setRoleAdmin(TEACHER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
    }

    /**
     * @dev Mints new tokens. Only callable by addresses with MINTER_ROLE.
     * @param to The address to receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
    
    /**
     * @dev Legacy mint function for owner (backward compatibility).
     * @param to The address to receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function ownerMint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Adds a teacher role to an address. Only callable by ADMIN_ROLE.
     * @param teacher The address to grant teacher role.
     */
    function addTeacher(address teacher) public onlyRole(ADMIN_ROLE) {
        _grantRole(TEACHER_ROLE, teacher);
        emit TeacherAdded(teacher);
    }
    
    /**
     * @dev Removes teacher role from an address. Only callable by ADMIN_ROLE.
     * @param teacher The address to revoke teacher role.
     */
    function removeTeacher(address teacher) public onlyRole(ADMIN_ROLE) {
        _revokeRole(TEACHER_ROLE, teacher);
        emit TeacherRemoved(teacher);
    }
    
    /**
     * @dev Adds a minter role to an address. Only callable by ADMIN_ROLE.
     * @param minter The address to grant minter role.
     */
    function addMinter(address minter) public onlyRole(ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Removes minter role from an address. Only callable by ADMIN_ROLE.
     * @param minter The address to revoke minter role.
     */
    function removeMinter(address minter) public onlyRole(ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, minter);
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Batch add teachers. Only callable by ADMIN_ROLE.
     * @param teachers Array of addresses to grant teacher role.
     */
    function addTeachersBatch(address[] calldata teachers) public onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < teachers.length; i++) {
            _grantRole(TEACHER_ROLE, teachers[i]);
            emit TeacherAdded(teachers[i]);
        }
    }
    
    /**
     * @dev Check if address has teacher role.
     * @param account The address to check.
     * @return Whether the address has teacher role.
     */
    function isTeacher(address account) public view returns (bool) {
        return hasRole(TEACHER_ROLE, account);
    }
    
    /**
     * @dev Check if address has minter role.
     * @param account The address to check.
     * @return Whether the address has minter role.
     */
    function isMinter(address account) public view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }
    
    /**
     * @dev Override supportsInterface to support AccessControl.
     * @param interfaceId The interface identifier.
     * @return Whether the interface is supported.
     */
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
