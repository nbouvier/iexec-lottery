import { ethers } from "hardhat";

export async function deploy(name: string, args: any[] = []) {
    const Creater = await ethers.getContractFactory(name);
    const creater = await Creater.deploy(...args);
    await creater.deployed();
    return creater;
}

export async function submit(handler: any) {
    const tx = await handler;
    await tx.wait();
}

export function sleep(t = 100) {
    return new Promise((resolve) => setTimeout(resolve, t));
}

const lib = { deploy, submit, sleep };

export default lib;
