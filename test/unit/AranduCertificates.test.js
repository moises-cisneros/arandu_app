import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("AranduCertificates", function () {
    let deployer, teacher1, student1;
    let aranduCertificates;

    beforeEach(async function () {
        [deployer, teacher1, student1] = await ethers.getSigners();

        const AranduCertificates = await ethers.getContractFactory("AranduCertificates");
        aranduCertificates = await AranduCertificates.deploy(deployer.address);
        await aranduCertificates.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy and assign the owner correctly", async function () {
            expect(await aranduCertificates.owner()).to.equal(deployer.address);
        });
    });

    describe("Minting", function () {
        it("Should allow the owner to mint certificates", async function () {
            await expect(aranduCertificates.safeMint(student1.address, "CertificateURI", "student")).to.not.be.reverted;
            expect(await aranduCertificates.ownerOf(0)).to.equal(student1.address);
        });

        it("Should fail if a non-owner tries to mint", async function () {
            await expect(aranduCertificates.connect(teacher1).safeMint(student1.address, "CertificateURI", "student")).to.be.revertedWithCustomError(aranduCertificates, "OwnableUnauthorizedAccount");
        });
    });

    describe("Transfer Prevention", function () {
        it("Should prevent transfers of certificates", async function () {
            await aranduCertificates.safeMint(student1.address, "CertificateURI", "student");
            await expect(aranduCertificates.connect(student1).transferFrom(student1.address, teacher1.address, 0)).to.be.revertedWith("AranduCertificates: Certificates are soulbound and cannot be transferred");
        });
    });
});
