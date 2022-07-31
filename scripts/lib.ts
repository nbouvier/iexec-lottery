import { BigNumber } from "ethers";
import { artifacts, ethers } from "hardhat";
import fs from "fs";
import path from "path";

var Con: Record<string, string>;

export async function initConfig() {
  const environment: string = await getEnvironment();
  Con = require(`../config/config-${environment}.ts`).Con;
  return Con;
}

export const getCon = () => Con;

export async function getEnvironment() {
  while (!ethers.provider.network) {
    console.log("!ethers.provider.network sleep 1000");
    await sleep(1000);
  }

  return ethers.provider.network.chainId === 31337 ? "local" : ethers.provider.network.chainId === 97 ? "testnet" : "mainnet";
}

export async function deploy(name: string, args: any[] = [], sourceName: string = "") {
  const KeyName = name;
  sourceName = sourceName || name;
  if (Con[KeyName]) return searchContract(sourceName, Con[KeyName]);
  try {
    const Creater = await ethers.getContractFactory(sourceName);
    const creater = await Creater.deploy(...args);
    await creater.deployed();
    Con[KeyName] = creater.address;
    console.log("deploy", name, sourceName, creater.address);
    saveConfig();
    return creater;
  } catch (e) {
    console.error(e, args);
    throw new Error(`${name}(${sourceName})`);
  }
}

export async function searchContract(name: string, address: string) {
  const Code = await artifacts.readArtifact(name);
  return ethers.getContractAt(Code.abi, address);
}

export async function submit(handler: any) {
  const tx = await handler;
  await tx.wait();
  return tx;
}

export async function saveConfig() {
  fs.writeFileSync(
    path.join(__dirname, `../config/config-${await getEnvironment()}.ts`),
    `export const Con: Record<string, string> = ${JSON.stringify(Con, null, 2)}`,
    "utf-8"
  );
}

export function sleep(t = 100) {
  return new Promise((resolve) => setTimeout(resolve, t));
}

export const getChainNet = async () => {
  while (!ethers.provider.network) {
    console.log("!ethers.provider.network sleep 1000");
    await sleep(1000);
  }

  const isLocal = ethers.provider.network.chainId === 31337;
  const isViviani = ethers.provider.network.chainId === 133;
  const isTestNet = isLocal || isViviani;
  return { isLocal, isViviani, isTestNet };
}

const utils = { getEnvironment, initConfig, deploy, searchContract, submit, saveConfig, sleep, getChainNet };

export default utils;
