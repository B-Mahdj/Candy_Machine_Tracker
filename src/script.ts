import * as anchor from '@project-serum/anchor';
import axios from 'axios';
require('dotenv').config();
import { solana } from './bot';

export const CANDY_MACHINE_PROGRAM = new anchor.web3.PublicKey(
  process.env.CANDY_MACHINE_PROGRAM_ID,
);

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
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
  retainAuthority: boolean;
}

type ExpectedResponseUri = {
  name: string;
  description: string;
  image: string;
};

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

  async function processCandyMachineData (candyMachineRawData){
    var candyMachineId:string = String(candyMachineRawData.id);
    var candyMachineItemPrice:string = String(candyMachineRawData.state.price.toNumber() / 1000000000);
    var candyMachineGoLiveDate:string = String(new Date(candyMachineRawData.state.goLiveDate.toNumber() * 1000).toLocaleDateString("en-US"));
    var candyMachineItemsAvailable:string = String(candyMachineRawData.state.itemsAvailable);
    var candyMachineItemsRemaining:string = String(candyMachineRawData.state.itemsRemaining);
    var candyMachineIsWlOnly:string = String(candyMachineRawData.state.isWhitelistOnly);
    var candyMachineIsActive:string = String(candyMachineRawData.state.isActive);
    var candyMachineIsSoldOut:string = String(candyMachineRawData.state.isSoldOut);
    var candyMachineTokenMint:string = String(candyMachineRawData.state.tokenMint);
    var candyMachineHiddenSettingsName:string = String("");
    var candyMachineHiddenSettingsUri:string = String("");
    if(candyMachineRawData.state.hiddenSettings != null){
      candyMachineHiddenSettingsName = String(candyMachineRawData.state.hiddenSettings.name);
      if(candyMachineRawData.state.hiddenSettings.uri.endsWith(".jpeg") || candyMachineRawData.state.hiddenSettings.uri.endsWith(".jpg") || candyMachineRawData.state.hiddenSettings.uri.endsWith(".png") || candyMachineRawData.state.hiddenSettings.uri.endsWith(".gif")){
        candyMachineHiddenSettingsUri = String(candyMachineRawData.state.hiddenSettings.uri);
      }
      else {
        var metaDataFetched = await getMetaDataFromUrl(candyMachineRawData.state.hiddenSettings.uri);
        candyMachineHiddenSettingsUri = String(metaDataFetched.image);
      }
    }
    else {
      while(!getConfigLines(candyMachineId)){}
    }
    if (candyMachineRawData.state.whitelistMintSettings != null){
      candyMachineTokenMint = String(candyMachineRawData.state.whitelistMintSettings.mint.toString());
    }
    return {
      id: candyMachineId,
      price: candyMachineItemPrice,
      itemsAvailable: candyMachineItemsAvailable,
      itemsRemaining: candyMachineItemsRemaining,
      goLiveDate: candyMachineGoLiveDate,
      isWlOnly: candyMachineIsWlOnly,
      isActive: candyMachineIsActive,
      isSoldOut : candyMachineIsSoldOut,
      tokenMint : candyMachineTokenMint,
      hiddenSettingsName : candyMachineHiddenSettingsName,
      hiddenSettingsUri : candyMachineHiddenSettingsUri,
    };
}

export async function getConfigLines(pubKey){
  var array_of_transactions = await solana.getSignaturesForAddress(pubKey, {limit: 20,commitment: "finalized"});
  if(array_of_transactions.length > 1){
    for (const element of array_of_transactions) {
      let getTransaction = await solana.getTransaction(element.signature);
      if(getTransaction != null && getTransaction.meta.logMessages.includes("Program log: Instruction: AddConfigLines")){
          console.log("Log : AddConfigLines found", getTransaction);
          console.log(getTransaction.transaction.message.serialize());
          return true;
      }
    }
  }
  return false;
}

async function getMetaDataFromUrl(url: string) {
  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}

  export {getCandyMachineState, processCandyMachineData};
