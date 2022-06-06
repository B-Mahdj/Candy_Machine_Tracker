import {getCandyMachineState, wallet, processCandyMachineData} from './script';
require('dotenv').config()
const web3 = require("@solana/web3.js");
const Discord = require('discord.js');
const CANDY_MACHINE_PROGRAM_ID = process.env.CANDY_MACHINE_PROGRAM_ID;
const publicKey = new web3.PublicKey(CANDY_MACHINE_PROGRAM_ID);
const DISCORD_TOKEN_BOT = process.env.DISCORD_TOKEN_BOT;
//var unix_timestamp = getActualUnixTimestamp();
var unix_timestamp = 1654358257;
var lastTransactionSignatureFetched = null;
var transactionSentArrays:string[] = [];

export const solana = new web3.Connection(process.env.RPC_URL);
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.login(DISCORD_TOKEN_BOT);


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    main(null);
});

async function main(lastTransaction){
    let transactions = await getNewSignaturesOfCandyMachineProgram(lastTransaction);
    //Once we have the transactions we send them to a function that will process them
    let candyMachineIds = await getCandyMachineIdFromInitializedCandyMachine(transactions);
    console.log("Log : candyMachineIds", candyMachineIds);
    if(candyMachineIds.length > 0){
        for(const element of candyMachineIds){
            let candyMachineRawData = await getCandyMachineState(wallet, element, solana);
            console.log("Candy machine raw data :", candyMachineRawData);
            let candyMachineDataProcessed = await processCandyMachineData(candyMachineRawData);
            console.log("CandyMachineData processed : ", candyMachineDataProcessed);
            await sleep(5000);
            sendDataDiscord(candyMachineDataProcessed);
        }
    }
    if(transactions.length > 0){
        lastTransactionSignatureFetched = transactions[0].signature;
        await main(transactions[0].signature);
    }
    else{
        await sleep(10000);
        await main(lastTransactionSignatureFetched);
    }
}

async function sendDataDiscord(candyMachineData){
    //Chech the candy machine data to see if it is a new one
    let newCandyMachine = true;
    for(const element of transactionSentArrays){
        if(element == candyMachineData.id){
            newCandyMachine = false;
        }
    }
    if(newCandyMachine){
        transactionSentArrays.push(candyMachineData.id);
        var channel = await client.channels.fetch('733270130913443860');
        const embed = new Discord.MessageEmbed()
        .setColor(0x3498DB)
        .setTitle(candyMachineData.hiddenSettingsName)
        .setURL(`https://explorer.solana.com/address/${candyMachineData.id}`)
        .setImage(candyMachineData.hiddenSettingsUri)
        /*
        * Inline fields may not display as inline if the thumbnail and/or image is too big.
        */
        .addFields(
            {name: "Price",value : candyMachineData.price,inline: true},
            {name: "Supply Available",value: candyMachineData.itemsAvailable + " / " + candyMachineData.itemsRemaining,inline: true},
            {name: "Go Live Date",value: candyMachineData.goLiveDate,inline: true},
            {name: "IsWLOnly",value: candyMachineData.isWlOnly,inline: true},
            {name: "IsActive",value: candyMachineData.isActive,inline: true},
            {name: "isSoldOut",value: candyMachineData.isSoldOut,inline: true}
        )
        /*
        * Blank field, useful to create some space.
        */
        .addField("\u200b", "\u200b")
        /*
        * Takes a Date object, defaults to current date.
        */
        .setTimestamp()
        if (candyMachineData.tokenMint != null){
            embed.addField("Token Mint", candyMachineData.tokenMint);
        }
        channel.send({ embeds: [embed] });
        console.log("Log : Message sent to discord");
    }
    else {
        console.log("Log : Message not sent to discord because it is not a new candy machine");
    }
}

async function getCandyMachineIdFromInitializedCandyMachine(transactions){
    let id_to_return = [];
    for (const transaction of transactions) {
        console.log("Log : Processing transaction : ", transaction);
        let getTransaction = await solana.getTransaction(transaction.signature);
        console.log("Log : getTransaction", getTransaction);
        if(getTransaction != null && getTransaction.meta.logMessages.includes("Program log: Instruction: InitializeCandyMachine")){
            console.log("Log : InitializeCandyMachine found");
            for(const element of getTransaction.transaction.message.accountKeys){
                let pubKey = new web3.PublicKey(element);
                console.log("Log : AccountKeys found are :", pubKey.toString());
            }
            id_to_return.push(getTransaction.transaction.message.accountKeys[1]);
        }
    }
    console.log("Log : id_to_return", id_to_return);
    return id_to_return;
}

async function getNewSignaturesOfCandyMachineProgram(lastTransactionIdFetched){
    console.log("Log : getSignaturesForAdress will be called with params : ", lastTransactionIdFetched, publicKey);
    let transactions_returned_from_call = await solana.getSignaturesForAddress(publicKey, {limit: 20, until: lastTransactionIdFetched, commitment: "finalized"});
    let transactions_to_return = [];
    for (const element of transactions_returned_from_call) {
        console.log("Transaction fetched ", element);
        if(element.blockTime > unix_timestamp && element.signature != lastTransactionIdFetched){
            console.log("Log : New transaction found : ", element);
            transactions_to_return.push(element);
        }
    }
    console.log("Log : Transactions found were returned");
    return await deleteAfterSignature (await clearDuplicateSignaturesInArray(transactions_to_return), lastTransactionIdFetched);
}

async function clearDuplicateSignaturesInArray(array_of_transactions){
    let transactions_to_return = [];
    for (const element of array_of_transactions) {
        let transaction_found = false;
        for (let j = 0; j < transactions_to_return.length; j++) {
            if(transactions_to_return[j].signature == element.signature){
                transaction_found = true;
            }
        }
        if(!transaction_found){
            transactions_to_return.push(element);
        }
    }
    return transactions_to_return;
}

//Take one array and delete all the elements after we found a specific signature and return the new array
async function deleteAfterSignature(array, signature){
    let newArray = [];
    for(const element of array){
        if(element.signature == signature){
            break;
        }
        newArray.push(element);
    }
    return newArray;
}

function getActualUnixTimestamp(){
    var utc_timestamp  = Math.floor(Date.now() / 1000);
    console.log("Starting to look for candy machine since : ", utc_timestamp);
    return utc_timestamp;
}

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 