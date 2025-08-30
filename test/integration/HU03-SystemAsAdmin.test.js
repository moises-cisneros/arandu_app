// test/HU03-SystemAsAdmin.test.js
// User Story: "As the System Administrator (Backend), I want to have exclusive control
// over critical functions like issuing rewards and certificates, to maintain the integrity and rules of the platform."

import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("HU03 - System as Admin: Exclusive Control Over Critical Functions", function () {
    let deployer, creatorTeacher, buyerTeacher, student;
    let anduToken, aranduCertificates, aranduRewards, aranduResources;

    beforeEach(async function () {
        [deployer, creatorTeacher, buyerTeacher, student] = await ethers.getSigners();

        // Deploy all contracts
        const ANDUToken = await ethers.getContractFactory("ANDUToken");
        anduToken = await ANDUToken.deploy(deployer.address);
        await anduToken.waitForDeployment();

        const AranduRewards = await ethers.getContractFactory("AranduRewards");
        aranduRewards = await AranduRewards.deploy(deployer.address);
        await aranduRewards.waitForDeployment();

        const AranduCertificates = await ethers.getContractFactory("AranduCertificates");
        aranduCertificates = await AranduCertificates.deploy(await aranduRewards.getAddress());
        await aranduCertificates.waitForDeployment();

        const AranduResources = await ethers.getContractFactory("AranduResources");
        aranduResources = await AranduResources.deploy(await anduToken.getAddress());
        await aranduResources.waitForDeployment();

        // Set addresses in AranduRewards
        await aranduRewards.setAddresses(await anduToken.getAddress(), await aranduCertificates.getAddress());
    });

    describe("Permission Tests: onlyOwner Modifiers", function () {
        context("when testing ANDUToken mint function", function () {
            it("should succeed when called by deployer (owner)", async function () {
                await expect(anduToken.mint(creatorTeacher.address, ethers.parseEther("100"))).to.not.be.reverted;
            });

            it("should revert when called by non-owner", async function () {
                await expect(
                    anduToken.connect(creatorTeacher).mint(creatorTeacher.address, ethers.parseEther("100"))
                ).to.be.revertedWithCustomError(anduToken, "OwnableUnauthorizedAccount");
            });
        });

        context("when testing AranduCertificates safeMint function", function () {
            it("should succeed when called by AranduRewards (which is owned by deployer)", async function () {
                await expect(aranduRewards.issueCertificate(student.address, "uri")).to.not.be.reverted;
            });

            it("should revert when called directly by non-owner", async function () {
                await expect(
                    aranduCertificates.connect(creatorTeacher).safeMint(student.address, "uri")
                ).to.be.revertedWithCustomError(aranduCertificates, "OwnableUnauthorizedAccount");
            });
        });

        context("when testing AranduRewards setAddresses function", function () {
            it("should succeed when called by deployer", async function () {
                await expect(
                    aranduRewards.setAddresses(await anduToken.getAddress(), await aranduCertificates.getAddress())
                ).to.not.be.reverted;
            });

            it("should revert when called by non-owner", async function () {
                await expect(
                    aranduRewards.connect(creatorTeacher).setAddresses(await anduToken.getAddress(), await aranduCertificates.getAddress())
                ).to.be.revertedWithCustomError(aranduRewards, "OwnableUnauthorizedAccount");
            });
        });

        context("when testing AranduRewards grantTokenReward function", function () {
            it("should succeed when called by deployer", async function () {
                // Fund contract first
                await anduToken.transfer(await aranduRewards.getAddress(), ethers.parseEther("50"));
                await expect(aranduRewards.grantTokenReward(student.address, ethers.parseEther("50"))).to.not.be.reverted;
            });

            it("should revert when called by non-owner", async function () {
                await expect(
                    aranduRewards.connect(creatorTeacher).grantTokenReward(student.address, ethers.parseEther("50"))
                ).to.be.revertedWithCustomError(aranduRewards, "OwnableUnauthorizedAccount");
            });
        });

        context("when testing AranduRewards issueCertificate function", function () {
            it("should succeed when called by deployer", async function () {
                await expect(aranduRewards.issueCertificate(student.address, "uri")).to.not.be.reverted;
            });

            it("should revert when called by non-owner", async function () {
                await expect(
                    aranduRewards.connect(creatorTeacher).issueCertificate(student.address, "uri")
                ).to.be.revertedWithCustomError(aranduRewards, "OwnableUnauthorizedAccount");
            });
        });
    });

    describe("Initial Setup and Funding", function () {
        context("upon deployment of ANDUToken", function () {
            it("should mint the initial supply to the deployer's address", async function () {
                const initialSupply = await anduToken.totalSupply();
                expect(await anduToken.balanceOf(deployer.address)).to.equal(initialSupply);
            });
        });

        context("when funding the AranduRewards treasury", function () {
            it("should correctly transfer tokens to the contract", async function () {
                const treasuryAmount = ethers.parseEther("1000");
                await anduToken.transfer(await aranduRewards.getAddress(), treasuryAmount);

                expect(await anduToken.balanceOf(await aranduRewards.getAddress())).to.equal(treasuryAmount);
            });
        });
    });
});
