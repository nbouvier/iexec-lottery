import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import { deploy, submit, initConfig, searchContract } from "./lib";

/**
 * npx hardhat nft-mint --total <total> --network localhost
 */

task("nft-mint", "Mint an NFT")
    .addParam("total", "Total number of mints")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const NFTContract = await searchContract("NFTContract", config.NFTContract, ethers);
        for(let i=0; i<parseInt(args.total); i++) {
            await submit(NFTContract.mint());
        }
        console.log(`Minted ${args.total} NFTs`);

});

/**
 * npx hardhat nft-approve --addresses <addresses> --network localhost
 */

task("nft-approve", "Approve an address")
    .addParam("addresses", "Addresses to approve (comma separated)")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const NFTContract = await searchContract("NFTContract", config.NFTContract, ethers);
        const addresses = args.addresses.split(',');
        for (let i=0; i<addresses.length; i++) {
            await submit(NFTContract.setApprovalForAll(addresses[i], true));
        }
        console.log(`Approved ${addresses.join(', ')}`);

});

/**
 * npx hardhat nft-get-owner --tokenids <tokenids> --network localhost
 */

task("nft-get-owner", "Get the owner of an NFT")
    .addParam("tokenids", "ID of the tokens to check (comma separated)")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const NFTContract = await searchContract("NFTContract", config.NFTContract, ethers);
        const tokenIds = args.tokenids.split(',');
        for (let i=0; i<tokenIds.length; i++) {
            const res = await NFTContract.ownerOf(parseInt(tokenIds[i]));
            console.log(`Owner of token #${tokenIds[i]} is ${res}`);
        }

});
