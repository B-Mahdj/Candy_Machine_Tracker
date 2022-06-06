import axios from "axios";

//import {getCandyMachineState, wallet, processCandyMachineData} from '../built/script';
require('dotenv').config();
const web3 = require("@solana/web3.js");
const solana = new web3.Connection(process.env.RPC_URL);
let REGEX = new RegExp(/.*(http(.*))/);

test ('should_getConfigLines_return_array_of_strings', async () => {
    var candyMachineId = "5T3gzTE8jssuERXsRXX96jrYheV91GWY3HtBQzSBSnUV";
    var candyMachineName = "Candy Machine";
    var candyMachineImage = "";
    const lines = await getConfigLines(new web3.PublicKey(candyMachineId), candyMachineName, candyMachineImage);
    expect(lines).toBe(true);
});

export async function getConfigLines(pubKey, candyMachineDataCollectionName, candyMachineDataImage){
    var array_of_transactions = await solana.getSignaturesForAddress(pubKey, {limit: 20,commitment: "finalized"});
    if(array_of_transactions.length > 1){
      for (const element of array_of_transactions) {
        let getTransaction = await solana.getTransaction(element.signature);
        if(getTransaction != null && getTransaction.meta.logMessages.includes("Program log: Instruction: AddConfigLines")){
            var configLines = getTransaction.transaction.message.serialize().toString();
            console.log("configLinesBeforeProcess",configLines);
            var resultOfRegex = REGEX.exec(configLines);
            console.log("configLinesAfterProcess", resultOfRegex[1]);
            var response = await axios.get(resultOfRegex[1]);
            candyMachineDataCollectionName = response.data.collection.name;
            candyMachineDataImage = response.data.image;
            console.log("Collection data fetched with http request is : ", candyMachineDataCollectionName, candyMachineDataImage);
            return true;
        }
      }
    }
    return false;
  }
/*
test ('should_getCandyMachineState_when_WLMintSettings_is_set_succeed', async () => {
    var candyMachineId = "BHAvq6FgD37BrTspsZ56NWZcKBe6MSxSqBu98eZoiZ37";
    var candyMachineState = await getCandyMachineState(wallet, new web3.PublicKey(candyMachineId), solana);
    expect(candyMachineState.state.whitelistMintSettings.mint.toString()).toBe("Eh2Zmuw7jC85QLJgH2GHPZ3AXzGGXhXAh7781SBSw5FE");
});

test ('should_processCandyMachineData_when_WLMintSettings_is_set_succeed', async () => {
    var candyMachineId = "BHAvq6FgD37BrTspsZ56NWZcKBe6MSxSqBu98eZoiZ37";
    var candyMachineState = await getCandyMachineState(wallet, new web3.PublicKey(candyMachineId), solana);
    var candyMachineData = await processCandyMachineData(candyMachineState);
    expect(candyMachineData.tokenMint).toBe(candyMachineState.state.whitelistMintSettings.mint.toString());
});

test ('should_getCandyMachineState_when_hiddenSettings_is_set_succeed', async () => {
    var candyMachineId = "6yCFPVQbehKXLttcZb8TFuUybigYCDf2fJuPhWbKM7Ud";
    var candyMachineState = await getCandyMachineState(wallet, new web3.PublicKey(candyMachineId), solana);
    expect(candyMachineState.state.hiddenSettings.name).toBe("Evopolis Master Logo ");
});

test ('should_processCandyMachineData_when_hiddenSettings_is_set_succeed', async () => {
    var candyMachineId = "6yCFPVQbehKXLttcZb8TFuUybigYCDf2fJuPhWbKM7Ud";
    var candyMachineState = await getCandyMachineState(wallet, new web3.PublicKey(candyMachineId), solana);
    var candyMachineData = await processCandyMachineData(candyMachineState);
    expect(candyMachineData.hiddenSettingsName).toBe(candyMachineState.state.hiddenSettings.name);
});

test ('should_getCandyMachineState_when_hiddenSettingsUriIsUrl_is_set_succeed', async () => {
    var candyMachineId = "6yCFPVQbehKXLttcZb8TFuUybigYCDf2fJuPhWbKM7Ud";
    var candyMachineState = await getCandyMachineState(wallet, new web3.PublicKey(candyMachineId), solana);
    expect(candyMachineState.state.hiddenSettings.uri).toBe("https://evopolis.io/");
});

*/