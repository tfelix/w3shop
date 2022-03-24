import { expect } from 'chai';
import { ethers } from 'hardhat';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
// eslint-disable-next-line node/no-missing-import
import { W3Shop } from '../typechain';

function bufferKeccak256Leaf(a: number, b: number): Buffer {
  const hash = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [a, b]);
  return Buffer.from(hash.slice('0x'.length), 'hex');
}

async function deployContract(owner: string): Promise<W3Shop> {
  const W3Shop = await ethers.getContractFactory('W3Shop');
  const sut = await W3Shop.deploy(owner);
  await sut.deployed();

  return sut as W3Shop;
}

/*
describe('cashout()', function () {
  it('Reverts on non owner', async function () {
    const [owner, addr1] = await ethers.getSigners();
    const sut = await deployContract();
    expect(sut.connect(addr1).cashout()).to.be.revertedWith('not owner');
  });

  it('Send owner the fund', async function () {
    const [owner, addr1] = await ethers.getSigners();
    const sut = await deployContract();
    sut.connect(addr1).cashout();
  });
}); */

describe('W3Shop', function () {
  let merkleProofContractAddr: string;

  this.beforeAll(async function () {
    const W3Shop = await ethers.getContractFactory('MerkleProof');
    const contract = await W3Shop.deploy();
    await contract.deployed();
    merkleProofContractAddr = contract.address;
  });

  it('Mints a special owner NFT when deplyoed', async function () {
    const [owner] = await ethers.getSigners();
    const sut = await deployContract(owner.address);

    expect(await sut.balanceOf(owner.address, 0)).to.equal(1);
  });

  const itemIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const itemPrices = [
    12000000000, 30000000000, 51200000000, 1005600000, 100078200000,
    10000000000, 10000000000, 10000000000, 30000000000, 45600000000,
  ];
  let tree: MerkleTree;

  function getProof(itemId: number, price: number): string[] {
    const leaf = bufferKeccak256Leaf(itemId, price);
    return tree.getHexProof(leaf);
  }

  describe('setOfferRoot', function () {
    let sut: W3Shop;
    let validOfferRoot: string;

    this.beforeAll(async function () {
      const [owner] = await ethers.getSigners();
      sut = await deployContract(owner.address);

      const leafes = [];
      for (let i = 0; i < itemIds.length; i++) {
        const hash = bufferKeccak256Leaf(itemIds[i], itemPrices[i]);
        leafes.push(hash);
      }

      tree = new MerkleTree(leafes, keccak256, { sort: true });
      const root = tree.getHexRoot();
      //const leaf = bufferKeccak256Leaf(1, 12000000000);
      //const proof = tree.getHexProof(leaf);
      const proof = getProof(1, 12000000000);

      console.log(tree.toString());
      console.log('root: ' + root);
      console.log('leaves ' + leafes.map(x => x.toString('hex') + '\n'));

      // const tree = new MerkleTree(leafes, keccak256);
      // const root = tree.getRoot().toString('hex');
      // console.log('test ' + root);

      // console.log(await sut.verify(root, leaf, proof));

      const leaf2 = bufferKeccak256Leaf(1, 10000000000);
      // console.log(await sut.verify(root, leaf2, proof));

      validOfferRoot = root;
    });

    describe('as non-owner', function () {
      it('reverts', async function () {
        const addr1 = (await ethers.getSigners())[1];
        const root = ethers.utils.formatBytes32String('abcdef');
        expect(sut.connect(addr1).setOfferRoot(root)).to.be.revertedWith(
          'not owner'
        );
      });
    });

    describe('as owner', function () {
      it('works', async function () {
        const [owner] = await ethers.getSigners();
        await sut.connect(owner).setOfferRoot(validOfferRoot);

        expect(await sut.offerRoot()).to.equal(validOfferRoot);
      });
    });

    describe('buying an item', function () {
      it('works when proof and payment is correct', async function () { });
      it('reverts when payed correctly but proof is false', async function () { });
      it('reverts when payed incorrectly', async function () { });

      describe('cashout', function () {
        it('reverts called from a non owner', async function () { });
        it('sends the all funds on the shop to ', async function () { });
      });

      describe('close called from a non owner', function () {
        it('reverts', async function () {
          const addr1 = (await ethers.getSigners())[1];
          expect(sut.connect(addr1).closeShop()).to.be.revertedWith(
            'not owner'
          );
        });
      });

      describe('close called from a owner', function () {
        this.beforeAll(async function () {
          const owner = (await ethers.getSigners())[0];
          expect(sut.connect(owner).closeShop());
        });

        it('closes the shop', async function () { });
        it('sends all the funds to the caller of the method', async function () { });
        it('burns the owner NFT token', async function () {
          const [owner] = await ethers.getSigners();
          expect(await sut.balanceOf(owner.address, 0)).to.equal(0);
        });
        it('keeps all the other sold NFT tokens', async function () { });

        it('reverts buying when shop is closed', async function () { });
      });
    });
  });
});
