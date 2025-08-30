// test/HU02-StudentAsLearner.test.js
// User Story: "As a Student, I want to receive token rewards for my achievements and
// verifiable certificates for completing courses, so I feel motivated and can prove my accomplishments."

import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("HU02 - Student as Learner: Receiving Rewards and Certificates", function () {
    let deployer, creatorTeacher, buyerTeacher, student;
    let anduToken, aranduCertificates, aranduRewards;

    beforeEach(async function () {
        [deployer, creatorTeacher, buyerTeacher, student] = await ethers.getSigners();

        // Deploy contracts
        const ANDUToken = await ethers.getContractFactory("ANDUToken");
        anduToken = await ANDUToken.deploy(deployer.address);
        await anduToken.waitForDeployment();

        const AranduRewards = await ethers.getContractFactory("AranduRewards");
        aranduRewards = await AranduRewards.deploy(deployer.address);
        await aranduRewards.waitForDeployment();

        const AranduCertificates = await ethers.getContractFactory("AranduCertificates");
        aranduCertificates = await AranduCertificates.deploy(await aranduRewards.getAddress());
        await aranduCertificates.waitForDeployment();

        // Set addresses in AranduRewards
        await aranduRewards.setAddresses(await anduToken.getAddress(), await aranduCertificates.getAddress());
    });

    describe("Receiving Token Rewards", function () {
        context("when a student has just joined the platform", function () {
            it("should have zero ANDU token balance initially", async function () {
                expect(await anduToken.balanceOf(student.address)).to.equal(0);
            });
        });

        context("when the admin grants token rewards to a student", function () {
            it("should increase the student's ANDU balance correctly", async function () {
                // Fund AranduRewards contract first
                const rewardAmount = ethers.parseEther("50");
                await anduToken.transfer(await aranduRewards.getAddress(), rewardAmount);

                // Grant reward to student
                await aranduRewards.grantTokenReward(student.address, rewardAmount);

                // Verify balance
                expect(await anduToken.balanceOf(student.address)).to.equal(rewardAmount);
            });
        });
    });

    describe("Receiving Certificates", function () {
        context("when a student has just joined the platform", function () {
            it("should have zero certificate balance initially", async function () {
                expect(await aranduCertificates.balanceOf(student.address)).to.equal(0);
            });
        });

        context("when the admin issues a certificate to a student", function () {
            it("should mint one new NFT certificate to the student", async function () {
                const certUri = "https://example.com/certificate/1";

                // Issue certificate
                await aranduRewards.issueCertificate(student.address, certUri, "student");

                // Verify ownership
                expect(await aranduCertificates.balanceOf(student.address)).to.equal(1);
                expect(await aranduCertificates.ownerOf(0)).to.equal(student.address);
            });

            it("should set the correct tokenURI for the certificate", async function () {
                const certUri = "https://example.com/certificate/1";

                // Issue certificate
                await aranduRewards.issueCertificate(student.address, certUri, "student");

                // Verify URI
                expect(await aranduCertificates.tokenURI(0)).to.equal(certUri);
            });
        });
    });

    describe("Certificate Properties: Soulbound NFTs", function () {
        context("when a student tries to transfer their certificate", function () {
            it("should revert because certificates are soulbound and non-transferable", async function () {
                // Issue certificate first
                await aranduRewards.issueCertificate(student.address, "uri", "student");

                // Attempt transfer (should fail)
                await expect(
                    aranduCertificates.connect(student).transferFrom(student.address, creatorTeacher.address, 0)
                ).to.be.revertedWith("AranduCertificates: Certificates are soulbound and cannot be transferred");
            });
        });
    });
});
