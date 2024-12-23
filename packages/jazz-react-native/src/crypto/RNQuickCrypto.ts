import { base58 } from "@scure/base";
import { JsonValue, PureJSCrypto } from "cojson/native";
import { CojsonInternalTypes, cojsonInternals } from "cojson/native";
import { Ed } from "react-native-quick-crypto";
const { stableStringify } = cojsonInternals;

const textEncoder = new TextEncoder();

export class RNQuickCrypto extends PureJSCrypto {
  ed: Ed;

  constructor() {
    super();
    this.ed = new Ed("ed25519", {});
  }

  static async create(): Promise<RNQuickCrypto> {
    return new RNQuickCrypto();
  }

  newEd25519SigningKey(): Uint8Array {
    this.ed.generateKeyPairSync();
    return new Uint8Array(this.ed.getPrivateKey());
  }

  getSignerID(
    secret: CojsonInternalTypes.SignerSecret,
  ): CojsonInternalTypes.SignerID {
    return `signer_z${base58.encode(
      base58.decode(secret.substring("signerSecret_z".length)),
    )}`;
  }

  sign(
    secret: CojsonInternalTypes.SignerSecret,
    message: JsonValue,
  ): CojsonInternalTypes.Signature {
    const signature = new Uint8Array(
      this.ed.signSync(
        textEncoder.encode(stableStringify(message)),
        base58.decode(secret.substring("signerSecret_z".length)),
      ),
    );
    return `signature_z${base58.encode(signature)}`;
  }

  verify(
    signature: CojsonInternalTypes.Signature,
    message: JsonValue,
    id: CojsonInternalTypes.SignerID,
  ): boolean {
    return this.ed.verifySync(
      base58.decode(signature.substring("signature_z".length)),
      textEncoder.encode(stableStringify(message)),
      base58.decode(id.substring("signer_z".length)),
    );
  }
}
