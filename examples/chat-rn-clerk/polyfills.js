import "react-native-polyfill-globals/auto";
import "@azure/core-asynciterator-polyfill";
import { ReadableStream } from "web-streams-polyfill/ponyfill/es6";
import { polyfillGlobal } from "react-native/Libraries/Utilities/PolyfillFunctions";
import { Buffer } from "buffer";

polyfillGlobal("Buffer", () => Buffer);
polyfillGlobal("ReadableStream", () => ReadableStream);
