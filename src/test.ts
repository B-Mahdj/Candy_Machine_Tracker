const web3 = require("@solana/web3.js");
require('dotenv').config();

export const solana = new web3.Connection(process.env.RPC_URL);

async function getConfigLines(pubKey){
    var array_of_transactions = await solana.getSignaturesForAddress(pubKey, {limit: 20,commitment: "finalized"});
    if(array_of_transactions.length > 1){
      for (const element of array_of_transactions) {
        let getTransaction = await solana.getTransaction(element.signature);
        if(getTransaction != null && getTransaction.meta.logMessages.includes("Program log: Instruction: AddConfigLines")){
            var configLines = getTransaction.transaction.message.serialize().toString();
            console.log("configLinesBeforeProcess",configLines);
            //Get the substring from the character http to the character # (inclusive)
            var configLinesSubstring = configLines.substring(configLines.indexOf("http") + 1, configLines.indexOf("#"));
            console.log("configLinesAfterProcess", configLinesSubstring);
            return true;
        }
      }
    }
    return false;
  }

async function test(){
    var candyMachineId = "5T3gzTE8jssuERXsRXX96jrYheV91GWY3HtBQzSBSnUV";
    const lines = await getConfigLines(new web3.PublicKey(candyMachineId));
}
test();