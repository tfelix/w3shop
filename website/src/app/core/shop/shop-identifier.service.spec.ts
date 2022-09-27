import { TestBed } from '@angular/core/testing';
import { Networks, NetworkService } from '../blockchain/network.service';

import { ShopIdentifierService } from './shop-identifier.service';

describe('ShopIdentifierService', () => {
  let service: ShopIdentifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShopIdentifierService);
  });

  it('generates a valid smart contract identifier', () => {

    const identifier = service.buildSmartContractIdentifier('0xCEcFb8fa8a4F572ebe7eC95cdED83914547b1Ba4', Networks.ARBITRUM_RINKEBY.chainId);
    console.log(identifier);
    expect(service).toBeTruthy();
  });
});
