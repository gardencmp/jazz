import fs from "fs";
import * as path from 'path';

const tlsKeyName = path.resolve(__dirname, "../../cert/localhost+1-key.pem");
const tlsCertName = path.resolve(__dirname, "../../cert/localhost+1.pem");

export const tlsCert = {
    key: fs.readFileSync(tlsKeyName),
    cert: fs.readFileSync(tlsCertName),
};

export const tlsCertPath = {
  tlsKeyName,
  tlsCertName
}
