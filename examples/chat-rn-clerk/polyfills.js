import "react-native-polyfill-globals/auto";
import "@azure/core-asynciterator-polyfill";
import { Buffer } from "buffer";
import { polyfillGlobal } from "react-native/Libraries/Utilities/PolyfillFunctions";
import { ReadableStream } from "web-streams-polyfill/ponyfill/es6";

polyfillGlobal("Buffer", () => Buffer);
polyfillGlobal("ReadableStream", () => ReadableStream);
