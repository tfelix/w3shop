import { Injectable } from "@angular/core";
import { WebBundlr } from "@bundlr-network/client";
import { EMPTY, Observable } from "rxjs";

export interface DeployResult {
  ownerAddr?: string;
  contractAddress?: string;
  progress: number;
}

// EXAMPLE FOR BUNDLR
async function setupBundlr() {
  let provider: any; // the ethereum provider
  // For devnet see https://docs.bundlr.network/docs/devnet
  const bundlr = new WebBundlr("https://node1.bundlr.network", "arbitrum", provider);
  await bundlr.ready();

  const tags = [{ name: "Content-Type", value: "text/plain" }];
  const data = 'Kann auch ein Array sein';
  const tx = bundlr.createTransaction(data, { tags });
  const size = tx.size;
  const price = await bundlr.getPrice(size);

  // Get your current balance
  const balance = await bundlr.getLoadedBalance();

  // If you don't have enough balance for the upload
  if (balance.isGreaterThan(price)) {
    // Fund your account with the difference
    // We multiply by 1.1 to make sure we don't run out of funds
    await bundlr.fund(balance.minus(price).multipliedBy(1.1))
  }

  // Create, sign and upload the transaction
  await tx.sign();
  const id = tx.id;
  // upload the transaction
  const result = await tx.upload()

  // once the upload succeeds, your data will be instantly accessible at `https://arweave.net/${id}`
}

@Injectable({
  providedIn: 'root'
})
export class DeployContractService {


  // As reference see https://github.com/dethcrypto/TypeChain/tree/master/examples/ethers-v5

  deployShopContract(): Observable<DeployResult> {
    // NFT ICON Owner NFT: Ist bekannt.
    // Shop Manifest + Shop Config
    // Upload bia Bundlr.
    console.debug('Saving Manifest and Config');
    console.debug('Deploying shop contract');

    /*
    return of(result).pipe(
      delay(1500)
    );*/

    return EMPTY;
  }
}