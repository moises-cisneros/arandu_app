// test/HU07-DataTransparencyAnchor.test.js
import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("HU07 - Data Transparency Anchor", function () {
    let dataAnchor;
    let deployer;
    let creatorTeacher;

    beforeEach(async function () {
        [deployer, creatorTeacher] = await ethers.getSigners();

        // Desplegar contrato
        const DataAnchor = await ethers.getContractFactory("DataAnchor");
        dataAnchor = await DataAnchor.deploy(deployer.address);
    });

    describe("Anchoring 'Barómetro Educativo' Reports", function () {
        it("should allow the admin to post a new data hash on-chain", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("report data"));
            await expect(dataAnchor.anchorHash(hash)).to.not.be.reverted;
        });

        it("should correctly store the hash with the current timestamp and publisher address", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("report data"));
            const tx = await dataAnchor.anchorHash(hash);
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt.blockNumber);

            const anchorData = await dataAnchor.getAnchorData(hash);
            expect(anchorData.hash).to.equal(hash);
            expect(anchorData.publisher).to.equal(deployer.address);
            expect(anchorData.timestamp).to.be.closeTo(block.timestamp, 10); // Within 10 seconds
        });

        it("should prevent non-admin accounts from posting hashes", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("report data"));
            await expect(dataAnchor.connect(creatorTeacher).anchorHash(hash)).to.be.revertedWithCustomError(dataAnchor, "OwnableUnauthorizedAccount");
        });

        it("should allow anyone to retrieve the data associated with a hash", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("report data"));
            await dataAnchor.anchorHash(hash);

            const anchorData = await dataAnchor.connect(creatorTeacher).getAnchorData(hash);
            expect(anchorData.hash).to.equal(hash);
            expect(anchorData.publisher).to.equal(deployer.address);
        });
    });
});
