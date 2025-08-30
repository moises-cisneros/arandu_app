import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("ANDUToken", function () {
    let deployer, teacher1;
    let anduToken;

    beforeEach(async function () {
        [deployer, teacher1] = await ethers.getSigners();

        const ANDUToken = await ethers.getContractFactory("ANDUToken");
        anduToken = await ANDUToken.deploy(deployer.address);
        await anduToken.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy and assign the owner correctly", async function () {
            expect(await anduToken.owner()).to.equal(deployer.address);
        });
    });

    describe("Permissions", function () {
        it("Should only allow the owner to mint tokens", async function () {
            await expect(anduToken.mint(teacher1.address, 100)).to.not.be.reverted;
        });

        it("Should fail if a non-owner tries to mint", async function () {
            await expect(anduToken.connect(teacher1).mint(teacher1.address, 100)).to.be.revertedWithCustomError(anduToken, "OwnableUnauthorizedAccount");
        });
    });
});
