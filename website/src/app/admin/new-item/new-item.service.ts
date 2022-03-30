import { AbstractControl, FormControl } from "@angular/forms";

interface NewShopItemStrategy {
  createItem();
}

// Generates ERC 1155 JSON files from the raw form fields.
class Erc1155JsonGenerator {

  generateJsonFiles(form: AbstractControl) {

  }
}

// TODO Give it a proper name.
class NewItemService implements NewShopItemStrategy {

  // Extract that somehow into a dedicated service?
  private buildAccessCondition(tokenId: string, shopContractAddress: string) {
    const accessControlConditions = [
      {
        contractAddress: shopContractAddress,
        standardContractType: 'ERC1155',
        chain: 'ethereum',
        method: 'balanceOf',
        parameters: [
          ':userAddress',
          tokenId
        ],
        returnValueTest: {
          comparator: '>',
          value: '0'
        }
      }
    ];

    return accessControlConditions;
  }

  private encryptFile() {
    // const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: 'ethereum'})
    /*const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
      "this is a secret message"
    );*/

    /*
from(LitJsSdk.zipAndEncryptFiles(file)).subscribe((x: EncryptedFile) => {
  // any kind of extension (.txt,.cpp,.cs,.bat)
  var filename = "tfelix-shop-c10-i1-hello.txt.zip";

  saveAs(x.encryptedZip, filename);

  const fileHandle = await window.showSaveFilePicker();
  const fileStream = await fileHandle.createWritable();
  await fileStream.write(new Blob(["CONTENT"], { type: "text/plain" }));
  await fileStream.close();
});*/
  }

  createItem() {
    // Initial static shop data saved on arweave

    // Save the initial raw data in case something goes wrong. Probably does not work for files so they must
    // be excluded.

    // Get the next available unused token id

    // Generate NFT metadata
    // - Upload folder of locales to get the arweave id
    // - update the original metadata with this id
    // - resolve current shop IPFS hash and fill in the external_uri

    // Encrypt the file via Lit

    // Will be available at https://arweave.net/<TX_ID>/<ID>

    // Regenerate merkle root
    // Update Ceramic file
    // Update merkle root in SC
  }
}