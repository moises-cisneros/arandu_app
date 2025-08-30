import hre from "hardhat";

async function main() {
    // Compilar contratos
    console.log("Compilando contratos...");
    await hre.run("compile");

    // Ejecutar tests
    console.log("Ejecutando tests...");
    await hre.run("test");

    // Desplegar contratos
    console.log("Desplegando contratos...");
    await hre.run("run", { script: "scripts/deploy.js" });

    console.log("Proyecto listo!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});