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
  sharedFiles = co.ref(ListOfSharedFiles);
  publicGroup = co.ref(Group);
}

export class FileShareAccount extends Account {
  profile = co.ref(FileShareProfile);
  root = co.ref(FileShareAccountRoot);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  async migrate(this: FileShareAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);

    await this._refs.root?.load();

    // Initialize root if it doesn't exist
    if (!this.root) {
      // Create a group that will own all shared files
      const publicGroup = Group.create({ owner: this });
      publicGroup.addMember(this, 'admin');
      publicGroup.addMember('everyone', 'reader');

      this.root = FileShareAccountRoot.create(
        {
          sharedFiles: ListOfSharedFiles.create([], { owner: publicGroup }),
          publicGroup
        },
        { owner: this }
      );
    }

    console.log('root', this.root);

    // Ensure the group exists and has everyone as reader
    if (!this.root.publicGroup) {
      const publicGroup = Group.create({ owner: this });
      publicGroup.addMember(this, 'admin');
      publicGroup.addMember('everyone', 'reader');
      this.root.publicGroup = publicGroup;
    }
  }
}
