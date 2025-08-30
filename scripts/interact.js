import hre from "hardhat";
import fs from "fs";
import path from "path";
import * as readline from "readline";

const { ethers } = hre;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer));
    });
}

async function loadDeployments(network) {
    const deploymentsDir = path.join(process.cwd(), "deployments", network);
    const deployments = {};
    const files = fs.readdirSync(deploymentsDir).filter(f => f.endsWith(".json"));
    for (const file of files) {
        const name = file.replace(".json", "");
        const data = JSON.parse(fs.readFileSync(path.join(deploymentsDir, file), "utf8"));
        deployments[name] = data;
    }
    return deployments;
}

async function main() {
    const network = hre.network.name;
    console.log(`Interactuando en red: ${network}`);

    const deployments = await loadDeployments(network);
    console.log("Contratos desplegados:", Object.keys(deployments));

    const action = await ask("¿Qué acción quieres realizar? (mintToken, issueCert, grantReward, createResource, setLicensePrice, buyLicenses, listItem, buyItem): ");

    if (action === "mintToken") {
        const amount = await ask("Cantidad de tokens a mintear: ");
        const to = await ask("Dirección del destinatario: ");
        const tokenContract = new ethers.Contract(deployments.ANDUToken.address, deployments.ANDUToken.abi, ethers.provider);
        const tx = await tokenContract.mint(to, ethers.parseEther(amount));
        await tx.wait();
        console.log(`Minteados ${amount} tokens a ${to}`);
    } else if (action === "issueCert") {
        const to = await ask("Dirección del estudiante: ");
        const uri = await ask("URI del certificado: ");
        const certContract = new ethers.Contract(deployments.AranduCertificates.address, deployments.AranduCertificates.abi, ethers.provider);
        const tx = await certContract.safeMint(to, uri);
        await tx.wait();
        console.log(`Certificado emitido a ${to}`);
    } else if (action === "grantReward") {
        const student = await ask("Dirección del estudiante: ");
        const amount = await ask("Cantidad de tokens: ");
        const rewardsContract = new ethers.Contract(deployments.AranduRewards.address, deployments.AranduRewards.abi, ethers.provider);
        const tx = await rewardsContract.grantTokenReward(student, ethers.parseEther(amount));
        await tx.wait();
        console.log(`Recompensa de ${amount} tokens otorgada a ${student}`);
    } else if (action === "listItem") {
        const tokenId = await ask("ID del token a listar: ");
        const price = await ask("Precio en ANDU tokens: ");
        const marketContract = new ethers.Contract(deployments.AranduMarketplace.address, deployments.AranduMarketplace.abi, ethers.provider);
        const tx = await marketContract.listItem(tokenId, ethers.parseEther(price));
        await tx.wait();
        console.log(`Item ${tokenId} listado por ${price} tokens`);
    } else if (action === "createResource") {
        const supply = await ask("Suministro inicial de licencias: ");
        const uri = await ask("URI del recurso: ");
        const royalty = await ask("Royalty en bps (ej. 500 para 5%): ");
        const resourcesContract = new ethers.Contract(deployments.AranduResources.address, deployments.AranduResources.abi, ethers.provider);
        const tx = await resourcesContract.createResource(supply, uri, royalty);
        await tx.wait();
        console.log(`Recurso creado con suministro ${supply}`);
    } else if (action === "setLicensePrice") {
        const tokenId = await ask("ID del token de licencia: ");
        const price = await ask("Precio en ANDU tokens: ");
        const resourcesContract = new ethers.Contract(deployments.AranduResources.address, deployments.AranduResources.abi, ethers.provider);
        const tx = await resourcesContract.setLicensePrice(tokenId, ethers.parseEther(price));
        await tx.wait();
        console.log(`Precio de licencia ${tokenId} establecido en ${price}`);
    } else if (action === "buyLicenses") {
        const tokenId = await ask("ID del token de licencia: ");
        const quantity = await ask("Cantidad a comprar: ");
        const resourcesContract = new ethers.Contract(deployments.AranduResources.address, deployments.AranduResources.abi, ethers.provider);
        const tx = await resourcesContract.buyLicenses(tokenId, quantity);
        await tx.wait();
        console.log(`Compradas ${quantity} licencias de ${tokenId}`);
    } else if (action === "buyItem") {
        const tokenId = await ask("ID del token a comprar: ");
        const marketContract = new ethers.Contract(deployments.AranduMarketplace.address, deployments.AranduMarketplace.abi, ethers.provider);
        const tx = await marketContract.buyItem(tokenId);
        await tx.wait();
        console.log(`Item ${tokenId} comprado`);
    } else {
        console.log("Acción no reconocida");
    }

    rl.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
