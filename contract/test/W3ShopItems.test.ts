import { W3ShopItems } from '../typechain';
import { expect } from 'chai';
import { ethers } from 'hardhat';

async function mintItem(sut: W3ShopItems, ownerAddr: string, amount: number) {
  let tx = await sut.prepareItems(1);
  await tx.wait();

  tx = await sut.setItemUris([1], ['abc']);
  await tx.wait();

  tx = await sut.mint(ownerAddr, [1], [amount]);
  await tx.wait();
}

describe('W3ShopItems', async () => {

  async function deployFixture() {
    const MockW3ShopFactory = await ethers.getContractFactory('MockW3ShopFactory');
    const mockW3ShopFactory = await MockW3ShopFactory.deploy();

    const [existingShop, addr1, owner] = await ethers.getSigners();
    await mockW3ShopFactory.registerAddress(existingShop.address);

    const W3ShopItems = await ethers.getContractFactory('W3ShopItems');
    const sut = (await W3ShopItems.deploy(mockW3ShopFactory.address)) as W3ShopItems;

    // Fixtures can return anything you consider useful for your tests
    return { sut, existingShop, addr1, owner };
  }

  describe('#uri', async function () {
    it('returns the uri for the given token id ', async function () {
      const { sut } = await deployFixture();

      const tx = await sut.setItemUris([1], ['abc']);
      await tx.wait();

      expect(await sut.uri(1)).to.equal('abc');
    });
  });

  describe('#supportsInterface', async function () {
    it('returns true for ERC1155', async function () {
      const INTERFACE_ID_ERC1155 = '0x01ffc9a7';
      const { sut } = await deployFixture();

      expect(await sut.supportsInterface(INTERFACE_ID_ERC1155)).to.be.true;
    });

    it('returns true for ERC2981', async function () {
      const INTERFACE_ID_ERC2981 = '0x2a55205a';
      const { sut } = await deployFixture();

      expect(await sut.supportsInterface(INTERFACE_ID_ERC2981)).to.be.true;
    });

    it('returns false for wrong interface id', async function () {
      const INTERFACE_ID_ERC2981 = '0xff55205a';
      const { sut } = await deployFixture();

      expect(await sut.supportsInterface(INTERFACE_ID_ERC2981)).to.be.false;
    });
  });

  describe('#setTokenRoyalty', async function () {
    it('sets the royality for a token when called from shop', async function () {
      const { sut, owner } = await deployFixture();

      await expect(
        sut.setTokenRoyalty(1, owner.address, 1000)
      ).to.be.not.revertedWith('not allowed');
    });

    describe('#getTokenRoyality', async function () {
      it('returns the set royality', async function () {
        const { sut, owner } = await deployFixture();

        await sut.setTokenRoyalty(1, owner.address, 100);
        const [receiver, royaltyAmount] = await sut.royaltyInfo(1, 100);

        expect(receiver).to.eq(owner.address);
        expect(royaltyAmount).to.eq(1);
      });
    });

    it('reverts when not called from registered shop', async function () {
      const { sut, addr1 } = await deployFixture();

      await expect(
        sut.connect(addr1).setTokenRoyalty(1, addr1.address, 100)
      ).to.be.revertedWith('not allowed');
    });
  });

  describe('#prepareItems', async function () {
    it('generates new item IDs', async function () {
      const { sut } = await deployFixture();

      await sut.prepareItems(3)
    });

    it('reverts for n > 10', async function () {
      const { sut } = await deployFixture();

      await expect(
        sut.prepareItems(11)
      ).to.be.reverted;
    });

    it('reverts when not called from registered shop', async function () {
      const { sut, addr1 } = await deployFixture();

      await expect(
        sut.connect(addr1).prepareItems(2)
      ).to.be.revertedWith('not allowed');
    });
  });

  describe('#setItemUris', async function () {
    it('sets empty URIs', async function () {
      const { sut } = await deployFixture();

      const tx = await sut.setItemUris([1], ['abc']);
      await tx.wait();

      expect(await sut.uri(1)).to.equal('abc');
    });

    it('reverts when called with non equal length arrays', async function () {
      const { sut } = await deployFixture();

      await expect(
        sut.setItemUris([1], ['abc', 'def'])
      ).to.be.revertedWith('invalid input');
    });

    it('reverts when called with empty uri', async function () {
      const { sut } = await deployFixture();

      await expect(
        sut.setItemUris([1, 2], ['abc', ''])
      ).to.be.revertedWith('uri empty');
    });

    it('reverts when writing an existing slot', async function () {
      const { sut } = await deployFixture();

      const tx = await sut.setItemUris([1], ['abc']);
      await tx.wait();

      await expect(
        sut.setItemUris([1], ['def'])
      ).to.be.revertedWith('slot used');
    });

    it('reverts when not called from registered shop', async function () {
      const { sut, addr1 } = await deployFixture();

      await expect(
        sut.connect(addr1).setItemUris([1], ['abc'])
      ).to.be.revertedWith('not allowed');
    });
  });

  describe('#mint', async function () {
    it('mints existing items when called from shop', async function () {
      const { sut, addr1 } = await deployFixture();

      await mintItem(sut, addr1.address, 2);

      expect(await sut.balanceOf(addr1.address, 1)).to.equal(2);
    });

    it('reverts when minting non existing items', async function () {
      const { sut, addr1 } = await deployFixture();

      await expect(
        sut.mint(addr1.address, [1], [1])
      ).to.be.revertedWith('non existing item');
    });

    it('reverts when called with non equal length arrays', async function () {
      const { sut, addr1 } = await deployFixture();

      await expect(
        sut.mint(addr1.address, [1], [2, 3])
      ).to.be.revertedWith('invalid input');
    });

    it('reverts when not called from registered shop', async function () {
      const { sut, addr1 } = await deployFixture();

      await expect(
        sut.connect(addr1).mint(addr1.address, [1], [1])
      ).to.be.revertedWith('not allowed');
    });
  });

  describe('#burn', async function () {
    it('burns existing tokens when called from shop', async function () {
      const { sut, owner } = await deployFixture();

      await mintItem(sut, owner.address, 1);
      const tx = await sut.burn(owner.address, 1, 1);
      await tx.wait();

      expect(await sut.balanceOf(owner.address, 1)).to.equal(0);
    });

    it('reverts when not called from registered shop', async function () {
      const { sut, addr1 } = await deployFixture();

      await expect(
        sut.connect(addr1).burn(addr1.address, 1, 1)
      ).to.be.revertedWith('not allowed');
    });
  });
});
