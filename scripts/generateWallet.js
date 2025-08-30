import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function askPassword() {
    return new Promise((resolve) => {
        rl.question("Ingresa una contraseña para encriptar la wallet: ", (password) => {
            resolve(password);
        });
    });
}

async function main() {
    // Generar una wallet aleatoria
    const wallet = ethers.Wallet.createRandom();

    console.log("Nueva wallet generada:");
    console.log("Dirección:", wallet.address);
    console.log("Private Key:", wallet.privateKey);

    // Pedir contraseña
    const password = await askPassword();
    rl.close();

    // Encriptar la wallet
    const encryptedWallet = await wallet.encrypt(password);

    // Determinar el número incremental
    const walletsDir = path.join(process.cwd(), "wallets");
    if (!fs.existsSync(walletsDir)) {
        fs.mkdirSync(walletsDir, { recursive: true });
    }
    const files = fs.readdirSync(walletsDir).filter(f => f.startsWith("wallet-") && f.endsWith(".json"));
    const numbers = files.map(f => parseInt(f.match(/wallet-(\d+)\.json/)[1])).sort((a, b) => a - b);
    const nextNum = numbers.length > 0 ? numbers[numbers.length - 1] + 1 : 1;

    // Guardar en archivo JSON
    const walletPath = path.join(walletsDir, `wallet-${nextNum}.json`);
    fs.writeFileSync(walletPath, JSON.stringify(encryptedWallet, null, 2));

    console.log(`Wallet encriptada guardada en: ${walletPath}`);
    console.log("Recuerda guardar la private key de forma segura!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});