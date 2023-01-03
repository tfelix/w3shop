export interface NewShopData {
  shopName: string;
  shortDescription: string;
  description: string;
  royalityFeeBasepoints: number;
  royalityReceiverAddress?: string;
  keywords: string[];
}