import { Account, CoList, CoMap, FileStream, Profile, co } from 'jazz-tools';

export class SharedFile extends CoMap {
  name = co.string;
  description = co.string;
  file = co.ref(FileStream);
  createdAt = co.number;
  updatedAt = co.number;
}

export class FileShareProfile extends Profile {
  name = co.string;
}

export class ListOfSharedFiles extends CoList.Of(co.ref(SharedFile)) {}

export class FileShareAccountRoot extends CoMap {
  sharedFiles = co.ref(ListOfSharedFiles);
}

export class FileShareAccount extends Account {
  profile = co.ref(FileShareProfile);
  root = co.ref(FileShareAccountRoot);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate(this: FileShareAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);

    // Initialize root if it doesn't exist
    if (!this.root) {
      this.root = FileShareAccountRoot.create(
        {
          sharedFiles: ListOfSharedFiles.create([], { owner: this })
        },
        { owner: this }
      );
    }

    // Ensure sharedFiles exists even if root was already created
    if (!this.root.sharedFiles) {
      this.root.sharedFiles = ListOfSharedFiles.create([], { owner: this });
    }
  }
}
