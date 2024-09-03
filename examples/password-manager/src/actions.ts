import { Group } from "jazz-tools";
import {
  Folder,
  PasswordItem,
  PasswordList,
  PasswordManagerAccount,
} from "./schema";
import { CoMapInit } from "jazz-tools";
import { createInviteLink } from "jazz-react";

export const saveItem = (item: CoMapInit<PasswordItem>): PasswordItem => {
  const passwordItem = PasswordItem.create(item, {
    owner: item.folder!._owner,
  });
  passwordItem.folder?.items?.push(passwordItem);
  return passwordItem;
};

export const updateItem = (item: PasswordItem): PasswordItem => {
  item;
  const passwordItem = PasswordItem.create(item, {
    owner: item.folder!._owner,
  });
  passwordItem.folder?.items?.push(passwordItem);
  return passwordItem;
};

export const deleteItem = (item: PasswordItem): void => {
  const found = item.folder?.items?.findIndex(
    (passwordItem) => passwordItem?.id === item.id
  );
  if (found !== undefined && found > -1) item.folder?.items?.splice(found, 1);
};

export const createFolder = (
  folderName: string,
  me: PasswordManagerAccount
): Folder => {
  const group = Group.create({ owner: me });
  const folder = Folder.create(
    { name: folderName, items: PasswordList.create([], { owner: group }) },
    { owner: group }
  );
  me.root?.folders?.push(folder);
  return folder;
};

export const shareFolder = (
  folder: Folder,
  permission: "reader" | "writer" | "admin"
): string | undefined => {
  if (folder._owner && folder.id) {
    return createInviteLink(folder, permission);
  }
  return undefined;
};
