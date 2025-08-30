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

async function saveDeployment(network, contractAddress, abi) {
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
    fs.writeFileSync(path.join(deploymentsDir, "NFT.json"), JSON.stringify(deploymentData, null, 2));
    console.log(`Artefactos guardados en: ${deploymentsDir}`);
}

async function main() {
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

    // Obtener el contrato NFT
    const NFT = await ethers.getContractFactory("NFT", deployer);

    // Desplegar el contrato
    const nft = await NFT.deploy();

    await nft.waitForDeployment();

    const address = await nft.getAddress();
    console.log("NFT desplegado en:", address);

    // Guardar artefactos
    const artifact = await hre.artifacts.readArtifact("NFT");
    const abi = artifact.abi;
    await saveDeployment(network, address, abi);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});