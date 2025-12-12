declare module 'yookassa' {
  class YooKassa {
    constructor(options: { shopId: string; secretKey: string });
    createPayment(options: any): Promise<any>;
  }
  export = YooKassa;
}
