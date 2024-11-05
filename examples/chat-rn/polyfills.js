import "react-native-polyfill-globals/auto";
import "@azure/core-asynciterator-polyfill";
import { polyfillGlobal } from "react-native/Libraries/Utilities/PolyfillFunctions";
import { ReadableStream } from "web-streams-polyfill/ponyfill/es6";

polyfillGlobal("ReadableStream", () => ReadableStream);
