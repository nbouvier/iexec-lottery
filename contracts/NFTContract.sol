// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract NFTContract is ERC721Enumerable, Ownable {

    constructor() ERC721('Random NFT', 'RNFT') { }

    function mint() public onlyOwner {
        uint256 tokenId = totalSupply() + 1;
        _safeMint(msg.sender, tokenId);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/ipfs/nft-contract/";
    }

}
