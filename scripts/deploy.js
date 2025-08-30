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
    fs.writeFileSync(path.join(deploymentsDir, `${contractName}.json`), JSON.stringify(deploymentData, null, 2));
    console.log(`Artefactos de ${contractName} guardados en: ${deploymentsDir}`);
} async function main() {
    const network = hre.network.name;
    console.log(`Desplegando en red: ${network}`);

    let deployer;
    if (network === "hardhat") {
        [deployer] = await ethers.getSigners();
    } else {
        const wallet = await getWallet(network);
        deployer = wallet.connect(ethers.provider);
    }

    console.log("Desplegando contratos con la cuenta:", deployer.address);
    console.log("Balance de la cuenta:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Desplegar ANDUToken
    console.log("Desplegando ANDUToken...");
    const ANDUToken = await ethers.getContractFactory("ANDUToken", deployer);
    const anduToken = await ANDUToken.deploy(deployer.address);
    await anduToken.waitForDeployment();
    const tokenAddress = await anduToken.getAddress();
    console.log("ANDUToken desplegado en:", tokenAddress);

    // Desplegar AranduCertificates
    console.log("Desplegando AranduCertificates...");
    const AranduCertificates = await ethers.getContractFactory("AranduCertificates", deployer);
    const certificates = await AranduCertificates.deploy(deployer.address);
    await certificates.waitForDeployment();
    const certAddress = await certificates.getAddress();
    console.log("AranduCertificates desplegado en:", certAddress);

    // Desplegar AranduRewards
    console.log("Desplegando AranduRewards...");
    const AranduRewards = await ethers.getContractFactory("AranduRewards", deployer);
    const rewards = await AranduRewards.deploy(deployer.address);
    await rewards.waitForDeployment();
    const rewardsAddress = await rewards.getAddress();
    console.log("AranduRewards desplegado en:", rewardsAddress);

    // Configurar direcciones en AranduRewards
    await rewards.setAddresses(tokenAddress, certAddress);

    // Desplegar AranduResources
    console.log("Desplegando AranduResources...");
    const AranduResources = await ethers.getContractFactory("AranduResources", deployer);
    const resources = await AranduResources.deploy(tokenAddress);
    await resources.waitForDeployment();
    const resourcesAddress = await resources.getAddress();
    console.log("AranduResources desplegado en:", resourcesAddress);

    // Desplegar AranduMarketplace
    console.log("Desplegando AranduMarketplace...");
    const AranduMarketplace = await ethers.getContractFactory("AranduMarketplace", deployer);
    const marketplace = await AranduMarketplace.deploy(deployer.address);
    await marketplace.waitForDeployment();
    const marketAddress = await marketplace.getAddress();
    console.log("AranduMarketplace desplegado en:", marketAddress);

    // Configurar direcciones en AranduMarketplace (usando resources como resourceNft)
    await marketplace.setAddresses(resourcesAddress, tokenAddress);  // Guardar artefactos
    await saveDeployment(network, "ANDUToken", tokenAddress, await getAbi("ANDUToken"));
    await saveDeployment(network, "AranduCertificates", certAddress, await getAbi("AranduCertificates"));
    await saveDeployment(network, "AranduRewards", rewardsAddress, await getAbi("AranduRewards"));
    await saveDeployment(network, "AranduMarketplace", marketAddress, await getAbi("AranduMarketplace"));
    await saveDeployment(network, "AranduResources", resourcesAddress, await getAbi("AranduResources"));

    console.log("Todos los contratos desplegados exitosamente!");
}

async function getAbi(contractName) {
    const artifact = await hre.artifacts.readArtifact(contractName);
    return artifact.abi;
} main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});