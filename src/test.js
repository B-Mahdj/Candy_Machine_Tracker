"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.solana = void 0;
var web3 = require("@solana/web3.js");
require('dotenv').config();
exports.solana = new web3.Connection(process.env.RPC_URL);
function getConfigLines(pubKey, candyMachineDataCollectionName, candyMachineDataImage) {
    return __awaiter(this, void 0, void 0, function () {
        var array_of_transactions, _i, array_of_transactions_1, element, getTransaction, configLines, resultOfRegex, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.solana.getSignaturesForAddress(pubKey, { limit: 20, commitment: "finalized" })];
                case 1:
                    array_of_transactions = _a.sent();
                    if (!(array_of_transactions.length > 1)) return [3 /*break*/, 6];
                    _i = 0, array_of_transactions_1 = array_of_transactions;
                    _a.label = 2;
                case 2:
                    if (!(_i < array_of_transactions_1.length)) return [3 /*break*/, 6];
                    element = array_of_transactions_1[_i];
                    return [4 /*yield*/, exports.solana.getTransaction(element.signature)];
                case 3:
                    getTransaction = _a.sent();
                    if (!(getTransaction != null && getTransaction.meta.logMessages.includes("Program log: Instruction: AddConfigLines"))) return [3 /*break*/, 5];
                    configLines = getTransaction.transaction.message.serialize().toString();
                    console.log("configLinesBeforeProcess", configLines);
                    resultOfRegex = REGEX.exec(configLines);
                    console.log("configLinesAfterProcess", resultOfRegex[1]);
                    return [4 /*yield*/, axios.get(resultOfRegex[1])];
                case 4:
                    response = _a.sent();
                    candyMachineDataCollectionName = String(response.data.collection.name);
                    candyMachineDataImage = String(response.data.image);
                    console.log("Collection data fetched with http request is : ", candyMachineDataCollectionName, candyMachineDataImage);
                    return [2 /*return*/, true];
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/, false];
            }
        });
    });
}
function test() {
    return __awaiter(this, void 0, void 0, function () {
        var candyMachineName, candyMachineImage, candyMachineId, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    candyMachineName = "";
                    candyMachineImage = "";
                    candyMachineId = "5T3gzTE8jssuERXsRXX96jrYheV91GWY3HtBQzSBSnUV";
                    return [4 /*yield*/, getConfigLines(new web3.PublicKey(candyMachineId), candyMachineName, candyMachineImage)];
                case 1:
                    result = _a.sent();
                    expect(candyMachineImage).toBe("https://arweave.net/rjlVHfUlPy1iiN0fCV1rAFiaxTW8SEknnJDCU7YlmEg");
                    expect(candyMachineName).toBe("Joker Cryptotubbies");
                    expect(result).toBe(true);
                    return [2 /*return*/];
            }
        });
    });
}
test();
