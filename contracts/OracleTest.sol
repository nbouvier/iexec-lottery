// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract OracleTest {

    int256 public number;

    constructor() {
        number = 3;
    }

    function setInt(int256 _number) external {
        number = _number;
    }

    function getInt(bytes32) external view returns (int256, uint256) {
        return (number, block.timestamp);
    }

}
