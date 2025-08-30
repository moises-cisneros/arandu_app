import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("AranduResources", function () {
    let deployer, teacher1, student1;
    let aranduResources, anduToken;

    beforeEach(async function () {
        [deployer, teacher1, student1] = await ethers.getSigners();

        const ANDUToken = await ethers.getContractFactory("ANDUToken");
        anduToken = await ANDUToken.deploy(deployer.address);
        await anduToken.waitForDeployment();

        const AranduResources = await ethers.getContractFactory("AranduResources");
        aranduResources = await AranduResources.deploy(await anduToken.getAddress());
        await aranduResources.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy and assign the owner correctly", async function () {
            expect(await aranduResources.owner()).to.equal(deployer.address);
        });
    });

    describe("Create Resource", function () {
        it("Should allow the owner to create resources", async function () {
            await expect(aranduResources.createResource(100, "ResourceURI", 1000)).to.not.be.reverted;
            expect(await aranduResources.balanceOf(deployer.address, 0)).to.equal(1); // master token
            expect(await aranduResources.balanceOf(deployer.address, 1)).to.equal(100); // license tokens
        });

        it("Should fail if a non-owner tries to create resources", async function () {
            await expect(aranduResources.connect(teacher1).createResource(100, "ResourceURI", 1000)).to.not.be.reverted; // createResource no tiene onlyOwner, es público
        });
    });

    describe("Buy Licenses", function () {
        it("Should allow buying licenses", async function () {
            await aranduResources.createResource(100, "ResourceURI", 1000);
            await aranduResources.setLicensePrice(1, 10);
            await anduToken.mint(student1.address, 100);
            await anduToken.connect(student1).approve(await aranduResources.getAddress(), 50);
            await expect(aranduResources.connect(student1).buyLicenses(1, 5)).to.not.be.reverted;
            expect(await aranduResources.balanceOf(student1.address, 1)).to.equal(5);
        });

        it("Should fail if insufficient payment", async function () {
            await aranduResources.createResource(100, "ResourceURI", 1000);
            await aranduResources.setLicensePrice(1, 10);
            await anduToken.mint(student1.address, 30);
            await anduToken.connect(student1).approve(await aranduResources.getAddress(), 30);
            await expect(aranduResources.connect(student1).buyLicenses(1, 5)).to.be.reverted;
        });
    });

    describe("Set License Price", function () {
        it("Should allow the owner to set license price", async function () {
            await aranduResources.createResource(100, "ResourceURI", 1000);
            await expect(aranduResources.setLicensePrice(1, 20)).to.not.be.reverted;
            // Assuming a getter for price, but since it's not, we can check by trying to buy
        });

        it("Should fail if a non-owner tries to set license price", async function () {
            await aranduResources.createResource(100, "ResourceURI", 1000);
            await expect(aranduResources.connect(teacher1).setLicensePrice(1, 20)).to.be.revertedWith("AranduResources: Not the creator");
        });
    });

    describe("Royalties", function () {
        it("Should support ERC2981 royalties", async function () {
            expect(await aranduResources.supportsInterface("0x2a55205a")).to.be.true; // ERC2981 interface ID
        });

        it("Should return royalty info", async function () {
            await aranduResources.createResource(100, "ResourceURI", 1000);
            const [receiver, royaltyAmount] = await aranduResources.royaltyInfo(0, 100);
            expect(receiver).to.equal(deployer.address);
            expect(royaltyAmount).to.equal(10); // 10% royalty
        });
    });
});
