// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./WrappedToken.sol";

/// @title Bridge Vault to lock TRX and mint wrapped tokens
contract BridgeVault {
    address public owner;
    WrappedToken public wrappedToken;

    event Locked(address indexed user, uint256 amount, string toChain, string toAddress);
    event Withdraw(address indexed to, uint256 amount);
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    constructor(address _wrappedToken) {
        owner = msg.sender;
        wrappedToken = WrappedToken(_wrappedToken);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // 🔒 Lock TRX and emit event to mint equivalent tokens on another chain
    function lock(string calldata toChain, string calldata toAddress) external payable {
        require(msg.value > 0, "No TRX sent");
        emit Locked(msg.sender, msg.value, toChain, toAddress);
    }

    // 🪙 Mint wrapped tokens for a recipient (bridge mint)
    function mintWrapped(address to, uint256 amount) external onlyOwner {
        wrappedToken.mint(to, amount);
        emit Minted(to, amount);
    }

    // 🔥 Burn wrapped tokens when moving back to original chain
    function burnWrapped(address from, uint256 amount) external onlyOwner {
        wrappedToken.burn(from, amount);
        emit Burned(from, amount);
    }

    // 💸 Withdraw native TRX from vault (owner only)
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        emit Withdraw(to, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
