import * as anchor from '@project-serum/anchor';
const web3 = require("@solana/web3.js");
require('dotenv').config();

export const solana = new web3.Connection(process.env.RPC_URL);

async function getConfigLines(pubKey:anchor.web3.PublicKey, candyMachineDataCollectionName, candyMachineDataImage){
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
          candyMachineDataCollectionName = String(response.data.collection.name);
          candyMachineDataImage = String(response.data.image);
          console.log("Collection data fetched with http request is : ", candyMachineDataCollectionName, candyMachineDataImage);
          return true;
      }
    }
  }
  return false;
}

async function test(){
    var candyMachineName:string = "";
    var candyMachineImage:string = "";
    var candyMachineId = "5T3gzTE8jssuERXsRXX96jrYheV91GWY3HtBQzSBSnUV";
    const result = await getConfigLines(new web3.PublicKey(candyMachineId), candyMachineName, candyMachineImage);
    expect(candyMachineImage).toBe("https://arweave.net/rjlVHfUlPy1iiN0fCV1rAFiaxTW8SEknnJDCU7YlmEg");
    expect(candyMachineName).toBe("Joker Cryptotubbies");
    expect(result).toBe(true);
}


test();