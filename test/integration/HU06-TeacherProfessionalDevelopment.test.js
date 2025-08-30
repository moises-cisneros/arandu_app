// test/HU06-TeacherProfessionalDevelopment.test.js
import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("HU06 - Teacher Professional Development", function () {
    let certificates;
    let deployer;
    let creatorTeacher;

    beforeEach(async function () {
        [deployer, creatorTeacher] = await ethers.getSigners();

        // Desplegar contrato
        const AranduCertificates = await ethers.getContractFactory("AranduCertificates");
        certificates = await AranduCertificates.deploy(deployer.address);
    });

    describe("Teacher Certification", function () {
        it("should issue a distinct Professional Development certificate to a teacher", async function () {
            const uri = "https://arandu.com/cert/teacher/1";
            await certificates.safeMint(creatorTeacher.address, uri, "teacher");

            expect(await certificates.balanceOf(creatorTeacher.address)).to.equal(1);
            expect(await certificates.ownerOf(0)).to.equal(creatorTeacher.address);
        });

        it("should correctly show the teacher as the owner of their new certificate", async function () {
            const uri = "https://arandu.com/cert/teacher/1";
            await certificates.safeMint(creatorTeacher.address, uri, "teacher");

            expect(await certificates.ownerOf(0)).to.equal(creatorTeacher.address);
            expect(await certificates.tokenURI(0)).to.equal(uri);
        });

        it("should differentiate between student and teacher certificates", async function () {
            // Mintear certificado de estudiante
            await certificates.safeMint(deployer.address, "student-uri", "student");

            // Mintear certificado de teacher
            await certificates.safeMint(creatorTeacher.address, "teacher-uri", "teacher");

            expect(await certificates.certificateType(0)).to.equal("student");
            expect(await certificates.certificateType(1)).to.equal("teacher");
        });

        it("should enforce that teacher certificates are also non-transferable (soulbound)", async function () {
            await certificates.safeMint(creatorTeacher.address, "teacher-uri", "teacher");

            // Intentar transferir debería fallar
            await expect(
                certificates.connect(creatorTeacher).transferFrom(creatorTeacher.address, deployer.address, 0)
            ).to.be.revertedWith("AranduCertificates: Certificates are soulbound and cannot be transferred");
        });
    });
});
