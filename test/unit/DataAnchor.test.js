// test/DataAnchor.test.js
import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("DataAnchor Contract", function () {
    let dataAnchor;
    let deployer;
    let nonAdmin;

    beforeEach(async function () {
        [deployer, nonAdmin] = await ethers.getSigners();

        // Desplegar contrato
        const DataAnchor = await ethers.getContractFactory("DataAnchor");
        dataAnchor = await DataAnchor.deploy(deployer.address);
    });

    describe("Deployment", function () {
        it("should set deployer as owner", async function () {
            expect(await dataAnchor.owner()).to.equal(deployer.address);
        });
    });

    describe("Anchoring Hashes", function () {
        it("should allow owner to anchor a hash", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
            await expect(dataAnchor.anchorHash(hash)).to.not.be.reverted;
        });

        it("should store hash with timestamp and publisher", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
            const tx = await dataAnchor.anchorHash(hash);
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt.blockNumber);

            const anchorData = await dataAnchor.getAnchorData(hash);
            expect(anchorData.hash).to.equal(hash);
            expect(anchorData.publisher).to.equal(deployer.address);
            expect(anchorData.timestamp).to.be.closeTo(block.timestamp, 10);
        });

        it("should not allow anchoring the same hash twice", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
            await dataAnchor.anchorHash(hash);
            await expect(dataAnchor.anchorHash(hash)).to.be.revertedWith("Hash already anchored");
        });

        it("should not allow non-owner to anchor hash", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
            await expect(dataAnchor.connect(nonAdmin).anchorHash(hash)).to.be.revertedWithCustomError(dataAnchor, "OwnableUnauthorizedAccount");
        });
    });

    describe("Retrieving Data", function () {
        it("should allow anyone to retrieve anchor data", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
            await dataAnchor.anchorHash(hash);

            const anchorData = await dataAnchor.connect(nonAdmin).getAnchorData(hash);
            expect(anchorData.hash).to.equal(hash);
            expect(anchorData.publisher).to.equal(deployer.address);
        });

        it("should return empty data for non-anchored hash", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
            const anchorData = await dataAnchor.getAnchorData(hash);
            expect(anchorData.timestamp).to.equal(0);
            expect(anchorData.publisher).to.equal(ethers.ZeroAddress);
        });
    });
});
