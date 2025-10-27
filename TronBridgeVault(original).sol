// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BridgeVault {
    address public owner;

    event Locked(address indexed user, uint256 amount, string toChain, string toAddress);
    event Withdraw(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function lock(string calldata toChain, string calldata toAddress) external payable {
        require(msg.value > 0, "No TRX sent");
        emit Locked(msg.sender, msg.value, toChain, toAddress);
    }

    function withdraw(address payable to, uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        emit Withdraw(to, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
