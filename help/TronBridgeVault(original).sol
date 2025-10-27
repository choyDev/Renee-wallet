// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWrappedToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract BridgeVault {
    address public owner;
    address public wrappedToken;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event Locked(address indexed user, uint256 amount, string toChain, string toAddress);
    event Withdraw(address indexed to, uint256 amount);

    constructor(address _wrappedToken) {
        owner = msg.sender;
        wrappedToken = _wrappedToken;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function lock(string calldata toChain, string calldata toAddress) external payable {
        require(msg.value > 0, "No TRX sent");
        emit Locked(msg.sender, msg.value, toChain, toAddress);
    }

    function mintTo(address to, uint256 amount) external onlyOwner {
        IWrappedToken(wrappedToken).mint(to, amount);
        emit Minted(to, amount);
    }

    function burnFrom(address from, uint256 amount) external onlyOwner {
        IWrappedToken(wrappedToken).burn(from, amount);
        emit Burned(from, amount);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Not enough TRX");
        to.transfer(amount);
        emit Withdraw(to, amount);
    }
}
