import { Injectable } from "@angular/core";
import { WebBundlr } from "@bundlr-network/client";
import { EMPTY, from, Observable, of, Subject } from "rxjs";
import { delay, delayWhen } from "rxjs/operators";
import { ProviderService, ShopError } from "src/app/core";
import { ShopConfigV1 } from "src/app/shared";
import { environment } from "src/environments/environment";
import { NewShop } from "./new-shop";

export interface DeployResult {
  ownerAddr?: string;
  contractAddress?: string;
  progress: number;
  stage: string;
}

interface DeploymentState {
  shopConfig?: string;
  shopContract?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopDeployStateService {

  registerConfigDeployed(uri: string) {
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY, uri);
  }

  registerShopContractDeployed(contractAddress: string) {
    localStorage.setItem(ShopDeployStateService.STORAGE_CONTRACT_KEY, contractAddress);
  }

  getDpeloymentState(): DeploymentState {
    return {
      shopConfig: localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY),
      shopContract: localStorage.getItem(ShopDeployStateService.STORAGE_CONTRACT_KEY)
    }
  }

  private static readonly STORAGE_CONTRACT_KEY = 'SHOP_CONTRACT';
  private static readonly STORAGE_SHOP_CONFIG_KEY = 'SHOP_CONFIG';
}

@Injectable({
  providedIn: 'root'
})
export class DeployContractService {
  // As reference see https://github.com/dethcrypto/TypeChain/tree/master/examples/ethers-v5
  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  private getBundlr(): Observable<WebBundlr> {
    const provider = this.providerService.getProvider();
    if (provider === null) {
      throw new ShopError('No wallet connected');
    }

    let bundlr: WebBundlr;
    if (environment.production) {
      bundlr = new WebBundlr("https://node1.bundlr.network", "arbitrum", provider);
    } else {
      bundlr = new WebBundlr("https://devnet.bundlr.network", "arbitrum", provider);
    }

    return of(bundlr).pipe(
      delayWhen(() => from(bundlr.ready()))
    )
  }

  deployShopContract(newShop: NewShop): Observable<DeployResult> {
    const shopConfig = this.createShopConfig(newShop);
    const sub = new Subject<DeployResult>();

    this.getBundlr().pipe(

    );
    // Upload bia Bundlr.

    console.debug('Deploying shop contract');

    /*
    return of(result).pipe(
      delay(1500)
    );*/

    return sub.asObservable();
  }

  private uploadShopConfig(bundlr: WebBundlr, sub: Subject<DeployResult>) {
    console.debug('Saving Manifest and Config');
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

  }

  private createShopConfig(newShop: NewShop): ShopConfigV1 {
    return {
      shopName: newShop.shopName,
      shortDescription: newShop.shortDescription,
      description: newShop.description,
      keywords: newShop.keywords,
      itemUris: [],
      version: '1'
    };
  }
}