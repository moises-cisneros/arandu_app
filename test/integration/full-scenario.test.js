import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("ARANDU Full Scenario Test", function () {
    let deployer, teacher1, teacher2, student1;
    let anduToken, aranduCertificates, aranduRewards, aranduResources;

    beforeEach(async function () {
        [deployer, teacher1, teacher2, student1] = await ethers.getSigners();

        console.log("🚀 Desplegando contratos...");

        // Desplegar ANDUToken
        const ANDUToken = await ethers.getContractFactory("ANDUToken");
        anduToken = await ANDUToken.deploy(deployer.address);
        await anduToken.waitForDeployment();
        console.log("✅ ANDUToken desplegado en:", await anduToken.getAddress());

        // Desplegar AranduRewards
        const AranduRewards = await ethers.getContractFactory("AranduRewards");
        aranduRewards = await AranduRewards.deploy(deployer.address);
        await aranduRewards.waitForDeployment();
        console.log("✅ AranduRewards desplegado en:", await aranduRewards.getAddress());

        // Desplegar AranduCertificates con owner = AranduRewards
        const AranduCertificates = await ethers.getContractFactory("AranduCertificates");
        aranduCertificates = await AranduCertificates.deploy(await aranduRewards.getAddress());
        await aranduCertificates.waitForDeployment();
        console.log("✅ AranduCertificates desplegado en:", await aranduCertificates.getAddress());

        // Desplegar AranduResources con ANDUToken
        const AranduResources = await ethers.getContractFactory("AranduResources");
        aranduResources = await AranduResources.deploy(await anduToken.getAddress());
        await aranduResources.waitForDeployment();
        console.log("✅ AranduResources desplegado en:", await aranduResources.getAddress());

        // Set addresses en AranduRewards
        await aranduRewards.setAddresses(await anduToken.getAddress(), await aranduCertificates.getAddress());
        console.log("✅ Direcciones configuradas en AranduRewards");
    });

    it("should handle the initial setup and token distribution", async function () {
        console.log("\n📋 Escenario 1: Configuración inicial y distribución de tokens");

        const initialSupply = await anduToken.totalSupply();
        console.log("Suministro inicial de ANDU:", ethers.formatEther(initialSupply));

        // Transferir gran parte a AranduRewards como treasury
        const treasuryAmount = ethers.parseEther("100000");
        await anduToken.transfer(await aranduRewards.getAddress(), treasuryAmount);
        console.log("💰 Transferidos", ethers.formatEther(treasuryAmount), "ANDU a AranduRewards");

        // Transferir algo a teacher2 para comprar licencias
        const teacher2Amount = ethers.parseEther("1000");
        await anduToken.transfer(teacher2.address, teacher2Amount);
        console.log("💰 Transferidos", ethers.formatEther(teacher2Amount), "ANDU a teacher2");

        // Assertions
        expect(await anduToken.balanceOf(await aranduRewards.getAddress())).to.equal(treasuryAmount);
        expect(await anduToken.balanceOf(teacher2.address)).to.equal(teacher2Amount);
        console.log("✅ Balances verificados correctamente");
    });

    it("should allow a teacher to create and price a resource", async function () {
        console.log("\n📚 Escenario 2: Creación y precio de recurso por teacher1");

        const initialSupply = 50;
        const uri = "https://example.com/resource";
        const royaltyBps = 1000; // 10%

        // teacher1 crea recurso
        await aranduResources.connect(teacher1).createResource(initialSupply, uri, royaltyBps);
        console.log("🎨 teacher1 creó recurso con", initialSupply, "licencias");

        // Verificar ownership
        expect(await aranduResources.balanceOf(teacher1.address, 0)).to.equal(1); // Master token
        expect(await aranduResources.balanceOf(teacher1.address, 1)).to.equal(initialSupply); // License tokens
        console.log("✅ teacher1 tiene 1 master token y", initialSupply, "licencias");

        // Setear precio
        const price = ethers.parseEther("10");
        await aranduResources.connect(teacher1).setLicensePrice(1, price);
        console.log("💲 Precio de licencia establecido en", ethers.formatEther(price), "ANDU");

        // Verificar precio (aunque no hay getter directo, podemos asumir está set)
        console.log("✅ Recurso creado y precio establecido");
    });

    it("should allow the backend to reward a student with tokens and a certificate", async function () {
        console.log("\n🎓 Escenario 3: Recompensa a student1 con tokens y certificado");

        // Primero, transferir tokens a AranduRewards
        const rewardAmount = ethers.parseEther("100");
        await anduToken.transfer(await aranduRewards.getAddress(), rewardAmount);

        // Otorgar tokens
        await aranduRewards.grantTokenReward(student1.address, rewardAmount);
        console.log("🪙 Otorgados", ethers.formatEther(rewardAmount), "ANDU a student1");

        // Verificar balance
        expect(await anduToken.balanceOf(student1.address)).to.equal(rewardAmount);
        console.log("✅ Balance de student1 verificado:", ethers.formatEther(await anduToken.balanceOf(student1.address)));

        // Emitir certificado
        const certUri = "https://example.com/certificate";
        await aranduRewards.issueCertificate(student1.address, certUri);
        console.log("📜 Certificado emitido a student1");

        // Verificar ownership
        expect(await aranduCertificates.balanceOf(student1.address)).to.equal(1);
        expect(await aranduCertificates.ownerOf(0)).to.equal(student1.address);
        console.log("✅ student1 tiene 1 certificado NFT");

        // Verificar non-transferable
        await expect(aranduCertificates.connect(student1).transferFrom(student1.address, teacher1.address, 0)).to.be.reverted;
        console.log("✅ Certificado es soulbound y no transferible");
    });

    it("should execute a complete license purchase flow between two teachers", async function () {
        console.log("\n🛒 Escenario 4: Compra completa de licencia entre teacher1 y teacher2");

        // Dar tokens a teacher2 para la compra
        const purchaseAmount = ethers.parseEther("50");
        await anduToken.transfer(teacher2.address, purchaseAmount);
        console.log("💰 Transferidos", ethers.formatEther(purchaseAmount), "ANDU a teacher2 para compra");

        // teacher1 crea recurso
        const initialSupply = 10;
        const uri = "https://example.com/resource2";
        const royaltyBps = 500; // 5%
        await aranduResources.connect(teacher1).createResource(initialSupply, uri, royaltyBps);

        // Setear precio
        const price = ethers.parseEther("5");
        await aranduResources.connect(teacher1).setLicensePrice(1, price);

        // teacher2 aprueba
        const approvalAmount = ethers.parseEther("50");
        await anduToken.connect(teacher2).approve(await aranduResources.getAddress(), approvalAmount);
        console.log("✅ teacher2 aprobó", ethers.formatEther(approvalAmount), "ANDU para AranduResources");

        // Registrar balances iniciales
        const initialTeacher2Balance = await anduToken.balanceOf(teacher2.address);
        const initialTeacher1Balance = await anduToken.balanceOf(teacher1.address);
        const initialTeacher2Licenses = await aranduResources.balanceOf(teacher2.address, 1);
        const initialTeacher1Licenses = await aranduResources.balanceOf(teacher1.address, 1);

        // teacher2 compra 2 licencias
        const quantity = 2;
        await aranduResources.connect(teacher2).buyLicenses(1, quantity);
        console.log("🛍️ teacher2 compró", quantity, "licencias");

        // Verificar balances finales
        const finalTeacher2Balance = await anduToken.balanceOf(teacher2.address);
        const finalTeacher1Balance = await anduToken.balanceOf(teacher1.address);
        const finalTeacher2Licenses = await aranduResources.balanceOf(teacher2.address, 1);
        const finalTeacher1Licenses = await aranduResources.balanceOf(teacher1.address, 1);

        expect(finalTeacher2Balance).to.equal(initialTeacher2Balance - price * BigInt(quantity));
        expect(finalTeacher1Balance).to.equal(initialTeacher1Balance + price * BigInt(quantity));
        expect(finalTeacher2Licenses).to.equal(initialTeacher2Licenses + BigInt(quantity));
        expect(finalTeacher1Licenses).to.equal(initialTeacher1Licenses - BigInt(quantity));

        console.log("✅ Balances verificados:");
        console.log("  - teacher2 ANDU:", ethers.formatEther(finalTeacher2Balance));
        console.log("  - teacher1 ANDU:", ethers.formatEther(finalTeacher1Balance));
        console.log("  - teacher2 licencias:", finalTeacher2Licenses.toString());
        console.log("  - teacher1 licencias:", finalTeacher1Licenses.toString());
    });
});
