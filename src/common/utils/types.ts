export interface TransferPayload {
  recipientAddress: string;
  amount: number;
  network: string;
  rpcUrl: string;
  privateKey: string;
  gasPrice?: string;
  tokenAddress?: string;
  nonce?: number;
  data?: string;
  gasLimit?: number;
}

export interface BalancePayload {
  address: string;
  network: string;
  rpcUrl: string;
  tokenAddress?: string;
}

export interface CreateWalletPayload {
  derivationPath?: string;
  network: string;
}

export interface GetAddressFromPrivateKeyPayload {
  privateKey: string;
  network: string;
}

export interface GetTransactionPayload {
  rpcUrl: string;
  hash: string;
  network: string;
}

export interface GenerateWalletFromMnemonicPayload {
  mnemonic: string;
  derivationPath?: string;
  network: string;
}

export interface IResponse {
  [key: string]: any;
}

export interface GetEncryptedJsonFromPrivateKey {
  password: string;
  privateKey: string;
  network: string;
}

export interface GetWalletFromEncryptedjsonPayload {
  json: string;
  password: string;
  network: string;
}

export interface IGetTokenInfoPayload {
  network: string;
  rpcUrl: string;
  address: string;
  cluster?: 'mainnet-beta' | 'testnet' | 'devnet';
}

export interface ITokenInfo {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  totalSupply: number;
  logoUrl?: string;
}

export interface ISplTokenInfo {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags: string[];
  extensions: any;
}

export interface ISmartContractCallPayload {
  rpcUrl: string;
  contractAddress: string;
  method: string;
  params: any[];
  value?: number;
  contractAbi?: any[];
  gasPrice?: string;
  gasLimit?: number;
  nonce?: number;
  privateKey?: string;
  chainId?: number;
}
