require('dotenv').config();
import { getCandyMachineState, wallet, processCandyMachineData } from './script';
const express = require('express');
const web3 = require("@solana/web3.js");
const Discord = require('discord.js');
const CANDY_MACHINE_PROGRAM_ID = process.env.CANDY_MACHINE_PROGRAM_ID;
const RPC_URL = process.env.RPC_URL;
const publicKeyOfCandyMachineProgram = new web3.PublicKey(CANDY_MACHINE_PROGRAM_ID);
const DISCORD_TOKEN_BOT = process.env.DISCORD_TOKEN_BOT;
const port = 3000;

const transactionSentArrays: string[] = [];
const app = express();


app.listen(port, () => console.log(`App listening on port ${port}!`));

export const solana = new web3.Connection(RPC_URL, {
    commitment: 'finalized',
    wsEndpoint: 'wss://api.mainnet-beta.solana.com'
});

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.login(DISCORD_TOKEN_BOT);

(async () => {
    solana.onLogs(publicKeyOfCandyMachineProgram, async (candyMachineLogs: { err: any; signature: any; logs: any; }) => {
        console.log("Log : Received logs from Cndy Program : ", candyMachineLogs);
        if (candyMachineLogs.err == null && candyMachineLogs.logs.includes("Program log: Instruction: InitializeCandyMachine")) {
            main(candyMachineLogs.signature);
        }
    }, 'finalized');
})();

async function main(signature: string) {
    console.log("Log : Main function started with signature : ", signature);
    console.log(signature);
    const candyMachineId = await getCandyMachineId(signature);
    console.log("Log : Candy machine id : ", candyMachineId);
    if(candyMachineId != null) {
        const candyMachineIdPubKey = new web3.PublicKey(candyMachineId);
        let candyMachineRawData = await getCandyMachineState(wallet, candyMachineIdPubKey, solana);
        console.log("Candy machine raw data :", candyMachineRawData);
        let candyMachineDataProcessed = await processCandyMachineData(candyMachineRawData);
        console.log("CandyMachineData processed : ", candyMachineDataProcessed);
        await sleep(5000);

        if(candyMachineRespectConditions(candyMachineDataProcessed)) {
            console.log("Candy machine respect conditions");
            sendDataDiscord(candyMachineDataProcessed);
        }
        else {
            console.log("Candy machine does not respect conditions");
        }
    }
}

async function getCandyMachineId(signature: string) {
    console.log("Log : Getting candy machine id from signature : ", signature);
    let candyMachineId:string = null;
    if (signature != null) {
        let transaction = await solana.getTransaction(signature);
        console.log("Log : Transaction found : ", transaction);
        if (transaction != null) {
            console.log("Log : Transaction Accounts Keys : ", transaction.transaction.message.accountKeys);
            console.log("Log : Transaction Accounts Keys returned : ", transaction.transaction.message.accountKeys[1]);
            return transaction.transaction.message.accountKeys[1];
        }
    }
    return candyMachineId;
}

async function candyMachineRespectConditions(data:any){
    if(data.itemsAvailable != 1){
        return true;
    }
    else {
        return false;
    }
}

async function sendDataDiscord(candyMachineData) {
    //Chech the candy machine data to see if it is a new one
    let newCandyMachine = true;
    for (const element of transactionSentArrays) {
        if (element == candyMachineData.id) {
            newCandyMachine = false;
        }
    }
    if (newCandyMachine) {
        transactionSentArrays.push(candyMachineData.id);
        const channel = await client.channels.fetch('733270130913443860');
        const embed = new Discord.MessageEmbed()
            .setColor(0x3498DB)
            .setTitle(candyMachineData.hiddenSettingsName)
            .setURL(`https://explorer.solana.com/address/${candyMachineData.id}`)
            .setImage(candyMachineData.hiddenSettingsUri)
            /*
            * Inline fields may not display as inline if the thumbnail and/or image is too big.
            */
            .addFields(
                { name: "Price", value: candyMachineData.price, inline: true },
                { name: "Supply Available", value: candyMachineData.itemsAvailable + " / " + candyMachineData.itemsRemaining, inline: true },
                { name: "Go Live Date", value: candyMachineData.goLiveDate, inline: true },
                { name: "IsWLOnly", value: candyMachineData.isWlOnly, inline: true },
                { name: "IsActive", value: candyMachineData.isActive, inline: true },
                { name: "isSoldOut", value: candyMachineData.isSoldOut, inline: true }
            )
            /*
            * Blank field, useful to create some space.
            */
            .addField("\u200b", "\u200b")
            /*
            * Takes a Date object, defaults to current date.
            */
            .setTimestamp()
        if (candyMachineData.tokenMint != null) {
            embed.addField("Token Mint", candyMachineData.tokenMint);
        }
        channel.send({ embeds: [embed] });
        console.log("Log : Message sent to discord", embed);
    }
    else {
        console.log("Log : Message not sent to discord because it is not a new candy machine");
    }
}

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 