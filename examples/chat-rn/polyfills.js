import "react-native-polyfill-globals/auto";
import "@azure/core-asynciterator-polyfill";
import { ReadableStream } from "web-streams-polyfill/ponyfill/es6";
import { polyfillGlobal } from "react-native/Libraries/Utilities/PolyfillFunctions";

polyfillGlobal("ReadableStream", () => ReadableStream);
