// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface Oracle {

    function getInt(bytes32) external view returns (int256, uint256);

}

contract RngOracleStorage {

    int256 public storedValue;
    uint256 public storedDate;

    bytes32 public oracleId;
    Oracle public oracleContract;

    event valueChanged(int256 newValue, uint256 newDate);

    constructor(address _oracleAddress, bytes32 _oracleId) {
        oracleId = _oracleId;
        oracleContract = Oracle(_oracleAddress);
    }

    function getOracleData() public {
        (int256 value, uint256 date) = oracleContract.getInt(oracleId);
        storedValue = value;
        storedDate = date;
        emit valueChanged(value, date);
    }

    function get() public view returns (int256, uint256) {
        return (storedValue, storedDate);
    }

}
