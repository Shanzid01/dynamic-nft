import { expect } from 'chai';
import { ethers } from 'hardhat';

describe("NFT.sol", function () {
    let smartContract: any;
    let [owner, user1, user2]: any[] = [];
    const tokenURI_1 = "https://opensea-creatures-api.herokuapp.com/api/creature/1"
    const tokenURI_2 = "https://opensea-creatures-api.herokuapp.com/api/creature/2"


    this.beforeAll(async () => {
        const signers = await ethers.getSigners();
        owner = signers[0];
        user1 = signers[1];
        user2 = signers[2];
    });

    this.beforeEach(async () => {
        const myNFT = await ethers.getContractFactory("NFT");
        smartContract = await myNFT.deploy("Test NFT", "TNFT", 2, 0);
    });

    it("NFT is minted successfully", async () => {
        expect(await smartContract.balanceOf(owner.address)).to.equal(0);
        await smartContract.connect(owner).mint(tokenURI_1, 1);

        expect(await smartContract.balanceOf(owner.address)).to.equal(1);
    });

    it("tokenURI is set sucessfully", async () => {
        await smartContract.connect(owner).mint(tokenURI_1, 0);
        await smartContract.connect(owner).mint(tokenURI_2, 0);

        expect(await smartContract.tokenURI(0)).to.equal(tokenURI_1);
        expect(await smartContract.tokenURI(1)).to.equal(tokenURI_2);
    });

    it("mint maxSupply cannot be exceeded", async () => {
        let pass = false;
        const myNFT = await ethers.getContractFactory("NFT");
        smartContract = await myNFT.deploy("Test NFT", "TNFT", 2, 0);

        await smartContract.connect(owner).mint(tokenURI_1, 1);
        await smartContract.connect(user1).mint(tokenURI_2, 1);
        try {
            await smartContract.connect(owner).mint(tokenURI_1, 1);
        } catch { pass = true }
        expect(pass).to.equal(true);
    });

    it("maxSupply of -1 should allow unlimited mints", async () => {
        const myNFT = await ethers.getContractFactory("NFT");
        smartContract = await myNFT.deploy("Test NFT", "TNFT", -1, 0);

        await smartContract.connect(owner).mint(tokenURI_1, 1);
        await smartContract.connect(user1).mint(tokenURI_2, 1);

        for (let i = 0; i < 100; i++) {
            await smartContract.connect(owner).mint(tokenURI_1, 0);
        }
    });

    it("mint should be accessible to everyone", async () => {
        await smartContract.connect(user1).mint(tokenURI_1, 0);
        await smartContract.connect(owner).mint(tokenURI_1, 10);
    });

    it("mint should require commission from everyone but the owner", async () => {
        let pass = false;
        const commission = 1;
        const myNFT = await ethers.getContractFactory("NFT");
        smartContract = await myNFT.deploy("Test NFT", "TNFT", 2, commission);
        await smartContract.connect(user1).mint(tokenURI_1, 1, { value: commission });
        await smartContract.connect(owner).mint(tokenURI_2, 1, { value: 0 });
    });

    it("mint should not work if commission is not provided by other users", async () => {
        let pass = false;
        const commission = 1;
        const myNFT = await ethers.getContractFactory("NFT");
        smartContract = await myNFT.deploy("Test NFT", "TNFT", 2, commission);
        await smartContract.connect(owner).mint(tokenURI_1, 1, { value: 0 });
        try {
            await smartContract.connect(user1).mint(tokenURI_1, 1, { value: 0 });
        } catch { pass = true }
        expect(pass).to.equal(true);
    });

    it("transferFrom should only be accessible to token owner of the NFT", async () => {
        let pass = false;
        await smartContract.connect(owner).mint(tokenURI_1, 1);
        await smartContract.connect(owner).transferFrom(owner.address, user1.address, 0);
        try {
            await smartContract.connect(owner).transferFrom(user1.address, owner.address, 0);
        } catch { pass = true }
        expect(pass).to.equal(true);
    });

    it("transferCommission should only be accessible to token owner", async () => {
        let pass = false;
        await smartContract.connect(user1).mint(tokenURI_1, 1, { value: 1 });
        await smartContract.connect(owner).transferCommission(owner.address);
        try {
            await smartContract.connect(user1).transferCommission(user1.address, owner.address, 0);
        } catch { pass = true }
        expect(pass).to.equal(true);
    });

    it("transferCommission should transfer the contract funds to the given address", async () => {
        const originalBalance = await user2.getBalance();
        const myNFT = await ethers.getContractFactory("NFT");
        smartContract = await myNFT.deploy("Test NFT", "TNFT", 2, 10);
        await smartContract.connect(user1).mint(tokenURI_1, 1, { value: 90 });
        await smartContract.connect(owner).mint(tokenURI_2, 1, { value: 0 });
        await smartContract.connect(owner).transferCommission(user2.address);

        expect(await user2.getBalance()).to.equal(originalBalance.add(10));
    });

    it("(rarible) contract should support royalties", async () => {
        const supportsRaribleInterface = await smartContract.supportsInterface("0xcad96cca");
        expect(supportsRaribleInterface).to.equal(true);
    });

    it("(rarible) setRoyalties should set royalty for token", async () => {
        await smartContract.connect(owner).mint(tokenURI_1, 0);
        await smartContract.connect(owner).mint(tokenURI_2, 0);

        let royalty = await smartContract.getRaribleV2Royalties(0);
        expect(royalty[royalty.length - 1][1]).to.equal(0);
        royalty = await smartContract.getRaribleV2Royalties(1);
        expect(royalty[royalty.length - 1][1]).to.equal(0);

        await smartContract.connect(owner).setRoyalties(0, owner.address, 1);
        royalty = await smartContract.getRaribleV2Royalties(0);
        expect(royalty[royalty.length - 1][1]).to.equal(100);

        await smartContract.connect(owner).setRoyalties(1, owner.address, 2);
        royalty = await smartContract.getRaribleV2Royalties(1);
        expect(royalty[royalty.length - 1][1]).to.equal(200);
    });

    it("(rarible) setRoyalties should be accessible to the original artist", async () => {
        await smartContract.connect(owner).mint(tokenURI_1, 1);
        await smartContract.connect(owner).setRoyalties(0, user1.address, 10);
    });

    it("(rarible) setRoyalties should not be accessible by others (not the artist)", async () => {
        let pass = false;
        await smartContract.connect(owner).mint(tokenURI_1, 1);
        await smartContract.connect(owner).transferFrom(owner.address, user1.address, 0);
        try {
            await smartContract.connect(user1).setRoyalties(0, user1.address, 10);
        } catch { pass = true }
        expect(pass).to.equal(true);
    });

    it("(erc2981) contract should support royalties", async () => {
        const supportsERC2981Interface = await smartContract.supportsInterface("0x2a55205a");
        expect(supportsERC2981Interface).to.equal(true);
    });

    it("(erc2981) royaltyInfo should return royalty for token", async () => {
        await smartContract.connect(owner).mint(tokenURI_1, 0);
        await smartContract.connect(owner).setRoyalties(0, owner.address, 1);

        let royalty = await smartContract.royaltyInfo(0, 100);
        expect(royalty[0]).to.equal(owner.address);
        expect(royalty[1]).to.equal(1);

        await smartContract.connect(owner).setRoyalties(0, owner.address, 10);
        royalty = await smartContract.royaltyInfo(0, 100);
        expect(royalty[0]).to.equal(owner.address);
        expect(royalty[1]).to.equal(10);

        await smartContract.connect(owner).mint(tokenURI_2, 2);
        royalty = await smartContract.royaltyInfo(1, 100);
        expect(royalty[0]).to.equal(owner.address);
        expect(royalty[1]).to.equal(2);
    });

    it("(erc2981) royaltyInfo should throw error for unknown token", async () => {
        let pass = false;
        await smartContract.connect(owner).mint(tokenURI_1, 0);
        try {
            await smartContract.royaltyInfo(1, 100);
        } catch { pass = true }
        expect(pass).to.equal(true);
    });
});