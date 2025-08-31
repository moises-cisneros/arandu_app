import hre from "hardhat";
import fs from "fs";
import path from "path";
import * as readline from "readline";

const { ethers } = hre;

// Configuración de tokens conocidos por red
const KNOWN_TOKENS = {
    "lisk-sepolia": {
        // LSK es el token nativo (como ETH), no un ERC-20
        // Solo incluimos tokens ERC-20 adicionales aquí
        // ANDU token se cargará dinámicamente desde despliegue o variable de entorno
        ANDU: null // Se configurará automáticamente
    },
    "hardhat": {
        // Tokens de prueba locales se cargarán dinámicamente
        ANDU: null
    }
};

// ABI para consultar tokens ERC-20
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
];

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

// Función para consultar balance de token ERC-20
async function getTokenBalance(tokenAddress, ownerAddress, provider) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(ownerAddress);
        const decimals = await tokenContract.decimals();
        const symbol = await tokenContract.symbol();
        return {
            balance: ethers.formatUnits(balance, decimals),
            symbol: symbol,
            formatted: `${ethers.formatUnits(balance, decimals)} ${symbol}`
        };
    } catch (error) {
        return {
            balance: "Error",
            symbol: "TOKEN",
            formatted: "Error al consultar balance"
        };
    }
}

// Función para cargar tokens desde despliegues
async function loadDeployedTokens(network) {
    try {
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
    console.log(`🚀 Desplegando ecosistema ARANDU mejorado en red: ${network}`);

    let deployer;
    if (network === "hardhat") {
        [deployer] = await ethers.getSigners();
    } else {
        const wallet = await getWallet(network);
        deployer = wallet.connect(ethers.provider);
    }

    console.log("📍 Desplegando contratos con la cuenta:", deployer.address);
    const balance = await deployer.provider.getBalance(deployer.address);
    
    // Determinar el símbolo del token nativo
    const nativeToken = network === "lisk-sepolia" ? "LSK" : "ETH";
    const formattedBalance = ethers.formatEther(balance);
    
    console.log(`💰 Balance de la cuenta: ${formattedBalance} ${nativeToken}`);
    
    // Cargar configuración de tokens para mostrar balances
    console.log(`\n🔄 Cargando configuración de tokens para ${network}...`);
    await loadDeployedTokens(network);
    
    // Mostrar balances de tokens ERC-20 conocidos
    if (KNOWN_TOKENS[network]) {
        console.log("\n🪙 Balances de Tokens ERC-20:");
        const tokenEntries = Object.entries(KNOWN_TOKENS[network]);
        
        if (tokenEntries.length === 0) {
            console.log("   No hay tokens configurados para esta red");
        } else {
            for (const [tokenName, tokenConfig] of tokenEntries) {
                if (tokenConfig && tokenConfig.address) {
                    try {
                        const tokenBalance = await getTokenBalance(tokenConfig.address, deployer.address, deployer.provider);
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
    
    // Verificar balance mínimo para despliegue (ajustado para testing)
    const minBalance = ethers.parseEther("0.0000000001"); // Mínimo muy bajo para testing
    if (balance < minBalance) {
        console.log(`\n❌ Balance insuficiente para gas. Necesitas al menos ${ethers.formatEther(minBalance)} ETH`);
        console.log(`📊 Tu balance actual: ${ethers.formatEther(balance)} ETH`);
        console.log(`\n💡 Para Lisk Sepolia necesitas ETH (no LSK) para pagar gas`);
        console.log(`💡 Obtén ETH desde:`);
        if (network === "lisk-sepolia") {
            console.log(`   - Faucet Sepolia ETH: https://sepoliafaucet.com`);
            console.log(`   - Luego usa Lisk Bridge: https://bridge.sepolia-api.lisk.com`);
            console.log(`   - O directo: https://faucet.sepolia-api.lisk.com`);
        } else {
            console.log(`   - Faucet de Sepolia: https://sepoliafaucet.com`);
            console.log(`   - Alchemy Faucet: https://sepoliafaucet.com`);
        }
        console.log(`\n🔄 Una vez que tengas ETH, ejecuta nuevamente:`);
        console.log(`   yarn deploy:testnet`);
        process.exit(1);
    }
    
    console.log(`✅ Balance suficiente para deployment: ${ethers.formatEther(balance)} ETH`);

    // Desplegar ANDUToken con AccessControl
    console.log("\n1️⃣ Desplegando ANDUToken con AccessControl...");
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

    // Desplegar AranduBadges
    console.log("\n3️⃣ Desplegando AranduBadges...");
    const AranduBadges = await ethers.getContractFactory("AranduBadges", deployer);
    const aranduBadges = await AranduBadges.deploy(deployer.address);
    await aranduBadges.waitForDeployment();
    const badgesAddress = await aranduBadges.getAddress();
    console.log("✅ AranduBadges desplegado en:", badgesAddress);

    // Desplegar AranduRewards (Enhanced)
    console.log("\n4️⃣ Desplegando AranduRewards Enhanced...");
    const AranduRewards = await ethers.getContractFactory("AranduRewards", deployer);
    const aranduRewards = await AranduRewards.deploy(deployer.address);
    await aranduRewards.waitForDeployment();
    const rewardsAddress = await aranduRewards.getAddress();
    console.log("✅ AranduRewards desplegado en:", rewardsAddress);

    // Configurar direcciones en AranduRewards (now includes badges)
    console.log("\n🔧 Configurando direcciones en AranduRewards...");
    await aranduRewards.setAddresses(anduTokenAddress, certificatesAddress, badgesAddress);
    console.log("✅ Direcciones configuradas correctamente");

    // Pequeña pausa para evitar problemas de nonce
    console.log("\n⏳ Esperando para evitar conflictos de nonce...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Desplegar AranduResources
    console.log("\n5️⃣ Desplegando AranduResources...");
    const AranduResources = await ethers.getContractFactory("AranduResources", deployer);
    const aranduResources = await AranduResources.deploy(anduTokenAddress);
    await aranduResources.waitForDeployment();
    const resourcesAddress = await aranduResources.getAddress();
    console.log("✅ AranduResources desplegado en:", resourcesAddress);

    // Pequeña pausa para evitar problemas de nonce
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Desplegar DataAnchor
    console.log("\n6️⃣ Desplegando DataAnchor...");
    const DataAnchor = await ethers.getContractFactory("DataAnchor", deployer);
    const dataAnchor = await DataAnchor.deploy(deployer.address);
    await dataAnchor.waitForDeployment();
    const dataAnchorAddress = await dataAnchor.getAddress();
    console.log("✅ DataAnchor desplegado en:", dataAnchorAddress);

    // Configuración de roles y permisos
    console.log("\n🔐 Configurando roles y permisos...");

    // Grant MINTER_ROLE to AranduRewards contract
    await anduToken.addMinter(rewardsAddress);
    console.log("✅ AranduRewards agregado como MINTER");

    // Example: Add a sample teacher (you can modify this)
    // await anduToken.addTeacher("0x..."); // Add real teacher address
    console.log("✅ Roles configurados");

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
    console.log(`• AranduRewards configurado con ANDUToken, AranduCertificates y AranduBadges`);
    console.log(`• AranduRewards tiene MINTER_ROLE en ANDUToken`);
    console.log(`• Tesorería inicial: ${ethers.formatEther(treasuryAmount)} ANDU tokens`);
    console.log(`• AccessControl habilitado en ANDUToken`);
    console.log(`• Gamificación automática habilitada`);
    console.log(`• Todos los contratos propiedad de: ${deployer.address}`);

    console.log("\n🎮 Funcionalidades de gamificación:");
    console.log(`• Badges automáticos por rachas de 5 días`);
    console.log(`• Badge "Token Master" por 1000 ANDU ganados`);
    console.log(`• Badge "Certificate Collector" por 5 certificados`);

    console.log("\n📁 Artefactos guardados en:");
    console.log(`• deployments/${network}/`);
    console.log(`• abis/${network}/`);

    console.log("\n🚀 El ecosistema ARANDU mejorado está listo para usar!");
}

main().catch((error) => {
    console.error("❌ Error durante el deployment:", error);
    process.exitCode = 1;
});
