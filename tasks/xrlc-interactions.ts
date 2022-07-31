import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import { deploy, submit, initConfig, searchContract } from "./lib";

/**
 * npx hardhat xrlc-balance --addresses <addresses> --network localhost
 */

task("xrlc-balance", "Get the balance of addresses")
    .addParam("addresses", "Addresses to get the balance of (comma separated)")
    .setAction(async (args, { ethers }) => {

        const addresses = args.addresses.split(',');
        for (let i=0; i<addresses.length; i++) {
            const balance = ethers.utils.formatEther(await ethers.provider.getBalance(addresses[i]));
            console.log(`Balance of ${addresses[i]} is ${balance} xRLC`);
        }

});
