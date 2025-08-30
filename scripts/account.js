import fs from "fs";
import path from "path";
import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const walletsDir = path.join(process.cwd(), "wallets");
const activeWalletPath = path.join(walletsDir, "active-wallet.json");

function getWallets() {
    if (!fs.existsSync(walletsDir)) return [];
    return fs.readdirSync(walletsDir).filter(f => f.startsWith("wallet-") && f.endsWith(".json")).map(f => parseInt(f.match(/wallet-(\d+)\.json/)[1]));
}s

function getActiveWallet() {
    if (fs.existsSync(activeWalletPath)) {
        const data = JSON.parse(fs.readFileSync(activeWalletPath, "utf8"));
        return data.active;
    }
    return 1; // Por defecto 1
}

function setActiveWallet(num) {
    fs.writeFileSync(activeWalletPath, JSON.stringify({ active: num }, null, 2));
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === "select") {
        const wallets = getWallets();
        if (wallets.length === 0) {
            console.log("No hay wallets guardadas.");
            rl.close();
            return;
        }
        console.log("Wallets disponibles:", wallets);
        const num = await new Promise((resolve) => {
            rl.question("Selecciona el número de wallet: ", (input) => resolve(parseInt(input)));
        });
        if (wallets.includes(num)) {
            setActiveWallet(num);
            console.log(`Wallet activa cambiada a ${num}`);
        } else {
            console.log("Número inválido.");
        }
    } else if (command === "active") {
        console.log("Wallet activa:", getActiveWallet());
    } else {
        console.log("Uso: yarn hardhat run scripts/account.js -- select | active");
    }

    rl.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});