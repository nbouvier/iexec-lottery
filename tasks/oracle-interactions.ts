import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import { deploy, submit, initConfig, searchContract, getChainNet } from "./lib";

/**
 * npx hardhat oracle-get-value --network localhost
 */

task("oracle-get-value", "Get the oracle value")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        if (!(await getChainNet(ethers)).isLocal) {
            console.log("oracle-get-value is only accessible for local developments");
            return;
        }
        const OracleTest = await searchContract("OracleTest", config.OracleTest, ethers);
        const oracleId = ethers.utils.arrayify(ethers.utils.solidityKeccak256([ "string" ], [ "oracleId" ]));
        const res = await OracleTest.getInt(oracleId);
        console.log(`Oracle value is ${res[0].toString()}`);

});

/**
 * npx hardhat oracle-set-value --value <value> --network localhost
 */

task("oracle-set-value", "Set the oracle value")
    .addParam("value", "Value to set the oracle to")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        if (!(await getChainNet(ethers)).isLocal) {
            console.log("oracle-set-value is only accessible for local developments");
            return;
        }
        const OracleTest = await searchContract("OracleTest", config.OracleTest, ethers);
        await submit(OracleTest.setInt(parseInt(args.value)));
        console.log(`Oracle value was set to ${args.value}`);

});

/**
 * npx hardhat oracle-storage-get-value --network localhost
 */

task("oracle-storage-get-value", "Get the oracle storage value")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const RngOracleStorage = await searchContract("RngOracleStorage", config.RngOracleStorage, ethers);
        const res = await RngOracleStorage.get();
        console.log(`OracleStorage value is ${res[0].toString()} [${new Date(res[1].toNumber() * 1000).toLocaleString()}]`);

});

/**
 * npx hardhat oracle-storage-fetch-value --network localhost
 */

task("oracle-storage-fetch-value", "Fetch a new value from the oracle to the oracle storage")
    .setAction(async (args, { ethers }) => {

        const config = await initConfig(ethers);
        const RngOracleStorage = await searchContract("RngOracleStorage", config.RngOracleStorage, ethers);
        await submit(RngOracleStorage.getOracleData());
        console.log(`Oracle value has been fetched`);

});
