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
}

function getActiveWallet() {
    if (fs.existsSync(activeWalletPath)) {
        const data = JSON.parse(fs.readFileSync(activeWalletPath, "utf8"));
        return data.active;
    }
    return null;
}

function setActiveWallet(num) {
    fs.writeFileSync(activeWalletPath, JSON.stringify({ active: num }, null, 2));
}

async function main() {
    const wallets = getWallets();
    const active = getActiveWallet();
    
    console.log("=== Seleccionar Wallet Activa ===");
    
    if (wallets.length === 0) {
        console.log("❌ No hay wallets guardadas.");
        console.log("💡 Crea una wallet con: yarn generate");
        rl.close();
        return;
    }
    
    console.log(`👛 Wallet activa actual: ${active || "Ninguna"}`);
    console.log(`📁 Wallets disponibles: ${wallets.join(", ")}`);
    console.log("");
    
    const num = await new Promise((resolve) => {
        rl.question("Selecciona el número de wallet: ", (input) => resolve(parseInt(input)));
    });
    
    if (wallets.includes(num)) {
        setActiveWallet(num);
        console.log(`✅ Wallet activa cambiada a ${num}`);
    } else {
        console.log("❌ Número inválido. Wallets disponibles:", wallets);
    }
    
    rl.close();
}

main().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exitCode = 1;
});
