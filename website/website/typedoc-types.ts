export interface TypeDocProject {
  id: number;
  name: string;
  variant: string;
  kind: number;
  flags: any;
  children: TypeDocDeclaration[];
  categories: TypeDocCategory[];
  readme: TypeDocReadmeItem[];
  symbolIdMap: any;
  files: any;
}

export interface TypeDocDeclaration {
  id: number;
  name: string;
  variant: string;
  kind: number;
  flags: any;
  sources: { fileName: string; line: number; character: number; url: string }[];
  signatures?: TypeDocSignature[];
  // Add other properties as needed
}

export interface TypeDocSignature {
  id: number;
  name: string;
  variant: string;
  kind: number;
  flags: any;
  sources: { fileName: string; line: number; character: number; url: string }[];
  parameters: TypeDocParameter[];
  type?: any; // Update this based on the actual type
}

export interface TypeDocParameter {
  id: number;
  name: string;
  variant: string;
  kind: number;
  flags: any;
  type: any; // Update this based on the actual type
}

export interface TypeDocCategory {
  title: string;
  children: number[];
}

export interface TypeDocReadmeItem {
  kind: string;
  text: string;
}