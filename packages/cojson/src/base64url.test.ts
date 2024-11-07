import { expect, test } from "vitest";
import { base64URLtoBytes, bytesToBase64url } from "./base64url.js";

const txt = new TextEncoder();

test("Test our Base64 URL encoding and decoding", () => {
  // tests from the RFC

  expect(base64URLtoBytes("")).toEqual(new Uint8Array([]));
  expect(bytesToBase64url(new Uint8Array([]))).toEqual("");

  expect(bytesToBase64url(txt.encode("f"))).toEqual("Zg==");
  expect(bytesToBase64url(txt.encode("fo"))).toEqual("Zm8=");
  expect(bytesToBase64url(txt.encode("foo"))).toEqual("Zm9v");
  expect(bytesToBase64url(txt.encode("foob"))).toEqual("Zm9vYg==");
  expect(bytesToBase64url(txt.encode("fooba"))).toEqual("Zm9vYmE=");
  expect(bytesToBase64url(txt.encode("foobar"))).toEqual("Zm9vYmFy");
  // reverse
  expect(base64URLtoBytes("Zg==")).toEqual(txt.encode("f"));
  expect(base64URLtoBytes("Zm8=")).toEqual(txt.encode("fo"));
  expect(base64URLtoBytes("Zm9v")).toEqual(txt.encode("foo"));
  expect(base64URLtoBytes("Zm9vYg==")).toEqual(txt.encode("foob"));
  expect(base64URLtoBytes("Zm9vYmE=")).toEqual(txt.encode("fooba"));
  expect(base64URLtoBytes("Zm9vYmFy")).toEqual(txt.encode("foobar"));

  expect(base64URLtoBytes("V2hhdCBkb2VzIDIgKyAyLjEgZXF1YWw_PyB-IDQ=")).toEqual(
    txt.encode("What does 2 + 2.1 equal?? ~ 4"),
  );
  // reverse
  expect(bytesToBase64url(txt.encode("What does 2 + 2.1 equal?? ~ 4"))).toEqual(
    "V2hhdCBkb2VzIDIgKyAyLjEgZXF1YWw_PyB-IDQ=",
  );
});
