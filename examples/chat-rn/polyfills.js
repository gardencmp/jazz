import "@azure/core-asynciterator-polyfill";

global.TextEncoder = require("text-encoding").TextEncoder;
global.TextDecoder = require("text-encoding").TextDecoder;
global.crypto = require("expo-crypto");
