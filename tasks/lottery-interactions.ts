import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import { deploy, submit, initConfig, searchContract } from "./lib";

/**
 * npx hardhat lottery-add-nfts-to-rewards --tokenids <tokenids> --network localhost
 */

task("lottery-add-nfts-to-rewards", "Add NFTs to lottery's rewards")
    .addParam("tokenids", "ID of the NFTs (comma separated)")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const Lottery = await searchContract("Lottery", config.Lottery, ethers);
        const tokenIds = args.tokenids.split(',').map((e: string) => parseInt(e));
        await submit(Lottery.addToNftBatch(tokenIds));
        console.log(`NFT #${tokenIds.join(', #')} added to rewards`);

});

/**
 * npx hardhat lottery-get-nft-rewards --network localhost
 */

task("lottery-get-nft-rewards", "Get all nfts in the batch")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const Lottery = await searchContract("Lottery", config.Lottery, ethers);
        const length = (await Lottery.getNftBatchLength()).toNumber();

        if (length) {
            for (let i=0; i<Math.ceil(length/100); i++) {
                const nfts = await Lottery.getNftBatch(i*100, (i+1)*100);
                for (let j=0; j<nfts.length; j++) {
                    console.log(`NFT #${i*100+j} #${nfts[j]}`);
                }
            }
        } else {
            console.log("There are currently no NFT in the rewards");
        }

});

/**
 * npx hardhat lottery-start --network localhost
 */

task("lottery-start", "Starts the lottery")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const Lottery = await searchContract("Lottery", config.Lottery, ethers);
        await submit(Lottery.start());
        console.log("Lottery started");

});

/**
 * npx hardhat lottery-enter --addresses <addresses> --totals <totals> --network localhost
 */

task("lottery-enter", "Enter the lottery")
    .addParam("accounts", "Accounts to enter the lottery (comma separated)")
    .addParam("totals", "Total number of participations per account (comma separated)")
    .setAction(async (args, { ethers }) => {

        const accounts = args.accounts.split(',');
        const totals = args.totals.split(',');
        if (accounts.length != totals.length) {
            return console.log("accounts and totals arguments needs to have the same length");
        }

        const config = await initConfig(ethers);
        const Lottery = await searchContract("Lottery", config.Lottery, ethers);
        const signers = await ethers.getSigners();
        for (let i=0; i<accounts.length; i++) {
            const signer = signers[parseInt(accounts[i])];
            for (let j=0; j<parseInt(totals[i]); j++) {
                await submit(Lottery.connect(signer).enter({ value: ethers.utils.parseEther("0.01") }));
            }
            console.log(`${totals[i]} participations registered with ${await signer.getAddress()}`);
        }

});

/**
 * npx hardhat lottery-get-players --network localhost
 */

task("lottery-get-players", "Get all players")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const Lottery = await searchContract("Lottery", config.Lottery, ethers);
        const length = (await Lottery.getPlayersLength()).toNumber();

        if (length) {
            for (let i=0; i<Math.ceil(length/100); i++) {
                const players = await Lottery.getPlayers(i*100, (i+1)*100);
                for (let j=0; j<players.length; j++) {
                    console.log(`Player #${i*100+j} ${players[j]}`);
                }
            }
        } else {
            console.log("There are currently no player in the lottery");
        }

});

/**
 * npx hardhat lottery-end --network localhost
 */

task("lottery-end", "Ends the lottery")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const Lottery = await searchContract("Lottery", config.Lottery, ethers);
        const tx = await submit(Lottery.end());
        console.log("Lottery ended");
        const receipt = await tx.wait();
        const events = await Lottery.queryFilter("Winner", receipt.blockHash);
        for (let i=0; i<events.length; i++) {
            const date = new Date(events[i].args[2].toNumber() * 1000).toLocaleString();
            const address = events[i].args[0];
            const tokenId = events[i].args[1].toString();
            console.log(`${address} won NFT #${tokenId}`);
        }

});

/**
 * npx hardhat lottery-get-winners --network localhost
 */

task("lottery-get-winners", "Get the winners of the lottery")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const Lottery = await searchContract("Lottery", config.Lottery, ethers);
        const events = (await Lottery.queryFilter("Winner")).reverse();
        for (let i=0; i<events.length; i++) {
            const date = new Date(events[i].args[2].toNumber() * 1000).toLocaleString();
            const address = events[i].args[0];
            const tokenId = events[i].args[1].toString();
            console.log(`[${date}] ${address} won NFT #${tokenId}`);
        }

});

/**
 * npx hardhat lottery-withdraw --address <address> --network localhost
 */

task("lottery-withdraw", "Withdraw xRLC from the lottery")
    .addParam("address", "Address to send the xRLCs to")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const Lottery = await searchContract("Lottery", config.Lottery, ethers);
        const oldBalance = ethers.utils.formatEther(await ethers.provider.getBalance(config.Lottery));
        await submit(Lottery.withdraw(args.address));
        console.log(`${oldBalance} xRLCs sent to ${args.address}`);

});
