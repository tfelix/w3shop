import { of } from 'rxjs';
import { ShopService, ShopServiceFactory } from 'src/app/core';
import { Erc1155Metadata } from '../../shared/erc-1155';
import { NftLocaleDescription, NFTMetadataService } from './nft-metadata.service';


describe('NFTMetadataService', () => {
  let sut: NFTMetadataService;

  const data: NftLocaleDescription = {
    name: 'Test',
    description: 'Sample Description',
    locale: 'en'
  }

  const expected: Erc1155Metadata = {
    name: '',
    decimals: 0,
    description: '',
    external_uri: '',
    image: ''
  }

  const mockShopService = { identifier: () => '1234' } as unknown as ShopService;
  const mockShopServiceFactory = { shopService$: of(mockShopService) };

  beforeEach(() => {


    sut = new NFTMetadataService(
      mockShopServiceFactory as unknown as ShopServiceFactory,
    );
  });

  describe('#buildErc1155Metadata', () => {

    it('build the expected metadata', (done) => {
      const result$ = sut.buildErc1155Metadata([data], 'ar://image.png')
      result$.subscribe(x => {
        expect(x).toBe(expected);
        done();
      });
    });
  });
});
