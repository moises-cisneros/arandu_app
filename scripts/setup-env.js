#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Script para configurar variables de entorno después del despliegue
// Uso: yarn setup:env [network]

const network = process.argv[2] || 'lisk-sepolia';
const deploymentsDir = path.join(process.cwd(), 'deployments', network);

console.log(`🔧 Configurando variables de entorno para ${network}...`);

try {
    // Leer archivos de despliegue
    const contracts = ['ANDUToken', 'AranduRewards', 'AranduCertificates', 'AranduResources', 'AranduBadges', 'DataAnchor'];
    const envVars = {};

    for (const contract of contracts) {
        const deploymentPath = path.join(deploymentsDir, `${contract}.json`);
        if (fs.existsSync(deploymentPath)) {
            const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            const envKey = `${network.toUpperCase()}_${contract.toUpperCase()}_ADDRESS`;
            envVars[envKey] = deployment.address;
            console.log(`✅ ${contract}: ${deployment.address}`);
        } else {
            console.log(`⚠️ ${contract}: No encontrado`);
        }
    }

    // Crear/actualizar archivo .env
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Agregar variables nuevas
    for (const [key, value] of Object.entries(envVars)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
            // Actualizar existente
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            // Agregar nueva
            envContent += `\n${key}=${value}`;
        }
    }

    fs.writeFileSync(envPath, envContent.trim());
    console.log(`\n📄 Archivo .env actualizado en: ${envPath}`);
    console.log(`\n💡 Ahora puedes usar 'yarn account' para ver tus tokens ANDU`);

} catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log(`\n💡 Asegúrate de que hayas desplegado contratos en ${network}`);
    console.log(`   Ejecuta: yarn deploy:testnet`);
    process.exit(1);
}
