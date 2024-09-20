import { Account, co, CoList, CoMap, Group, Profile } from "jazz-tools";

export class PasswordItem extends CoMap {
  name = co.string;
  username = co.optional.string;
  username_input_selector = co.optional.string;
  password = co.string;
  password_input_selector = co.optional.string;
  uri = co.optional.string;
  folder = co.ref(Folder);
  deleted = co.boolean;
}

export class PasswordList extends CoList.Of(co.ref(PasswordItem)) {}

export class Folder extends CoMap {
  name = co.string;
  items = co.ref(PasswordList);
}

export class FolderList extends CoList.Of(co.ref(Folder)) {}

export class PasswordManagerAccountRoot extends CoMap {
  folders = co.ref(FolderList);
}

export class PasswordManagerAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(PasswordManagerAccountRoot);

  migrate(this: PasswordManagerAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
    if (!this._refs.root) {
      const group = Group.create({ owner: this });
      const firstFolder = Folder.create(
        {
          name: "Default",
          items: PasswordList.create([], { owner: group }),
        },
        { owner: group }
      );

      firstFolder.items?.push(
        PasswordItem.create(
          {
            name: "Gmail",
            username: "user@gmail.com",
            password: "password123",
            uri: "https://gmail.com",
            folder: firstFolder,
            deleted: false,
          },
          { owner: group }
        )
      );

      firstFolder.items?.push(
        PasswordItem.create(
          {
            name: "Facebook",
            username: "user@facebook.com",
            password: "facebookpass",
            uri: "https://facebook.com",
            folder: firstFolder,
            deleted: false,
          },
          { owner: group }
        )
      );

      this.root = PasswordManagerAccountRoot.create(
        {
          folders: FolderList.create([firstFolder], {
            owner: this,
          }),
        },
        { owner: this }
      );
    }
  }
}
