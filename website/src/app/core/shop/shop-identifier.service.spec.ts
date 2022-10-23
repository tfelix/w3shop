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

    const identifier = service.buildSmartContractIdentifier('0xCEcFb8fa8a4F572ebe7eC95cdED83914547b1Ba4');
    console.log(identifier);
    expect(service).to.be.true;
  });
});
