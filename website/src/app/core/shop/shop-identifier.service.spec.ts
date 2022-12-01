import { TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import { add } from 'cypress/types/lodash';

import { ShopIdentifierService } from './shop-identifier.service';

fdescribe('ShopIdentifierService', () => {
  let sut: ShopIdentifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sut = TestBed.inject(ShopIdentifierService);
  });

  it('generates a valid smart contract identifier', () => {
    const addr = '0xeea25755bb5680838c7df5ab049be3acd968eecf';
    const identifier = sut.buildSmartContractIdentifier(addr);

    const details = sut.getSmartContractDetails(identifier);

    expect(details.contractAddress).to.equal(add);
    expect(details.chainId).to.equal(42161);
    expect(details.identifier).to.equal(identifier);
  });
});
