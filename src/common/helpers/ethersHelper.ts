import { Interface } from '@ethersproject/abi';
import { Wallet } from '@ethersproject/wallet';
import { parseUnits } from '@ethersproject/units';
import Common from '@ethereumjs/common';
import { Transaction } from '@ethereumjs/tx';
import request from '../utils/rpc';
import provider from '../utils/ethers';
import erc20Abi from '../../abis/erc20.json';
import { ethers } from 'ethers';
import {
  BalancePayload,
  GetAddressFromPrivateKeyPayload,
  GetEncryptedJsonFromPrivateKey,
  GetTransactionPayload,
  GetWalletFromEncryptedjsonPayload,
  TransferPayload,
  IGetTokenInfoPayload,
  ITokenInfo,
  ISmartContractCallPayload,
} from '../utils/types';
import { successResponse } from '../utils';

interface GetContract {
  rpcUrl: string;
  privateKey?: string;
  contractAddress?: string;
  abi?: any[];
}

const getContract = async ({
  contractAddress,
  rpcUrl,
  privateKey,
  abi,
}: GetContract) => {
  const providerInstance = provider(rpcUrl);
  const gasPrice = await providerInstance.getGasPrice();
  const gas = ethers.BigNumber.from(21000);

  let nonce;
  let contract;
  let signer;
  const contractAbi = abi || erc20Abi;

  if (privateKey && contractAddress) {
    signer = new ethers.Wallet(privateKey, providerInstance);
    nonce = providerInstance.getTransactionCount(signer.getAddress());
    contract = new ethers.Contract(contractAddress, contractAbi, signer);
  } else if (privateKey && !contractAddress) {
    signer = new ethers.Wallet(privateKey, providerInstance);
    nonce = providerInstance.getTransactionCount(signer.getAddress());
  } else if (contractAddress && !privateKey) {
    contract = new ethers.Contract(
      contractAddress,
      contractAbi,
      providerInstance
    );
  }

  return {
    contract,
    signer,
    gasPrice,
    gas,
    nonce,
    providerInstance,
  };
};

const getBalance = async ({
  rpcUrl,
  tokenAddress,
  address,
}: BalancePayload) => {
  const { contract, providerInstance } = await getContract({
    rpcUrl,
    contractAddress: tokenAddress,
  });

  try {
    let balance;

    if (contract) {
      const decimals = await contract.decimals();

      balance = await contract.balanceOf(address);

      return successResponse({
        balance: parseFloat(ethers.utils.formatUnits(balance, decimals)),
      });
    }

    balance = await providerInstance.getBalance(address);

    return successResponse({
      balance: parseFloat(ethers.utils.formatEther(balance)),
    });
  } catch (error) {
    throw error;
  }
};

const createWallet = async (derivationPath?: string) => {
  const path = derivationPath || "m/44'/60'/0'/0/0";
  const wallet = ethers.Wallet.createRandom({
    path,
  });

  return successResponse({
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  });
};

const getAddressFromPrivateKey = async (
  args: GetAddressFromPrivateKeyPayload
) => {
  const wallet = new ethers.Wallet(args.privateKey);

  return successResponse({
    address: wallet.address,
  });
};

const generateWalletFromMnemonic = async (
  mnemonic: string,
  derivationPath?: string
) => {
  const path = derivationPath || "m/44'/60'/0'/0/0";
  const wallet = ethers.Wallet.fromMnemonic(mnemonic, path);

  return successResponse({
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  });
};
const transfer = async ({
  privateKey,
  tokenAddress,
  rpcUrl,
  ...args
}: TransferPayload) => {
  const { contract, providerInstance, gasPrice, nonce } = await getContract({
    rpcUrl,
    privateKey,
    contractAddress: tokenAddress,
  });

  let wallet = new ethers.Wallet(privateKey, providerInstance);

  try {
    let tx;

    if (contract) {
      const decimals = await contract.decimals();
      const estimatedGas = await contract.estimateGas.transfer(
        args.recipientAddress,
        ethers.utils.parseUnits(args.amount.toString(), decimals)
      );

      tx = await contract.transfer(
        args.recipientAddress,
        ethers.utils.parseUnits(args.amount.toString(), decimals),
        {
          gasPrice: args.gasPrice
            ? ethers.utils.parseUnits(args.gasPrice.toString(), 'gwei')
            : gasPrice,
          nonce: args.nonce || nonce,
          gasLimit: args.gasLimit || estimatedGas,
        }
      );
    } else {
      tx = await wallet.sendTransaction({
        to: args.recipientAddress,
        value: ethers.utils.parseEther(args.amount.toString()),
        gasPrice: args.gasPrice
          ? ethers.utils.parseUnits(args.gasPrice.toString(), 'gwei')
          : gasPrice,
        nonce: args.nonce || nonce,
        data: args.data
          ? ethers.utils.hexlify(ethers.utils.toUtf8Bytes(args.data as string))
          : '0x',
      });
    }

    return successResponse({
      ...tx,
    });
  } catch (error) {
    throw error;
  }
};

const getTransaction = async ({ hash, rpcUrl }: GetTransactionPayload) => {
  const { providerInstance } = await getContract({ rpcUrl });

  try {
    const tx = await providerInstance.getTransaction(hash);
    return successResponse({
      ...tx,
    });
  } catch (error) {
    throw error;
  }
};

const getEncryptedJsonFromPrivateKey = async (
  args: GetEncryptedJsonFromPrivateKey
) => {
  const wallet = new ethers.Wallet(args.privateKey);
  const json = await wallet.encrypt(args.password);

  return successResponse({ json });
};

const getWalletFromEncryptedJson = async (
  args: GetWalletFromEncryptedjsonPayload
) => {
  const wallet = await ethers.Wallet.fromEncryptedJson(
    args.json,
    args.password
  );

  return successResponse({
    privateKey: wallet.privateKey,
    address: wallet.address,
  });
};

const getTokenInfo = async ({ address, rpcUrl }: IGetTokenInfoPayload) => {
  const { contract } = await getContract({ contractAddress: address, rpcUrl });

  if (contract) {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);

    const data: ITokenInfo = {
      name,
      symbol,
      decimals,
      address: contract.address,
      totalSupply: parseInt(ethers.utils.formatUnits(totalSupply, decimals)),
    };
    return successResponse({ ...data });
  }
  return;
};

const smartContractSend = async (args: ISmartContractCallPayload) => {
  // const { contract, gasPrice, nonce } = await getContract({
  //   rpcUrl: args.rpcUrl,
  //   contractAddress: args.contractAddress,
  //   abi: args.contractAbi,
  //   privateKey: args.privateKey,
  // });

  try {
    const abiInterface = new Interface(args.contractAbi || erc20Abi);
    const wallet = new Wallet(args.privateKey!);
    const data = abiInterface.encodeFunctionData(args.method, args.params);
    const estimateGas = await request(args.rpcUrl, {
      method: 'eth_estimateGas',
      jsonrpc: '2.0',
      id: 1,
      params: [
        {
          from: wallet.address,
          to: args.contractAddress,
          data,
        },
      ],
    });
    const nonce = await request(args.rpcUrl, {
      method: 'eth_getTransactionCount',
      jsonrpc: '2.0',
      id: 1,
      params: [wallet.address, 'latest'],
    });
    const common = Common.custom({ chainId: args.chainId! });
    const tx = Transaction.fromTxData(
      {
        nonce,
        to: args.contractAddress,
        gasLimit: args.gasLimit ? args.gasLimit : estimateGas,
        gasPrice: parseUnits(args.gasPrice || '100', 'gwei').toHexString(),
      },
      { common }
    );
    const signedTx = tx.sign(Buffer.from(args.privateKey!, 'hex'));
    const serializedHex = '0x'.concat(signedTx.serialize().toString('hex'));
    const txHash = await request(args.rpcUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendRawTransaction',
      params: [serializedHex],
    });
    return successResponse({ txHash });
  } catch (error) {
    throw error;
  }
};

const smartContractCall = async (args: ISmartContractCallPayload) => {};

export default {
  getBalance,
  createWallet,
  getAddressFromPrivateKey,
  generateWalletFromMnemonic,
  transfer,
  getTransaction,
  getEncryptedJsonFromPrivateKey,
  getWalletFromEncryptedJson,
  getTokenInfo,
  smartContractSend,
};
