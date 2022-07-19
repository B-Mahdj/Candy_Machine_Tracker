require('dotenv').config();
import { getCandyMachineState, wallet, processCandyMachineData } from './script';
const web3 = require("@solana/web3.js");
const Discord = require('discord.js');
const CANDY_MACHINE_PROGRAM_ID = process.env.CANDY_MACHINE_PROGRAM_ID;
const publicKeyOfCandyMachineProgram = new web3.PublicKey(CANDY_MACHINE_PROGRAM_ID);
const DISCORD_TOKEN_BOT = process.env.DISCORD_TOKEN_BOT;

var unix_timestamp = getActualUnixTimestamp();
var lastTransactionSignatureFetched = null;
var transactionSentArrays: string[] = [];

export const solana = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.login(DISCORD_TOKEN_BOT);

(async () => {
    const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), {
        commitment: 'finalized',
        wsEndpoint: 'wss://api.mainnet-beta.solana.com'
    });

    connection.onLogs(publicKeyOfCandyMachineProgram, async (candyMachineLogs: { err: any; signature: any; log: any; }) => {
        console.log("Log : Received logs from Cndy Program : ", candyMachineLogs);
        if(candyMachineLogs.err == null && candyMachineLogs.log.includes("Program log: Instruction: InitializeCandyMachine")){
            main(candyMachineLogs.signature);
        }
    }, 'finalized');
})();

async function main(signature: any) {
    console.log("Log : Main function started with signature : ", signature);
    

    let candyMachineRawData = await getCandyMachineState(wallet, candyMachineId, solana);
    console.log("Candy machine raw data :", candyMachineRawData);
    let candyMachineDataProcessed = await processCandyMachineData(candyMachineRawData);
    console.log("CandyMachineData processed : ", candyMachineDataProcessed);
    await sleep(5000);
    sendDataDiscord(candyMachineDataProcessed);
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

function getActualUnixTimestamp() {
    var utc_timestamp = Math.floor(Date.now() / 1000);
    console.log("Starting to look for candy machine since : ", utc_timestamp);
    return utc_timestamp;
}

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 