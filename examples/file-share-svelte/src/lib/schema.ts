import { Account, CoList, CoMap, FileStream, Profile, co, Group } from 'jazz-tools';

export class SharedFile extends CoMap {
  name = co.string;
  file = co.ref(FileStream);
  createdAt = co.Date;
  uploadedAt = co.Date;
  size = co.number;
}

export class FileShareProfile extends Profile {
  name = co.string;
}

export class ListOfSharedFiles extends CoList.Of(co.ref(SharedFile)) {}

export class FileShareAccountRoot extends CoMap {
  type = co.string;
  sharedFiles = co.ref(ListOfSharedFiles);
  publicGroup = co.ref(Group);
}

export class FileShareAccount extends Account {
  profile = co.ref(FileShareProfile);
  root = co.ref(FileShareAccountRoot);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  async migrate(creationProps?: { name: string }) {
    super.migrate(creationProps);

    await this._refs.root?.load();

    // Initialize root if it doesn't exist
    if (!this.root || this.root.type !== 'file-share-account') {
      // Create a group that will own all shared files
      const publicGroup = Group.create({ owner: this });
      publicGroup.addMember('everyone', 'reader');

      this.root = FileShareAccountRoot.create(
        {
          type: 'file-share-account',
          sharedFiles: ListOfSharedFiles.create([], { owner: publicGroup }),
          publicGroup
        },
        { owner: this }
      );
    }
  }
}
