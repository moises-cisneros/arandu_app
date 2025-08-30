// test/AranduMarketplace.test.js
import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("AranduMarketplace Contract", function () {
    let marketplace;
    let resources;
    let anduToken;
    let deployer;
    let seller;
    let buyer;

    beforeEach(async function () {
        [deployer, seller, buyer] = await ethers.getSigners();

        // Desplegar contratos dependientes
        const ANDUToken = await ethers.getContractFactory("ANDUToken");
        anduToken = await ANDUToken.deploy(deployer.address);

        const AranduResources = await ethers.getContractFactory("AranduResources");
        resources = await AranduResources.deploy(anduToken.target);

        const AranduMarketplace = await ethers.getContractFactory("AranduMarketplace");
        marketplace = await AranduMarketplace.deploy(deployer.address);

        // Configurar direcciones
        await marketplace.setAddresses(resources.target, anduToken.target);

        // Crear un recurso y dar aprobación
        await resources.connect(seller).createResource(10, "https://arandu.com/resource/1", 500);
        await resources.connect(seller).setApprovalForAll(marketplace.target, true);

        // Dar tokens al comprador
        await anduToken.mint(buyer.address, ethers.parseEther("1000"));
        await anduToken.connect(buyer).approve(marketplace.target, ethers.parseEther("1000"));
    });

    describe("Setup", function () {
        it("should set NFT and token addresses correctly", async function () {
            expect(await marketplace.resourceNftAddress()).to.equal(resources.target);
            expect(await marketplace.anduTokenAddress()).to.equal(anduToken.target);
        });
    });

    describe("Listing Items", function () {
        it("should list an item for sale", async function () {
            const tokenId = 1; // License token
            const price = ethers.parseEther("10");

            await marketplace.connect(seller).listItem(tokenId, price);
            expect(await marketplace.itemPrices(tokenId)).to.equal(price);
            expect(await marketplace.itemSellers(tokenId)).to.equal(seller.address);
        });

        it("should not list if NFT not approved", async function () {
            // Remover aprobación
            await resources.connect(seller).setApprovalForAll(marketplace.target, false);

            const tokenId = 1;
            const price = ethers.parseEther("10");

            await expect(marketplace.connect(seller).listItem(tokenId, price)).to.be.revertedWith("AranduMarketplace: NFT not approved");
        });
    });

    describe("Buying Items", function () {
        beforeEach(async function () {
            const tokenId = 1;
            const price = ethers.parseEther("10");
            await marketplace.connect(seller).listItem(tokenId, price);
        });

        it("should buy a listed item", async function () {
            const tokenId = 1;
            const price = ethers.parseEther("10");

            await marketplace.connect(buyer).buyItem(tokenId);

            // Verificar transferencia de NFT
            expect(await resources.balanceOf(buyer.address, tokenId)).to.equal(1);
            expect(await resources.balanceOf(seller.address, tokenId)).to.equal(9); // Initial 10 - 1

            // Verificar transferencia de tokens
            expect(await anduToken.balanceOf(seller.address)).to.equal(price);

            // Verificar que se eliminó el listing
            expect(await marketplace.itemPrices(tokenId)).to.equal(0);
        });

        it("should not buy unlisted item", async function () {
            const tokenId = 999;
            await expect(marketplace.connect(buyer).buyItem(tokenId)).to.be.revertedWith("AranduMarketplace: Item not listed");
        });
    });

    describe("Canceling Listings", function () {
        it("should cancel a listing", async function () {
            const tokenId = 1;
            const price = ethers.parseEther("10");
            await marketplace.connect(seller).listItem(tokenId, price);

            await marketplace.connect(seller).cancelListing(tokenId);
            expect(await marketplace.itemPrices(tokenId)).to.equal(0);
        });

        it("should not cancel listing if not seller", async function () {
            const tokenId = 1;
            const price = ethers.parseEther("10");
            await marketplace.connect(seller).listItem(tokenId, price);

            await expect(marketplace.connect(buyer).cancelListing(tokenId)).to.be.revertedWith("AranduMarketplace: Not the seller");
        });
    });
});
