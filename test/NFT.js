import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("NFT Contract", function () {
    let NFT;
    let nft;
    let addr1;
    let addr2;

    beforeEach(async function () {
        // Obtener signers
        [owner, addr1, addr2] = await ethers.getSigners();

        // Desplegar el contrato
        NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy();
        await nft.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Debería desplegarse correctamente con el nombre y símbolo correctos", async function () {
            expect(await nft.name()).to.equal("Lisk");
            expect(await nft.symbol()).to.equal("LSK");
        });

        it("Debería tener currentTokenId inicial en 0", async function () {
            expect(await nft.currentTokenId()).to.equal(0);
        });
    });

    describe("Minting", function () {
        it("Debería mintear un NFT correctamente", async function () {
            const tokenId = await nft.mint(addr1.address);
            await tokenId.wait(); // Esperar la transacción

            expect(await nft.ownerOf(1)).to.equal(addr1.address);
            expect(await nft.currentTokenId()).to.equal(1);
        });

        it("Debería incrementar currentTokenId después de cada mint", async function () {
            await nft.mint(addr1.address);
            expect(await nft.currentTokenId()).to.equal(1);

            await nft.mint(addr2.address);
            expect(await nft.currentTokenId()).to.equal(2);

            expect(await nft.ownerOf(1)).to.equal(addr1.address);
            expect(await nft.ownerOf(2)).to.equal(addr2.address);
        });

        it("Debería emitir el evento Transfer al mintear", async function () {
            await expect(nft.mint(addr1.address))
                .to.emit(nft, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, 1);
        });

        it("Debería permitir mintear múltiples NFTs al mismo address", async function () {
            await nft.mint(addr1.address);
            await nft.mint(addr1.address);

            expect(await nft.ownerOf(1)).to.equal(addr1.address);
            expect(await nft.ownerOf(2)).to.equal(addr1.address);
            expect(await nft.balanceOf(addr1.address)).to.equal(2);
        });
    });

    describe("Ownership", function () {
        beforeEach(async function () {
            await nft.mint(addr1.address);
        });

        it("Debería devolver el owner correcto", async function () {
            expect(await nft.ownerOf(1)).to.equal(addr1.address);
        });

        it("Debería devolver el balance correcto", async function () {
            expect(await nft.balanceOf(addr1.address)).to.equal(1);
            expect(await nft.balanceOf(addr2.address)).to.equal(0);
        });
    });

    describe("Edge Cases", function () {
        it("Debería fallar al consultar ownerOf de un token no existente", async function () {
            await expect(nft.ownerOf(999)).to.be.reverted;
        }); it("Debería manejar minting con payable (aunque no use msg.value)", async function () {
            // El contrato tiene payable, pero no lo usa, así que debería funcionar igual
            const tx = await nft.mint(addr1.address, { value: ethers.parseEther("0.1") });
            await tx.wait();

            expect(await nft.ownerOf(1)).to.equal(addr1.address);
        });
    });
});
