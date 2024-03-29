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

    event Winner(address indexed _address, uint256 indexed _tokenId, uint256 _timestamp);

    constructor(address _erc721Address, address _oracleAddress) {
        entryFee = 0.01 ether;
        erc721Contract = IERC721(_erc721Address);
        oracleContract = IRngOracleStorage(_oracleAddress);
    }

    function addToNftBatch(uint256[] calldata tokenIds) external {
        require(state == STATE.CLOSED, "Lottery round is ongoing.");
        require(nftBatch.length + tokenIds.length <= 256, "NFT batch cannot hold more than 256 NFTs");
        for(uint256 i=0; i<tokenIds.length; i++) {
            erc721Contract.safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            nftBatch.push(tokenIds[i]);
        }
    }

    function enter() external payable {
        require(msg.value >= entryFee, "Not enough RLC to enter.");
        require(state == STATE.OPEN, "Lottery hasn't started yet.");
        players.push(msg.sender);
    }

    function start() external onlyOwner {
        require(state == STATE.CLOSED, "Lottery round is ongoing.");
        require(nftBatch.length > 0, "There are no prices to win ...");
        state = STATE.OPEN;
    }

    function end() external onlyOwner {
        require(state == STATE.OPEN, "Lottery should be open.");
        require(players.length > 0, "Lottery should have at least one participant.");
        state = STATE.CLOSED;

        oracleContract.getOracleData();
        (int256 seed, ) = oracleContract.get();
        uint256 rng = getRng(uint256(seed));
        for(uint256 i=0; i<nftBatch.length; i++) {
            address winner = players[rng % players.length];
            erc721Contract.safeTransferFrom(address(this), winner, nftBatch[i]);
            emit Winner(winner, nftBatch[i], block.timestamp);
            rng = getRng(rng);
        }

        nftBatch = new uint256[](0);
        players = new address[](0);
    }

    function getRng(uint256 _seed) private returns (uint256 rng_) {
        return uint256(keccak256(abi.encode(_seed)));
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

    function getNftBatchLength() external view returns (uint256 length_) {
        return nftBatch.length;
    }

    function getNftBatch(uint256 _from, uint256 _to) external view returns (uint256[] memory nftBatch_) {
        if (_to == 0 || _to > nftBatch.length) _to = nftBatch.length;
        if (_from > nftBatch.length) _from = _to;

        nftBatch_ = new uint256[](_to - _from);
        for (uint256 i=0; i<_to - _from; i++) {
            nftBatch_[i] = nftBatch[i + _from];
        }
    }

    function getPlayersLength() external view returns (uint256 length_) {
        return players.length;
    }

    function getPlayers(uint256 _from, uint256 _to) external view returns (address[] memory players_) {
        if (_to == 0 || _to > players.length) _to = players.length;
        if (_from > players.length) _from = _to;

        players_ = new address[](_to - _from);
        for (uint256 i=0; i<_to - _from; i++) {
            players_[i] = players[i + _from];
        }
    }

    function withdraw(address payable _address) external onlyOwner {
        _address.transfer(address(this).balance);
    }

}
