import { Account, CoList, CoMap, Group, Profile, co } from "jazz-tools";

export class ToDoItem extends CoMap {
  name = co.string;
  completed = co.boolean;
}

export class ToDoList extends CoList.Of(co.ref(ToDoItem)) {}

export class Folder extends CoMap {
  name = co.string;
  items = co.ref(ToDoList);
}

export class FolderList extends CoList.Of(co.ref(Folder)) {}

export class ToDoAccountRoot extends CoMap {
  folders = co.ref(FolderList);
}

export class ToDoAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(ToDoAccountRoot);

  migrate(this: ToDoAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
    if (!this._refs.root) {
      const group = Group.create({ owner: this });
      const exampleTodo = ToDoItem.create(
        { name: "Example todo", completed: false },
        { owner: group },
      );

      const defaultFolder = Folder.create(
        {
          name: "Default",
          items: ToDoList.create([exampleTodo], { owner: group }),
        },
        { owner: group },
      );

      this.root = ToDoAccountRoot.create(
        {
          folders: FolderList.create([defaultFolder], {
            owner: this,
          }),
        },
        { owner: this },
      );
    }
  }
}
