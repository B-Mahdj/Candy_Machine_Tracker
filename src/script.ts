require('dotenv').config();
import * as anchor from '@project-serum/anchor';
import axios from 'axios';
import { solana } from './bot';

const REGEX = new RegExp(/.*(http(.*))/);
const NUMBER_RETRIES_FOR_GET_CONFIG_LINES = 60;

export const CANDY_MACHINE_PROGRAM = new anchor.web3.PublicKey(
  process.env.CANDY_MACHINE_PROGRAM_ID,
);

const keypair = new anchor.web3.Keypair();
export const wallet = new anchor.Wallet(keypair);

export interface CandyMachineAccount {
  id: anchor.web3.PublicKey;
  program: anchor.Program;
  state: CandyMachineState;
}

interface CandyMachineState {
  authority: anchor.web3.PublicKey;
  itemsAvailable: number;
  itemsRedeemed: number;
  itemsRemaining: number;
  treasury: anchor.web3.PublicKey;
  tokenMint: null | anchor.web3.PublicKey;
  isSoldOut: boolean;
  isActive: boolean;
  isPresale: boolean;
  isWhitelistOnly: boolean;
  goLiveDate: anchor.BN;
  price: anchor.BN;
  gatekeeper: null | {
    expireOnUse: boolean;
    gatekeeperNetwork: anchor.web3.PublicKey;
  };
  endSettings: null | {
    number: anchor.BN;
    endSettingType: any;
  };
  whitelistMintSettings: null | {
    mode: any;
    mint: anchor.web3.PublicKey;
    presale: boolean;
    discountPrice: null | anchor.BN;
  };
  hiddenSettings: null | {
    name: string;
    uri: string;
    hash: Uint8Array;
  };
  retainAuthority: boolean | null;
}

const getCandyMachineState = async (
  anchorWallet: anchor.Wallet,
  candyMachineId: anchor.web3.PublicKey,
  connection: anchor.web3.Connection,
): Promise<CandyMachineAccount> => {
  const provider = new anchor.AnchorProvider(connection, anchorWallet, {
    preflightCommitment: 'processed',
  });

  const idl = await anchor.Program.fetchIdl(CANDY_MACHINE_PROGRAM, provider);

  const program = new anchor.Program(idl!, CANDY_MACHINE_PROGRAM, provider);

  const state: any = await program.account.candyMachine.fetch(candyMachineId);
  const itemsAvailable = state.data.itemsAvailable.toNumber();
  const itemsRedeemed = state.itemsRedeemed.toNumber();
  const itemsRemaining = itemsAvailable - itemsRedeemed;

  return {
    id: candyMachineId,
    program,
    state: {
      authority: state.authority,
      itemsAvailable,
      itemsRedeemed,
      itemsRemaining,
      isSoldOut: itemsRemaining === 0,
      isActive: false,
      isPresale: false,
      isWhitelistOnly: false,
      goLiveDate: state.data.goLiveDate,
      treasury: state.wallet,
      tokenMint: state.tokenMint,
      gatekeeper: state.data.gatekeeper,
      endSettings: state.data.endSettings,
      whitelistMintSettings: state.data.whitelistMintSettings,
      hiddenSettings: state.data.hiddenSettings,
      price: state.data.price,
      retainAuthority: state.data.retainAuthority,
    },
  };
};

async function processCandyMachineData(candyMachineRawData: CandyMachineAccount) {
  let candyMachineId: string = String(candyMachineRawData.id);
  let candyMachineItemPrice: string = String(candyMachineRawData.state.price.toNumber() / 1000000000);
  let candyMachineGoLiveDate: string;
  let candyMachineItemsAvailable: string = String(candyMachineRawData.state.itemsAvailable);
  let candyMachineItemsRemaining: string = String(candyMachineRawData.state.itemsRemaining);
  let candyMachineIsWlOnly: string = String(candyMachineRawData.state.isWhitelistOnly);
  let candyMachineIsActive: string = String(candyMachineRawData.state.isActive);
  let candyMachineIsSoldOut: string = String(candyMachineRawData.state.isSoldOut);
  let candyMachineTokenMint: string = String(candyMachineRawData.state.tokenMint);
  let candyMachineHiddenSettingsName: string = String("");
  let candyMachineHiddenSettingsUri: string = String("");
  if (candyMachineRawData.state.goLiveDate !== null) {
    candyMachineGoLiveDate = String(new Date(candyMachineRawData.state.goLiveDate.toNumber() * 1000).toLocaleDateString("en-US"));
  }
  else {
    candyMachineGoLiveDate = "Not set";
  }
  if (candyMachineRawData.state.hiddenSettings != null) {
    candyMachineHiddenSettingsName = String(candyMachineRawData.state.hiddenSettings.name);
    if (candyMachineRawData.state.hiddenSettings.uri.endsWith(".jpeg") || candyMachineRawData.state.hiddenSettings.uri.endsWith(".jpg") || candyMachineRawData.state.hiddenSettings.uri.endsWith(".png") || candyMachineRawData.state.hiddenSettings.uri.endsWith(".gif")
      || candyMachineRawData.state.hiddenSettings.uri.endsWith(".bmp") || candyMachineRawData.state.hiddenSettings.uri.endsWith(".tiff") || candyMachineRawData.state.hiddenSettings.uri.endsWith(".tif") || candyMachineRawData.state.hiddenSettings.uri.endsWith(".webp")) {
      candyMachineHiddenSettingsUri = String(candyMachineRawData.state.hiddenSettings.uri);
    }
    else {
      candyMachineHiddenSettingsUri = String(await getImageOfCandyMachineWithUri(candyMachineRawData.state.hiddenSettings.uri));
    }
  }
  else {
    let retryCount = 0;
    let configLinesDataFetched = null;
    while (configLinesDataFetched === null && retryCount < NUMBER_RETRIES_FOR_GET_CONFIG_LINES) {
      configLinesDataFetched = await getConfigLinesData(candyMachineRawData.id);
      await sleep(60000);
      retryCount++;
    }
    if (configLinesDataFetched != null) {
      candyMachineHiddenSettingsUri = await getCandyMachineNftImage(configLinesDataFetched);
      candyMachineHiddenSettingsName = await getCandyMachineCollectionName(configLinesDataFetched);
      if(candyMachineHiddenSettingsName == "") {
        candyMachineHiddenSettingsName = await getCandyMachineSymbol(configLinesDataFetched);
      }
    }
  }
  if (candyMachineRawData.state.whitelistMintSettings != null) {
    candyMachineTokenMint = String(candyMachineRawData.state.whitelistMintSettings.mint.toString());
  }
  if (candyMachineHiddenSettingsName == "") {
    candyMachineHiddenSettingsName = String("Collection Name Not found");
  }
  return {
    id: candyMachineId,
    price: candyMachineItemPrice,
    itemsAvailable: candyMachineItemsAvailable,
    itemsRemaining: candyMachineItemsRemaining,
    goLiveDate: candyMachineGoLiveDate,
    isWlOnly: candyMachineIsWlOnly,
    isActive: candyMachineIsActive,
    isSoldOut: candyMachineIsSoldOut,
    tokenMint: candyMachineTokenMint,
    hiddenSettingsName: candyMachineHiddenSettingsName,
    hiddenSettingsUri: candyMachineHiddenSettingsUri,
  };
}

export async function getConfigLinesData(pubKey: anchor.web3.PublicKey) {
  let array_of_transactions = await solana.getSignaturesForAddress(pubKey, { limit: 100, commitment: "finalized" });
  if (array_of_transactions.length > 1) {
    for (const element of array_of_transactions) {
      let getTransaction = await solana.getTransaction(element.signature);
      console.log("getTransaction for ConfigLinesData " + JSON.stringify(getTransaction));
      if (getTransaction != null && getTransaction.meta.logMessages.includes("Program log: Instruction: AddConfigLines")) {
        let configLines = getTransaction.transaction.message.serialize().toString();
        console.log("configLinesBeforeProcess", configLines);
        let resultOfRegex = REGEX.exec(configLines);
        console.log("Link received for configLinesAfterProcess", resultOfRegex[1]);
        let response = await axios.get(resultOfRegex[1]);
        console.log("Response Data received for axios call", response.data);
        return response.data;
      }
    }
  }
  return null;
}

async function getCandyMachineSymbol(data: any) {
  let candyMachineDataSymbol: string = "";
  if (data.symbol !== undefined) {
    candyMachineDataSymbol = (data.symbol);
  }
  console.log("candyMachineDataSymbol found is ", candyMachineDataSymbol);
  return candyMachineDataSymbol;
}

async function getCandyMachineCollectionName(data: any) {
  let candyMachineDataCollectionName: string = "";
  if (data.collection !== undefined && data.collection.name !== undefined) {
    candyMachineDataCollectionName = (data.collection.name);
  }
  console.log("candyMachineDataCollectionName found is ", candyMachineDataCollectionName);
  return candyMachineDataCollectionName;
}

async function getCandyMachineNftImage(data: any) {
  let candyMachineDataImage: string = "";
  if (data.image !== undefined) {
    candyMachineDataImage = (data.image);
  }
  console.log("candyMachineDataImage found is ", candyMachineDataImage);
  return candyMachineDataImage;
}


async function getImageOfCandyMachineWithUri(uri: string) {
  let response = await axios.get(uri);
  return response.data.image;
}

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export { getCandyMachineState, processCandyMachineData };
