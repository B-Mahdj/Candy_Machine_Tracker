//import {getCandyMachineState, wallet, processCandyMachineData} from '../built/script';
import {getConfigLines} from '../src/script';
require('dotenv').config()
const web3 = require("@solana/web3.js");
const solana = new web3.Connection(process.env.RPC_URL);

test ('should_getConfigLines_return_array_of_strings', async () => {
    var candyMachineId = "5T3gzTE8jssuERXsRXX96jrYheV91GWY3HtBQzSBSnUV";
    const lines = await getConfigLines(new web3.PublicKey(candyMachineId));
    expect(lines).toBe(true);
});

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