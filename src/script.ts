import * as anchor from '@project-serum/anchor';
require('dotenv').config();

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
  retainAuthority: boolean;
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

  export const getCollectionPDA = async (
    candyMachineAddress: anchor.web3.PublicKey,
  ): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('collection'), candyMachineAddress.toBuffer()],
      CANDY_MACHINE_PROGRAM,
    );
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
    if(candyMachineRawData.state.hiddenSettings != null){
      var candyMachineHiddenSettingsName:string = String(candyMachineRawData.state.hiddenSettings.name);
      var candyMachineHiddenSettingsUri:string = String(candyMachineRawData.state.hiddenSettings.uri);
    }
    else {
      var candyMachineHiddenSettingsName:string = "Collection Name Not found";
      var candyMachineHiddenSettingsUri:string = "https://upload.wikimedia.org/wikipedia/commons/b/b9/Solana_logo.png";
    }
    if (candyMachineRawData.state.whitelistMintSettings != null){
      candyMachineTokenMint = String(candyMachineRawData.state.whitelistMintSettings.mint.toString());
    }
    var candyMachineDataProcessed = {
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
    return candyMachineDataProcessed;
}

  export {getCandyMachineState, processCandyMachineData};
