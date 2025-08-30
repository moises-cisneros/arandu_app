// test/HU04-TeacherAsConsumer.test.js
// User Story: "As a Consumer Teacher, I want to browse available resources, approve token spending securely,
// and purchase licenses to use high-quality content in my classroom."

import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("HU04 - Teacher as Consumer: Browsing and Purchasing Licenses", function () {
    let deployer, creatorTeacher, buyerTeacher, student;
    let anduToken, aranduResources;

    beforeEach(async function () {
        [deployer, creatorTeacher, buyerTeacher, student] = await ethers.getSigners();

        // Deploy contracts
        const ANDUToken = await ethers.getContractFactory("ANDUToken");
        anduToken = await ANDUToken.deploy(deployer.address);
        await anduToken.waitForDeployment();

        const AranduResources = await ethers.getContractFactory("AranduResources");
        aranduResources = await AranduResources.deploy(await anduToken.getAddress());
        await aranduResources.waitForDeployment();
    });

    describe("Purchase Happy Path", function () {
        context("when a teacher wants to purchase a license", function () {
            it("should complete the full purchase flow correctly", async function () {
                // Setup: Creator creates resource and sets price
                await aranduResources.connect(creatorTeacher).createResource(10, "uri", 500);
                const price = ethers.parseEther("5");
                await aranduResources.connect(creatorTeacher).setLicensePrice(1, price);

                // Check initial balances
                const initialBuyerAndu = await anduToken.balanceOf(buyerTeacher.address);
                const initialBuyerLicenses = await aranduResources.balanceOf(buyerTeacher.address, 1);
                const initialCreatorAndu = await anduToken.balanceOf(creatorTeacher.address);
                const initialCreatorLicenses = await aranduResources.balanceOf(creatorTeacher.address, 1);

                // Buyer gets tokens and approves spending
                await anduToken.transfer(buyerTeacher.address, ethers.parseEther("10"));
                await anduToken.connect(buyerTeacher).approve(await aranduResources.getAddress(), ethers.parseEther("10"));

                // Buyer purchases 2 licenses
                const quantity = 2;
                await aranduResources.connect(buyerTeacher).buyLicenses(1, quantity);

                // Verify final balances
                const finalBuyerAndu = await anduToken.balanceOf(buyerTeacher.address);
                const finalBuyerLicenses = await aranduResources.balanceOf(buyerTeacher.address, 1);
                const finalCreatorAndu = await anduToken.balanceOf(creatorTeacher.address);
                const finalCreatorLicenses = await aranduResources.balanceOf(creatorTeacher.address, 1);

                expect(finalBuyerAndu).to.equal(initialBuyerAndu - price * BigInt(quantity));
                expect(finalBuyerLicenses).to.equal(initialBuyerLicenses + BigInt(quantity));
                expect(finalCreatorAndu).to.equal(initialCreatorAndu + price * BigInt(quantity));
                expect(finalCreatorLicenses).to.equal(initialCreatorLicenses - BigInt(quantity));
            });
        });
    });

    describe("Failure/Edge Cases", function () {
        context("when a buyer has not approved enough tokens", function () {
            it("should revert the purchase", async function () {
                // Setup resource
                await aranduResources.connect(creatorTeacher).createResource(10, "uri", 500);
                await aranduResources.connect(creatorTeacher).setLicensePrice(1, ethers.parseEther("5"));

                // Buyer gets tokens but approves less than needed
                await anduToken.transfer(buyerTeacher.address, ethers.parseEther("10"));
                await anduToken.connect(buyerTeacher).approve(await aranduResources.getAddress(), ethers.parseEther("2")); // Only 2, need 5

                // Purchase should fail
                await expect(
                    aranduResources.connect(buyerTeacher).buyLicenses(1, 1)
                ).to.be.reverted; // ERC20InsufficientAllowance or similar
            });
        });

        context("when a buyer has insufficient ANDU tokens", function () {
            it("should revert the purchase", async function () {
                // Setup resource
                await aranduResources.connect(creatorTeacher).createResource(10, "uri", 500);
                await aranduResources.connect(creatorTeacher).setLicensePrice(1, ethers.parseEther("100"));

                // Buyer approves but doesn't have enough tokens
                await anduToken.connect(buyerTeacher).approve(await aranduResources.getAddress(), ethers.parseEther("100"));

                // Purchase should fail
                await expect(
                    aranduResources.connect(buyerTeacher).buyLicenses(1, 1)
                ).to.be.reverted; // ERC20InsufficientAllowance
            });
        });

        context("when trying to buy a license that doesn't exist or has no price", function () {
            it("should revert with 'AranduResources: Price not set'", async function () {
                // Create resource but don't set price
                await aranduResources.connect(creatorTeacher).createResource(10, "uri", 500);

                // Buyer tries to buy license with no price set
                await expect(
                    aranduResources.connect(buyerTeacher).buyLicenses(1, 1)
                ).to.be.revertedWith("AranduResources: Price not set");
            });
        });

        context("when trying to buy more licenses than available", function () {
            it("should revert with 'AranduResources: Insufficient licenses'", async function () {
                // Setup resource with only 5 licenses
                await aranduResources.connect(creatorTeacher).createResource(5, "uri", 500);
                await aranduResources.connect(creatorTeacher).setLicensePrice(1, ethers.parseEther("1"));

                // Buyer tries to buy 10 licenses (more than available)
                await anduToken.transfer(buyerTeacher.address, ethers.parseEther("20"));
                await anduToken.connect(buyerTeacher).approve(await aranduResources.getAddress(), ethers.parseEther("20"));

                await expect(
                    aranduResources.connect(buyerTeacher).buyLicenses(1, 10)
                ).to.be.revertedWith("AranduResources: Insufficient licenses");
            });
        });
    });
});
