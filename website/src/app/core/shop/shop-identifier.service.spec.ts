import { TestBed } from '@angular/core/testing';
import { expect } from 'chai';

import { ShopIdentifierService } from './shop-identifier.service';

fdescribe('ShopIdentifierService', () => {
  let service: ShopIdentifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShopIdentifierService);
  });

  it('generates a valid smart contract identifier', () => {
    const addr = '0xeea25755bb5680838c7df5ab049be3acd968eecf';
    const identifier = service.buildSmartContractIdentifier(addr);
    service.setIdentifier(identifier);

    service.smartContractDetails$.subscribe(sd => {
      expect(sd.contractAddress).to.eq(addr);
    });
  });
});
