// test/AranduBadges.test.js
import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("AranduBadges Contract", function () {
    let badges;
    let deployer;
    let recipient;

    beforeEach(async function () {
        [deployer, recipient] = await ethers.getSigners();

        // Desplegar contrato
        const AranduBadges = await ethers.getContractFactory("AranduBadges");
        badges = await AranduBadges.deploy(deployer.address);
    });

    describe("Deployment", function () {
        it("should set correct name and symbol", async function () {
            expect(await badges.name()).to.equal("Arandu Badges");
            expect(await badges.symbol()).to.equal("ARB");
        });

        it("should set deployer as owner", async function () {
            expect(await badges.owner()).to.equal(deployer.address);
        });
    });

    describe("Minting Badges", function () {
        it("should mint a badge to recipient", async function () {
            const name = "Streak Champion";
            await badges.safeMint(recipient.address, name);

            expect(await badges.balanceOf(recipient.address)).to.equal(1);
            expect(await badges.ownerOf(0)).to.equal(recipient.address);
            expect(await badges.badgeName(0)).to.equal(name);
        });

        it("should increment token IDs", async function () {
            await badges.safeMint(recipient.address, "Badge 1");
            await badges.safeMint(recipient.address, "Badge 2");

            expect(await badges.badgeName(0)).to.equal("Badge 1");
            expect(await badges.badgeName(1)).to.equal("Badge 2");
        });

        it("should not allow non-owner to mint", async function () {
            const name = "Test Badge";
            await expect(badges.connect(recipient).safeMint(recipient.address, name)).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Soulbound (Non-Transferable)", function () {
        beforeEach(async function () {
            await badges.safeMint(recipient.address, "Test Badge");
        });

        it("should not allow transfer of badge", async function () {
            await expect(
                badges.connect(recipient).transferFrom(recipient.address, deployer.address, 0)
            ).to.be.revertedWith("AranduBadges: Badges are soulbound and cannot be transferred");
        });

        it("should not allow safeTransferFrom", async function () {
            await expect(
                badges.connect(recipient)["safeTransferFrom(address,address,uint256)"](recipient.address, deployer.address, 0)
            ).to.be.revertedWith("AranduBadges: Badges are soulbound and cannot be transferred");
        });
    });
});
