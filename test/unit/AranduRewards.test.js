import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("AranduRewards", function () {
    let deployer, teacher1, student1;
    let aranduRewards, anduToken, aranduCertificates;

    beforeEach(async function () {
        [deployer, teacher1, student1] = await ethers.getSigners();

        const ANDUToken = await ethers.getContractFactory("ANDUToken");
        anduToken = await ANDUToken.deploy(deployer.address);
        await anduToken.waitForDeployment();

        const AranduRewards = await ethers.getContractFactory("AranduRewards");
        aranduRewards = await AranduRewards.deploy(deployer.address);
        await aranduRewards.waitForDeployment();

        const AranduCertificates = await ethers.getContractFactory("AranduCertificates");
        aranduCertificates = await AranduCertificates.deploy(await aranduRewards.getAddress());
        await aranduCertificates.waitForDeployment();

        await aranduRewards.setAddresses(await anduToken.getAddress(), await aranduCertificates.getAddress());
    });

    describe("Deployment", function () {
        it("Should deploy and assign the owner correctly", async function () {
            expect(await aranduRewards.owner()).to.equal(deployer.address);
        });
    });

    describe("Set Addresses", function () {
        it("Should allow the owner to set addresses", async function () {
            await expect(aranduRewards.setAddresses(await anduToken.getAddress(), await aranduCertificates.getAddress())).to.not.be.reverted;
        });

        it("Should fail if a non-owner tries to set addresses", async function () {
            await expect(aranduRewards.connect(teacher1).setAddresses(await anduToken.getAddress(), await aranduCertificates.getAddress())).to.be.revertedWithCustomError(aranduRewards, "OwnableUnauthorizedAccount");
        });
    });

    describe("Grant Token Reward", function () {
        it("Should allow the owner to grant token rewards", async function () {
            // Transfer some tokens from deployer to rewards contract (simulating deployment)
            await anduToken.transfer(await aranduRewards.getAddress(), 100);
            await expect(aranduRewards.grantTokenReward(student1.address, 50)).to.not.be.reverted;
            expect(await anduToken.balanceOf(student1.address)).to.equal(50);
        });

        it("Should fail if a non-owner tries to grant token rewards", async function () {
            await expect(aranduRewards.connect(teacher1).grantTokenReward(student1.address, 50)).to.be.revertedWithCustomError(aranduRewards, "OwnableUnauthorizedAccount");
        });
    });

    describe("Initial Supply Distribution", function () {
        it("Should receive initial token supply from deployer", async function () {
            const initialSupply = ethers.parseEther("1000000"); // 1,000,000 tokens

            // Verify deployer has initial supply
            expect(await anduToken.balanceOf(deployer.address)).to.equal(initialSupply);

            // Transfer all tokens to rewards contract (simulating deployment)
            await anduToken.transfer(await aranduRewards.getAddress(), initialSupply);

            // Verify rewards contract received the tokens
            expect(await anduToken.balanceOf(await aranduRewards.getAddress())).to.equal(initialSupply);
            expect(await anduToken.balanceOf(deployer.address)).to.equal(0);
        });

        it("Should be able to distribute rewards after receiving initial supply", async function () {
            const initialSupply = ethers.parseEther("1000000");
            const rewardAmount = ethers.parseEther("100");

            // Transfer tokens to rewards contract
            await anduToken.transfer(await aranduRewards.getAddress(), initialSupply);

            // Grant reward to student
            await expect(aranduRewards.grantTokenReward(student1.address, rewardAmount)).to.not.be.reverted;

            // Verify student received the reward
            expect(await anduToken.balanceOf(student1.address)).to.equal(rewardAmount);

            // Verify rewards contract balance decreased
            expect(await anduToken.balanceOf(await aranduRewards.getAddress())).to.equal(initialSupply - rewardAmount);
        });
    });

    describe("Issue Certificate", function () {
        it("Should allow the owner to issue certificates", async function () {
            await expect(aranduRewards.issueCertificate(student1.address, "CertificateURI", "student")).to.not.be.reverted;
            expect(await aranduCertificates.ownerOf(0)).to.equal(student1.address);
        });

        it("Should fail if a non-owner tries to issue certificates", async function () {
            await expect(aranduRewards.connect(teacher1).issueCertificate(student1.address, "CertificateURI", "student")).to.be.revertedWithCustomError(aranduRewards, "OwnableUnauthorizedAccount");
        });
    });
});
