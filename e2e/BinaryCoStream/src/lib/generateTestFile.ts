import { Account, Group, BinaryCoStream } from "jazz-tools";
import { UploadedFile } from "../schema";

export async function generateTestFile(me: Account, bytes: number) {
  const group = Group.create({ owner: me });
  group.addMember("everyone", "writer");

  const ownership = { owner: group };

  const file = await BinaryCoStream.createFromBlob(
    new Blob(['1'.repeat(bytes)], { type: 'image/png' }),
    {
      ...ownership,
      nonBlocking: true,
    }
  )

  const testFile = UploadedFile.create(
    {
      file,
      syncCompleted: false,
    },
    ownership
  );

  const url = new URL(window.location.href);

  url.searchParams.set("valueId", testFile.id);

  return testFile;
}

