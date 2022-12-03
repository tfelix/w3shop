import { UploadService } from 'src/app/blockchain';
import { LitFileCryptorService, ShopServiceFactory } from 'src/app/shop';
import { NewShopItemService } from './new-shop-item.service';

describe('NewShopItemService', () => {
  let sut: NewShopItemService;

  const mockShopServiceFactory = { shopService$: () => 'fake value' };
  const mockLitFileCryptorService = { getValue: () => 'fake value' };
  const mockUploadService = { getValue: () => 'fake value' };

  beforeEach(() => {
    sut = new NewShopItemService(
      mockShopServiceFactory as unknown as ShopServiceFactory,
      mockLitFileCryptorService as unknown as LitFileCryptorService,
      mockUploadService as unknown as UploadService
    );
  });

  describe('#createItem', () => {
    /*
        it('encrypts content with the correct access condition', () => {
          expect(component).toBeTruthy();
        });

        it('reports a valid progress update', () => {
          expect(component).toBeTruthy();
        });

        it('saves the NFT thumbnail', () => {
          expect(component).toBeTruthy();
        });

        it('saves the items thumbnails', () => {
          expect(component).toBeTruthy();
        });

        it('generates valid NFT metadata', () => {
          expect(component).toBeTruthy();
        });

        it('generates valid NFT metadata', () => {
          expect(component).toBeTruthy();
        });
        */
  });
});
