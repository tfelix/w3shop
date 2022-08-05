import { Observable, of } from 'rxjs';
import { ShopService, ShopServiceFactory } from 'src/app/core';
import { Erc1155Metadata } from 'src/app/shared';
import { NftLocaleDescription, NFTMetadataService } from './nft-metadata.service';


describe('NFTMetadataService', () => {
  let sut: NFTMetadataService;

  const data: NftLocaleDescription = {
    name: 'Test',
    description: 'Sample Description',
    locale: 'en'
  }

  const expected: Erc1155Metadata = {
    name: 'Test',
    decimals: 0,
    description: 'Sample Description',
    external_uri: '',
    image: 'en'
  }

  const mockShopService: Partial<ShopService> = { identifier: 'abcdef' };
  const mockShopServiceFactory: ShopServiceFactory = {
    shopService$: of(mockShopService)
  };

  beforeEach(() => {
    sut = new NFTMetadataService(
      mockShopServiceFactory,
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
