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
            await anduToken.mint(await aranduRewards.getAddress(), 100);
            await expect(aranduRewards.grantTokenReward(student1.address, 50)).to.not.be.reverted;
            expect(await anduToken.balanceOf(student1.address)).to.equal(50);
        });

        it("Should fail if a non-owner tries to grant token rewards", async function () {
            await expect(aranduRewards.connect(teacher1).grantTokenReward(student1.address, 50)).to.be.revertedWithCustomError(aranduRewards, "OwnableUnauthorizedAccount");
        });
    });

    describe("Issue Certificate", function () {
        it("Should allow the owner to issue certificates", async function () {
            await expect(aranduRewards.issueCertificate(student1.address, "CertificateURI")).to.not.be.reverted;
            expect(await aranduCertificates.ownerOf(0)).to.equal(student1.address);
        });

        it("Should fail if a non-owner tries to issue certificates", async function () {
            await expect(aranduRewards.connect(teacher1).issueCertificate(student1.address, "CertificateURI")).to.be.revertedWithCustomError(aranduRewards, "OwnableUnauthorizedAccount");
        });
    });
});
