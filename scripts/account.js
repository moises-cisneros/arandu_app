import fs from "fs";
import path from "path";
import * as readline from "readline";
import { ethers } from "ethers";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const walletsDir = path.join(process.cwd(), "wallets");
const activeWalletPath = path.join(walletsDir, "active-wallet.json");

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
];

// Configuración de tokens conocidos por red
const KNOWN_TOKENS = {
    "lisk-sepolia": {
        LSK: {
            address: "0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D",
            symbol: "LSK",
            decimals: 18,
            name: "Lisk"
        },
        // ANDU token se cargará dinámicamente desde despliegue o variable de entorno
        ANDU: null // Se configurará automáticamente
    },
    "hardhat": {
        // Tokens de prueba locales se cargarán dinámicamente
        ANDU: null
    }
};

// Función para cargar tokens desde despliegues
async function loadDeployedTokens(network) {
    try {
        const fs = await import('fs');
        const path = await import('path');
        
        const deploymentPath = path.join(process.cwd(), 'deployments', network, 'ANDUToken.json');
        
        if (fs.existsSync(deploymentPath)) {
            const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            if (KNOWN_TOKENS[network]) {
                KNOWN_TOKENS[network].ANDU = {
                    address: deploymentData.address,
                    symbol: "ANDU",
                    decimals: 18,
                    name: "Arandu Token"
                };
            }
            return deploymentData.address;
        }
    } catch (error) {
        console.log(`⚠️ No se pudo cargar ANDU desde despliegues: ${error.message}`);
    }
    
    // Fallback: variable de entorno
    const envAddress = process.env[`REACT_APP_ANDU_TOKEN_ADDRESS`] || process.env[`${network.toUpperCase()}_ANDU_ADDRESS`];
    if (envAddress && KNOWN_TOKENS[network]) {
        KNOWN_TOKENS[network].ANDU = {
            address: envAddress,
            symbol: "ANDU", 
            decimals: 18,
            name: "Arandu Token"
        };
        return envAddress;
    }
    
    return null;
}

function getWallets() {
    if (!fs.existsSync(walletsDir)) return [];
    return fs.readdirSync(walletsDir).filter(f => f.startsWith("wallet-") && f.endsWith(".json")).map(f => parseInt(f.match(/wallet-(\d+)\.json/)[1]));
}

function getActiveWallet() {
    if (fs.existsSync(activeWalletPath)) {
        const data = JSON.parse(fs.readFileSync(activeWalletPath, "utf8"));
        return data.active;
    }
    return null; // No hay wallet activa configurada
}

function setActiveWallet(num) {
    fs.writeFileSync(activeWalletPath, JSON.stringify({ active: num }, null, 2));
}

async function getWalletInfo(walletNum) {
    const walletPath = path.join(walletsDir, `wallet-${walletNum}.json`);
    if (!fs.existsSync(walletPath)) {
        throw new Error(`Wallet ${walletNum} no encontrada`);
    }

    const encryptedWallet = fs.readFileSync(walletPath, "utf8");

    // Verificar que el archivo sea un JSON válido
    let walletData;
    try {
        walletData = JSON.parse(encryptedWallet);
    } catch (error) {
        throw new Error(`Archivo de wallet corrupto. Crea una nueva con 'yarn generate'`);
    }

    console.log("🔐 Ingresa la contraseña de la wallet:");
    console.log("(Nota: En Windows, la contraseña puede ser visible. Asegúrate de que nadie te vea)");
    const password = await new Promise((resolve) => {
        rl.question("", (password) => resolve(password));
    });

    try {
        const wallet = await ethers.Wallet.fromEncryptedJson(JSON.stringify(walletData), password);
        return {
            address: wallet.address,
            privateKey: wallet.privateKey
        };
    } catch (error) {
        throw new Error("Contraseña incorrecta o archivo corrupto");
    }
}

async function getBalance(address, network = "hardhat", tokenAddress = null) {
    try {
        let provider;
        if (network === "hardhat") {
            provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        } else if (network === "lisk-sepolia") {
            provider = new ethers.JsonRpcProvider("https://rpc.sepolia-api.lisk.com");
        } else {
            console.log(`Balance solo disponible en redes hardhat y lisk-sepolia`);
            return {
                balance: "N/A",
                symbol: "N/A",
                formatted: "Red no soportada"
            };
        }

        if (tokenAddress) {
            // Consultar balance de token ERC-20
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const balance = await tokenContract.balanceOf(address);
            const decimals = await tokenContract.decimals();
            const symbol = await tokenContract.symbol();
            return {
                balance: ethers.formatUnits(balance, decimals),
                symbol: symbol,
                formatted: `${ethers.formatUnits(balance, decimals)} ${symbol}`
            };
        } else {
            // Consultar balance de ETH
            const balance = await provider.getBalance(address);
            return {
                balance: ethers.formatEther(balance),
                symbol: "ETH",
                formatted: `${ethers.formatEther(balance)} ETH`
            };
        }
    } catch (error) {
        return {
            balance: "Error",
            symbol: tokenAddress ? "TOKEN" : "ETH",
            formatted: "Error al obtener balance"
        };
    }
}

async function main() {
    const wallets = getWallets();
    let active = getActiveWallet();

    console.log("=== Información de Wallet ARANDU ===");

    // Si no hay wallets, sugerir crear una
    if (wallets.length === 0) {
        console.log("❌ No hay wallets guardadas.");
        console.log("💡 Crea una wallet con: yarn generate");
        rl.close();
        return;
    }

    // Si no hay wallet activa, configurar la primera por defecto
    if (active === null || !wallets.includes(active)) {
        active = wallets[0];
        setActiveWallet(active);
        console.log(`✅ Wallet activa configurada por defecto: ${active}`);
    }

    console.log(`👛 Wallet activa: ${active}`);
    console.log(`📁 Wallets disponibles: ${wallets.join(", ")}`);

    try {
        const walletInfo = await getWalletInfo(active);
        console.log(`📍 Dirección: ${walletInfo.address}`);

        // Detectar red automáticamente (por defecto lisk-sepolia para tokens)
        const network = "lisk-sepolia"; // Red principal para consultar tokens
        
        // Cargar tokens desplegados
        console.log(`\n🔄 Cargando configuración de tokens para ${network}...`);
        await loadDeployedTokens(network);

        // Consultar balance de ETH
        const ethBalance = await getBalance(walletInfo.address, network);
        console.log(`💰 Balance ETH: ${ethBalance.formatted}`);

        // Consultar balances de tokens conocidos
        if (KNOWN_TOKENS[network]) {
            console.log("\n🪙 Balances de Tokens:");
            const tokenEntries = Object.entries(KNOWN_TOKENS[network]);
            
            if (tokenEntries.length === 0) {
                console.log("   No hay tokens configurados para esta red");
            } else {
                for (const [tokenName, tokenConfig] of tokenEntries) {
                    if (tokenConfig && tokenConfig.address) {
                        try {
                            const tokenBalance = await getBalance(walletInfo.address, network, tokenConfig.address);
                            console.log(`   ${tokenName}: ${tokenBalance.formatted}`);
                        } catch (error) {
                            console.log(`   ${tokenName}: Error al consultar (${error.message})`);
                        }
                    } else {
                        console.log(`   ${tokenName}: No configurado`);
                    }
                }
            }
        }

        // Mostrar información adicional para Lisk Sepolia si es relevante
        if (network === "lisk-sepolia") {
            console.log("\n🌐 Información de Lisk Sepolia:");
            console.log("   - Red agregada en MetaMask con RPC: https://rpc.sepolia-api.lisk.com");
            console.log("   - Token LSK: 0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D");
            if (!KNOWN_TOKENS[network].ANDU) {
                console.log("   ⚠️ ANDU no encontrado. Despliega contratos o configura:");
                console.log("     Variable de entorno: LISK_SEPOLIA_ANDU_ADDRESS=0x...");
                console.log("     O crea archivo: deployments/lisk-sepolia/ANDUToken.json");
            } else {
                console.log("   ✅ ANDU configurado desde despliegue");
            }
            console.log("   💡 Para agregar más tokens, edita KNOWN_TOKENS en el script");
        }

        console.log("\n💡 Para cambiar de wallet: yarn account:select");
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (error.message.includes("Contraseña incorrecta")) {
            console.log("💡 Verifica que la contraseña sea correcta");
            console.log("💡 Si no recuerdas la contraseña, crea una nueva wallet con: yarn generate");
        } else {
            console.log("💡 Si el problema persiste, crea una nueva wallet con: yarn generate");
        }
    }

    rl.close();
}

main().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exitCode = 1;
});