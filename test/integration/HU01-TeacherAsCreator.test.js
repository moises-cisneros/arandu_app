// test/HU01-TeacherAsCreator.test.js
// User Story: "As a Creator Teacher, I want to register my educational content on the platform,
// manage it, and get paid when someone buys a license, so I can be rewarded for my work."

import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("HU01 - Teacher as Creator: Resource Creation and Management", function () {
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

    describe("Happy Path: Creating and Pricing Resources", function () {
        context("when a teacher creates a new resource", function () {
            it("should correctly assign ownership of master and license tokens to the creator", async function () {
                const initialSupply = 100;
                const uri = "https://example.com/resource";
                const royaltyBps = 1000; // 10%

                // Creator teacher creates resource
                await aranduResources.connect(creatorTeacher).createResource(initialSupply, uri, royaltyBps);

                // Verify master token (ID 0) ownership
                expect(await aranduResources.balanceOf(creatorTeacher.address, 0)).to.equal(1);
                // Verify license tokens (ID 1) ownership
                expect(await aranduResources.balanceOf(creatorTeacher.address, 1)).to.equal(initialSupply);
            });

            it("should allow the creator to set a price for their licenses", async function () {
                // First create resource
                await aranduResources.connect(creatorTeacher).createResource(50, "uri", 500);

                // Set price for license token (ID 1)
                const price = ethers.parseEther("10");
                await aranduResources.connect(creatorTeacher).setLicensePrice(1, price);

                // Note: No direct getter for price, but we can test by attempting a purchase later
                // This test ensures no revert occurs
            });

            it("should increase the creator's ANDU balance when a license is sold", async function () {
                // Setup: Create resource and set price
                await aranduResources.connect(creatorTeacher).createResource(10, "uri", 500);
                const price = ethers.parseEther("5");
                await aranduResources.connect(creatorTeacher).setLicensePrice(1, price);

                // Give buyer tokens and approve
                await anduToken.transfer(buyerTeacher.address, ethers.parseEther("10"));
                await anduToken.connect(buyerTeacher).approve(await aranduResources.getAddress(), ethers.parseEther("10"));

                // Record initial balances
                const initialCreatorBalance = await anduToken.balanceOf(creatorTeacher.address);

                // Buyer purchases license
                await aranduResources.connect(buyerTeacher).buyLicenses(1, 1);

                // Verify creator received payment
                const finalCreatorBalance = await anduToken.balanceOf(creatorTeacher.address);
                expect(finalCreatorBalance).to.equal(initialCreatorBalance + price);
            });
        });
    });

    describe("Failure/Edge Cases", function () {
        context("when a teacher tries to set price for a resource they don't own", function () {
            it("should revert with 'AranduResources: Not the creator'", async function () {
                // creatorTeacher creates resource
                await aranduResources.connect(creatorTeacher).createResource(10, "uri", 500);

                // buyerTeacher tries to set price (should fail)
                await expect(
                    aranduResources.connect(buyerTeacher).setLicensePrice(1, ethers.parseEther("10"))
                ).to.be.revertedWith("AranduResources: Not the creator");
            });
        });

        context("when a teacher creates multiple resources", function () {
            it("should create distinct resources with different token IDs", async function () {
                // Create first resource
                await aranduResources.connect(creatorTeacher).createResource(20, "uri1", 500);
                expect(await aranduResources.balanceOf(creatorTeacher.address, 0)).to.equal(1); // Master 0
                expect(await aranduResources.balanceOf(creatorTeacher.address, 1)).to.equal(20); // Licenses 1

                // Create second resource
                await aranduResources.connect(creatorTeacher).createResource(30, "uri2", 500);
                expect(await aranduResources.balanceOf(creatorTeacher.address, 2)).to.equal(1); // Master 2
                expect(await aranduResources.balanceOf(creatorTeacher.address, 3)).to.equal(30); // Licenses 3
            });
        });

        context("when a teacher updates the price of a license", function () {
            it("should allow the creator to update the price", async function () {
                // Create resource and set initial price
                await aranduResources.connect(creatorTeacher).createResource(10, "uri", 500);
                await aranduResources.connect(creatorTeacher).setLicensePrice(1, ethers.parseEther("5"));

                // Update price
                await aranduResources.connect(creatorTeacher).setLicensePrice(1, ethers.parseEther("8"));

                // Test with new price by purchasing
                await anduToken.transfer(buyerTeacher.address, ethers.parseEther("10"));
                await anduToken.connect(buyerTeacher).approve(await aranduResources.getAddress(), ethers.parseEther("10"));

                const initialCreatorBalance = await anduToken.balanceOf(creatorTeacher.address);
                await aranduResources.connect(buyerTeacher).buyLicenses(1, 1);
                const finalCreatorBalance = await anduToken.balanceOf(creatorTeacher.address);

                // Verify payment with updated price
                expect(finalCreatorBalance).to.equal(initialCreatorBalance + ethers.parseEther("8"));
            });
        });
    });
});
