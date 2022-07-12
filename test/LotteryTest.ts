import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";
import { deploy, submit } from "./lib";

const toWei = ethers.utils.parseEther;
const keccak256 = ethers.utils.solidityKeccak256;
const arrayify = ethers.utils.arrayify;

describe("Lottery", function () {

    let accounts: Signer[];
    let OracleTest: any;
    let RngOracleStorage: any;
    let NFTContract: any;
    let Lottery: any;

    before(async function() {
        accounts = await ethers.getSigners();

        OracleTest = await deploy("OracleTest");
        RngOracleStorage = await deploy("RngOracleStorage", [ OracleTest.address, arrayify(keccak256([ "string" ], [ "oracleId" ])) ]);
        NFTContract = await deploy("NFTContract");
        Lottery = await deploy("Lottery", [ NFTContract.address, RngOracleStorage.address ]);

        for(let i=0; i<10; i++) {
            await NFTContract.mint();
        }
        await NFTContract.setApprovalForAll(Lottery.address, true);
    });

    describe("#addToNftBatch()", function() {
        it("should transfer NFTs", async function() {
            await Lottery.addToNftBatch([ 1, 2 ]);
            expect(await NFTContract.ownerOf(1)).to.equal(Lottery.address);
            expect(await NFTContract.ownerOf(2)).to.equal(Lottery.address);
        });
        it("should revert if not owner", async function() {
            await expect(Lottery.connect(accounts[1]).addToNftBatch([ 3 ])).to.be.reverted;
        });
    });

    describe("#start()", function() {
        it("should revert if not owner", async function() {
            await expect(Lottery.connect(accounts[1]).start(5)).to.be.reverted;
        });
        it("should change lottery's state", async function() {
            await Lottery.start(5);
            expect(await Lottery.state()).to.equal(0);
        });
        it("should revert if lottery has already started", async function() {
            await expect(Lottery.start(5)).to.be.reverted;
        });
    });

    describe("#enter()", function() {
        it("should take fees", async function() {
            await Lottery.enter({ value: toWei("0.01") });
            await Lottery.connect(accounts[1]).enter({ value: toWei("0.01") });
            expect(await ethers.provider.getBalance(Lottery.address)).to.equal(toWei("0.02"));
        });
        it("should add participants", async function() {
            expect(await Lottery.players(0)).to.equal(await accounts[0].getAddress());
            expect(await Lottery.players(1)).to.equal(await accounts[1].getAddress());
        });
        it("should revert if not enough fees", async function() {
            await expect(Lottery.enter({ value: toWei("0.005") })).to.be.reverted;
        });
    });

    describe("#forceEnd()", function() {
        it("should revert if not owner", async function() {
            await expect(Lottery.connect(accounts[1]).forceEnd()).to.be.reverted;
        });
        it("should distribute NFTs", async function() {
            // 1 => NFT to accounts[0]   |   3 => NFT to accounts[1]
            // await OracleTest.setInt(1);
            await Lottery.forceEnd();
            expect(await NFTContract.ownerOf(1)).to.equal(await accounts[1].getAddress());
            expect(await NFTContract.ownerOf(2)).to.equal(await accounts[1].getAddress());
        });
        it("should change lottery's state", async function() {
            expect(await Lottery.state()).to.equal(2);
        });
        it("should revert if already ended", async function() {
            await expect(Lottery.forceEnd()).to.be.reverted;
        });
    });

    describe("#enter() - round 2", function() {
        before(async function() {
            await Lottery.addToNftBatch([ 3 ]);
            await Lottery.start(5);
        });

        it("should emit when max participant is reached", async function() {
            for(let i=0; i<4; i++) {
                await Lottery.connect(accounts[i]).enter({ value: toWei("0.01") });
            }
            await expect(Lottery.connect(accounts[4]).enter({ value: toWei("0.01") })).to.emit(Lottery, 'FulFillLottery');
        });
    });

});
