import { faker } from "@faker-js/faker";
import { Account, CoList, CoMap, Group, ID, co } from "jazz-tools";

export class Comment extends CoMap {
  text = co.string;
}

export class CommentList extends CoList.Of(co.ref(Comment)) {}

export class Task extends CoMap {
  title = co.string;
  comments = co.ref(CommentList);
}

export class TaskList extends CoList.Of(co.ref(Task)) {}

export class AccountRoot extends CoMap {
  tasks = co.ref(TaskList);
}

export class MillionTasksAccount extends Account {
  root = co.ref(AccountRoot);

  async migrate(creationProps: { name: string }) {
    super.migrate(creationProps);

    if (!this._refs.root) {
      const tasks = await TaskList.load(
        "co_zZsMvX5ZqKt4164YkLLq9iTd7LY" as ID<TaskList>,
        this,
        [],
      );
      this.root = AccountRoot.create(
        {
          tasks: tasks!,
        },
        { owner: this },
      );
    }
  }
}

export function addTasks(taskList: TaskList) {
  const arr = [];
  for (let i = 0; i < 10_000; i++) {
    arr.push(createTask(taskList._owner as Group).id);
  }
  taskList._raw.appendItems(arr, undefined, "private");
}

export function createTask(group: Group) {
  return Task.create(
    {
      title: faker.word.words({ count: { min: 5, max: 10 } }),
      comments: CommentList.create(
        Array.from({ length: 10 }, () =>
          Comment.create({ text: faker.lorem.paragraphs(5) }, { owner: group }),
        ),
        { owner: group },
      ),
    },
    { owner: group },
  );
}
