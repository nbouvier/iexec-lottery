import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";
import { deploy, submit } from "./lib";

const toWei = ethers.utils.parseEther;
const keccak256 = ethers.utils.solidityKeccak256;
const arrayify = ethers.utils.arrayify;
const bnArrayFrom = (array: number[]) => array.map((el: number) => BigNumber.from(el));

/**
 * npx hardhat test
 */

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

    describe("#getNftBatchLength()", function() {
        it("should return the number of nft in the batch", async function() {
            expect(await Lottery.getNftBatchLength()).to.equal(2);
        });
    });

    describe("#getNftBatch()", function() {
        it("should return nfts", async function() {
            expect(await Lottery.getNftBatch(0, 1)).to.deep.equal(bnArrayFrom([ 1 ]));
            expect(await Lottery.getNftBatch(0, 2)).to.deep.equal(bnArrayFrom([ 1, 2 ]));
        });
        it("should return nothing is from > nftBatch.length", async function() {
            expect(await Lottery.getNftBatch(2, 2)).to.deep.equal(bnArrayFrom([]));
            expect(await Lottery.getNftBatch(5, 1)).to.deep.equal(bnArrayFrom([]));
        });
        it("should ues to = nftBatch.length if to == 0 or to > nftBatch.length", async function() {
            expect(await Lottery.getNftBatch(1, 0)).to.deep.equal(bnArrayFrom([ 2 ]));
            expect(await Lottery.getNftBatch(0, 5)).to.deep.equal(bnArrayFrom([ 1, 2 ]));
        });
    });

    describe("#start()", function() {
        it("should revert if not owner", async function() {
            await expect(Lottery.connect(accounts[1]).start()).to.be.reverted;
        });
        it("should change lottery's state", async function() {
            await Lottery.start();
            expect(await Lottery.state()).to.equal(0);
        });
        it("should revert if lottery has already started", async function() {
            await expect(Lottery.start()).to.be.reverted;
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

    describe("#getPlayersLength()", function() {
        it("should return the number of players participating", async function() {
            expect(await Lottery.getNftBatchLength()).to.equal(2);
        });
    });

    describe("#getPlayers()", function() {
        let accountsAddress: string[];

        before(async function() {
            accountsAddress = [
                await accounts[0].getAddress(),
                await accounts[1].getAddress()
            ];
        });

        it("should return players", async function() {
            expect(await Lottery.getPlayers(0, 1)).to.deep.equal([ accountsAddress[0] ]);
            expect(await Lottery.getPlayers(0, 2)).to.deep.equal([ accountsAddress[0], accountsAddress[1] ]);
        });
        it("should return nothing if from > players.length", async function() {
            expect(await Lottery.getPlayers(2, 2)).to.deep.equal([]);
            expect(await Lottery.getPlayers(5, 1)).to.deep.equal([]);
        });
        it("should ues to = players.length if to == 0 or to > players.length", async function() {
            expect(await Lottery.getPlayers(1, 0)).to.deep.equal([ accountsAddress[1] ]);
            expect(await Lottery.getPlayers(0, 5)).to.deep.equal([ accountsAddress[0], accountsAddress[1] ]);
        });
    });

    describe("#end()", function() {
        it("should revert if not owner", async function() {
            await expect(Lottery.connect(accounts[1]).end()).to.be.reverted;
        });
        it("should emit Winner event", async function() {
            // oracle = 1 => NFT #1 to accounts[0] & NFT #2 to accounts[1]
            // await OracleTest.setInt(1);
            // oracle = 3 => NFT #1 to accounts[1] & NFT #2 to accounts[0]
            await expect(Lottery.end()).to
                .emit(Lottery, "Winner")/* .withNamedArgs({ _address: await accounts[1].getAddress(), tokenId: 1 }) */ // This does not seems to work with hardhat
                .emit(Lottery, "Winner")/* .withNamedArgs({ _address: await accounts[0].getAddress(), tokenId: 2 }); */
        });
        it("should distribute NFTs", async function() {
            expect(await NFTContract.ownerOf(1)).to.equal(await accounts[1].getAddress());
            expect(await NFTContract.ownerOf(2)).to.equal(await accounts[0].getAddress());
        });
        it("should change lottery's state", async function() {
            expect(await Lottery.state()).to.equal(2);
        });
        it("should empty nftBatch array", async function() {
            expect(await Lottery.getNftBatchLength()).to.equal(0);
        });
        it("should empty players array", async function() {
            expect(await Lottery.getPlayersLength()).to.equal(0);
        });
        it("should revert if already ended", async function() {
            await expect(Lottery.end()).to.be.reverted;
        });
    });

    describe("#withdraw()", function() {
        let account1Address: string;

        before(async function() {
            account1Address = await accounts[1].getAddress();
        });

        it("should revert if not owner", async function() {
            await expect(Lottery.connect(accounts[1]).withdraw(account1Address)).to.be.reverted;
        });
        it("should send RLC to address", async function() {
            const oldBalance = await ethers.provider.getBalance(account1Address);
            await Lottery.withdraw(account1Address);
            expect(await ethers.provider.getBalance(account1Address)).to.equal(oldBalance.add(toWei("0.02")));
        });
    });

});
