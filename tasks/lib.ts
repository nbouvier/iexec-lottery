import { BigNumber } from "ethers";
import fs from "fs";
import path from "path";

var Con: Record<string, string>;

export async function initConfig(ethers: any) {
    const environment: string = await getEnvironment(ethers);
    Con = require(`../config/config-${environment}.ts`).Con;
    return Con;
}

export const getCon = () => Con;

export async function getEnvironment(ethers: any) {
    while (!ethers.provider.network) {
        console.log("!ethers.provider.network sleep 1000");
        await sleep(1000);
    }
    return ethers.provider.network.chainId === 31337 ? "local" : ethers.provider.network.chainId === 133 ? "testnet" : "mainnet";
}

export async function deploy(name: string, SourceName: string, args: any[], ethers: any) {
    const KeyName = name;
    if (Con[KeyName]) return searchContract(SourceName, Con[KeyName], ethers);
    try {
        const Creater = await ethers.getContractFactory(SourceName);
        const creater = await Creater.deploy(...args);
        await creater.deployed();
        Con[KeyName] = creater.address;
        console.log(`deploy ${name} (${SourceName} at ${creater.address}`);
        saveConfig(ethers);
        return creater;
    } catch (e) {
        console.error(e, args);
        throw new Error(`${name}(${SourceName})`);
    }
}

export async function searchContract(name: string, address: string, ethers: any) {
    const abi = JSON.parse(fs.readFileSync(path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`)).toString()).abi;
    return ethers.getContractAt(abi, address);
}

export async function submit(handler: any) {
    const tx = await handler;
    await tx.wait();
    return tx;
}

export async function saveConfig(ethers: any) {
    fs.writeFileSync(
        path.join(__dirname, `../config/config-${await getEnvironment(ethers)}.ts`),
        `export const Con: Record<string, string> = ${JSON.stringify(Con, null, 2)}`,
        "utf-8"
    );
}

export function sleep(t = 100) {
    return new Promise((resolve) => setTimeout(resolve, t));
}

export const getChainNet = async (ethers: any) => {
    while (!ethers.provider.network) {
        console.log("!ethers.provider.network sleep 1000");
        await sleep(1000);
    }

    const isLocal = ethers.provider.network.chainId === 31337;
    const isViviani = ethers.provider.network.chainId === 133;
    const isTestNet = isLocal || isViviani;
    return { isLocal, isViviani, isTestNet };
};

export async function approve(_contract: any, _owner: string, _spender: string, _amount: BigNumber) {
    const approve: BigNumber = await _contract.allowance(_owner, _spender);
    if (_amount.gt(approve)) {
        console.log("approve:", _owner, _spender);
        return submit(_contract.approve(_spender, _amount.sub(approve)));
    }
}

const lib = { getEnvironment, initConfig, deploy, searchContract, submit, saveConfig, sleep, getChainNet, approve };

export default lib;
