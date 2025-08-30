import hre from "hardhat";
import fs from "fs";
import path from "path";
import * as readline from "readline";

const { ethers } = hre;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function askPassword() {
    return new Promise((resolve) => {
        rl.question("Ingresa la contraseña para desencriptar la wallet: ", (password) => {
            resolve(password);
        });
    });
}

async function getWallet(network) {
    const walletsDir = path.join(process.cwd(), "wallets");
    const activeWalletPath = path.join(walletsDir, "active-wallet.json");
    let activeNum = 1;
    if (fs.existsSync(activeWalletPath)) {
        const data = JSON.parse(fs.readFileSync(activeWalletPath, "utf8"));
        activeNum = data.active;
    }
    const walletPath = path.join(walletsDir, `wallet-${activeNum}.json`);
    if (!fs.existsSync(walletPath)) {
        throw new Error(`Wallet ${activeNum} no encontrada.`);
    }
    const encryptedWallet = fs.readFileSync(walletPath, "utf8");
    const password = await askPassword();
    rl.close();
    return await ethers.Wallet.fromEncryptedJson(encryptedWallet, password);
}

async function saveDeployment(network, contractName, contractAddress, abi) {
    const deploymentsDir = path.join(process.cwd(), "deployments", network);
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentData = {
        address: contractAddress,
        abi: abi,
        network: network,
        deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(deploymentsDir, `${contractName}.json`),
        JSON.stringify(deploymentData, null, 2)
    );

    // También guardar en abis/
    const abisDir = path.join(process.cwd(), "abis", network);
    if (!fs.existsSync(abisDir)) {
        fs.mkdirSync(abisDir, { recursive: true });
    }
    fs.writeFileSync(
        path.join(abisDir, `${contractName}.json`),
        JSON.stringify(abi, null, 2)
    );
}

async function main() {
    const network = hre.network.name;
    console.log(`🚀 Desplegando ecosistema ARANDU en red: ${network}`);

    let deployer;
    if (network === "hardhat") {
        [deployer] = await ethers.getSigners();
    } else {
        const wallet = await getWallet(network);
        deployer = wallet.connect(ethers.provider);
    }

    console.log("📍 Desplegando contratos con la cuenta:", deployer.address);
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Balance de la cuenta:", ethers.formatEther(balance), "ETH");

    // Desplegar ANDUToken
    console.log("\n1️⃣ Desplegando ANDUToken...");
    const ANDUToken = await ethers.getContractFactory("ANDUToken", deployer);
    const anduToken = await ANDUToken.deploy(deployer.address);
    await anduToken.waitForDeployment();
    const anduTokenAddress = await anduToken.getAddress();
    console.log("✅ ANDUToken desplegado en:", anduTokenAddress);

    // Desplegar AranduCertificates
    console.log("\n2️⃣ Desplegando AranduCertificates...");
    const AranduCertificates = await ethers.getContractFactory("AranduCertificates", deployer);
    const aranduCertificates = await AranduCertificates.deploy(deployer.address);
    await aranduCertificates.waitForDeployment();
    const certificatesAddress = await aranduCertificates.getAddress();
    console.log("✅ AranduCertificates desplegado en:", certificatesAddress);

    // Desplegar AranduRewards
    console.log("\n3️⃣ Desplegando AranduRewards...");
    const AranduRewards = await ethers.getContractFactory("AranduRewards", deployer);
    const aranduRewards = await AranduRewards.deploy(deployer.address);
    await aranduRewards.waitForDeployment();
    const rewardsAddress = await aranduRewards.getAddress();
    console.log("✅ AranduRewards desplegado en:", rewardsAddress);

    // Configurar direcciones en AranduRewards
    console.log("\n🔧 Configurando direcciones en AranduRewards...");
    await aranduRewards.setAddresses(anduTokenAddress, certificatesAddress);
    console.log("✅ Direcciones configuradas correctamente");

    // Desplegar AranduResources
    console.log("\n4️⃣ Desplegando AranduResources...");
    const AranduResources = await ethers.getContractFactory("AranduResources", deployer);
    const aranduResources = await AranduResources.deploy(anduTokenAddress);
    await aranduResources.waitForDeployment();
    const resourcesAddress = await aranduResources.getAddress();
    console.log("✅ AranduResources desplegado en:", resourcesAddress);

    // Desplegar AranduBadges
    console.log("\n5️⃣ Desplegando AranduBadges...");
    const AranduBadges = await ethers.getContractFactory("AranduBadges", deployer);
    const aranduBadges = await AranduBadges.deploy(deployer.address);
    await aranduBadges.waitForDeployment();
    const badgesAddress = await aranduBadges.getAddress();
    console.log("✅ AranduBadges desplegado en:", badgesAddress);

    // Desplegar DataAnchor
    console.log("\n6️⃣ Desplegando DataAnchor...");
    const DataAnchor = await ethers.getContractFactory("DataAnchor", deployer);
    const dataAnchor = await DataAnchor.deploy(deployer.address);
    await dataAnchor.waitForDeployment();
    const dataAnchorAddress = await dataAnchor.getAddress();
    console.log("✅ DataAnchor desplegado en:", dataAnchorAddress);

    // Configuración inicial: Transferir tokens a AranduRewards para tesorería
    console.log("\n💰 Configurando tesorería inicial...");
    const treasuryAmount = ethers.parseEther("500000"); // 500,000 ANDU tokens
    await anduToken.transfer(rewardsAddress, treasuryAmount);
    console.log("✅ Transferidos", ethers.formatEther(treasuryAmount), "ANDU a tesorería");

    // Guardar artefactos
    console.log("\n💾 Guardando artefactos de deployment...");

    const contracts = [
        { name: "ANDUToken", address: anduTokenAddress },
        { name: "AranduCertificates", address: certificatesAddress },
        { name: "AranduRewards", address: rewardsAddress },
        { name: "AranduResources", address: resourcesAddress },
        { name: "AranduBadges", address: badgesAddress },
        { name: "DataAnchor", address: dataAnchorAddress }
    ];

    for (const contract of contracts) {
        const artifact = await hre.artifacts.readArtifact(contract.name);
        await saveDeployment(network, contract.name, contract.address, artifact.abi);
        console.log(`📄 ${contract.name} artefactos guardados`);
    }

    // Resumen final
    console.log("\n🎉 ¡Deployment completo exitoso!");
    console.log("\n📋 Resumen de contratos desplegados:");
    console.log("=".repeat(60));
    contracts.forEach((contract, index) => {
        console.log(`${index + 1}. ${contract.name.padEnd(20)} : ${contract.address}`);
    });
    console.log("=".repeat(60));

    console.log("\n🔧 Configuraciones aplicadas:");
    console.log(`• AranduRewards configurado con ANDUToken y AranduCertificates`);
    console.log(`• Tesorería inicial: ${ethers.formatEther(treasuryAmount)} ANDU tokens`);
    console.log(`• Todos los contratos propiedad de: ${deployer.address}`);

    console.log("\n📁 Artefactos guardados en:");
    console.log(`• deployments/${network}/`);
    console.log(`• abis/${network}/`);

    console.log("\n🚀 El ecosistema ARANDU está listo para usar!");
}

main().catch((error) => {
    console.error("❌ Error durante el deployment:", error);
    process.exitCode = 1;
});
