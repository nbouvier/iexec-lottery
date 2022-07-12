// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./RngOracleStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

interface IRngOracleStorage {

    function getOracleData() external;

    function get() external view returns (int256, uint256);

}

contract Lottery is ERC721Holder, Ownable {

    enum STATE { OPEN, PROCESSING, CLOSED }
    STATE public state = STATE.CLOSED;
    uint256 public entryFee;
    IERC721 public erc721Contract;
    IRngOracleStorage public oracleContract;
    uint256[] public nftBatch;
    address[] public players;
    uint256 public playerLimit;

    event FulFillLottery();

    constructor(address _erc721Address, address _oracleAddress) {
        entryFee = 0.01 ether;
        erc721Contract = IERC721(_erc721Address);
        oracleContract = IRngOracleStorage(_oracleAddress);
    }

    function addToNftBatch(uint256[] calldata tokenIds) external {
        require(state == STATE.CLOSED, "Lottery round is ongoing.");
        for(uint256 i=0; i<tokenIds.length; i++) {
            erc721Contract.safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            nftBatch.push(tokenIds[i]);
        }
    }

    function enter() external payable {
        require(msg.value >= entryFee, "Not enough RLC to enter.");
        require(state == STATE.OPEN, "Lottery hasn't started yet.");
        require(players.length < playerLimit, "Too many plarticipants.");
        players.push(msg.sender);

        if (players.length == playerLimit) {
            state = STATE.PROCESSING;
            emit FulFillLottery();
        }
    }

    function start(uint256 _playerLimit) external onlyOwner {
        require(state == STATE.CLOSED, "Lottery round is ongoing.");
        require(nftBatch.length > 0, "There are no prices to win ...");
        playerLimit = _playerLimit;
        state = STATE.OPEN;
    }

    function forceEnd() external onlyOwner {
        require(state == STATE.OPEN, "Lottery hasn't started yet.");
        state = STATE.PROCESSING;
        end();
    }

    function end() public {
        require(state == STATE.PROCESSING, "Should be processing.");

        for(uint256 i=0; i<nftBatch.length; i++) {
            erc721Contract.safeTransferFrom(address(this), getWinner(), nftBatch[i]);
        }

        nftBatch = new uint256[](0);
        players = new address[](0);

        state = STATE.CLOSED;
    }

    function getWinner() public returns (address) {
        oracleContract.getOracleData();
        (int256 rng, ) = oracleContract.get();
        return players[uint256(keccak256(abi.encode(rng))) % players.length];
    }

    function setOracleContract(address _oracleAddress) external onlyOwner {
        oracleContract = IRngOracleStorage(_oracleAddress);
    }

    function setErc721Contract(address _erc721Address) external onlyOwner {
        require(nftBatch.length == 0, "NFTs has already been sent.");
        require(state == STATE.CLOSED, "Lottery round is ongoing.");
        erc721Contract = IERC721(_erc721Address);
    }

    function setEntryFee(uint256 _entryFee) external onlyOwner {
        require(state == STATE.CLOSED, "Lottery round is ongoing.");
        entryFee = _entryFee;
    }

}
