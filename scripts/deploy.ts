import hardhat, { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import lib from './lib';

/**
 * npx hardhat run scripts/deploy.ts --network localhost
 */

const arrayify = ethers.utils.arrayify;

async function main() {

    await hardhat.run('compile');
    const config = await lib.initConfig();
    const accounts = await ethers.getSigners();
    const env = await lib.getChainNet();

    if(env.isLocal) {
        await lib.deploy("OracleTest");
    }
    const oracleAddress = env.isLocal ? config.OracleTest : config.Oracle;
    const RngOracleStorage = await lib.deploy("RngOracleStorage", [ oracleAddress, arrayify(config.OracleId) ]);
    const NFTContract = await lib.deploy("NFTContract");
    await lib.deploy("Lottery", [ config.NFTContract, config.RngOracleStorage ]);

    if(env.isTestNet) {
        console.log('Fetching Oracle from RngOracleStorage');
        await lib.submit(RngOracleStorage.getOracleData());

        console.log(`Minting 10 NFTs from NFTContract to ${await accounts[0].getAddress()}`);
        for (let i=0; i<10; i++) {
            await lib.submit(NFTContract.mint());
        }
        console.log(`Approving Lottery contract for NFTContract by ${await accounts[0].getAddress()}`);
        await lib.submit(NFTContract.setApprovalForAll(config.Lottery, true));
    }

}

main();
