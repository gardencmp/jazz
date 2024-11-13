<template>
  <div class="todo-container">
    <div class="folders">
      <div class="section-header">
        <h2>Folders</h2>
        <div class="new-folder">
          <input 
            v-model="newFolderName" 
            placeholder="New folder name" 
            class="input"
          />
          <button class="btn btn-primary" @click="createFolder">Create</button>
        </div>
      </div>
      
      <div class="folder-list">
        <div
          v-for="folder in folders"
          :key="folder?.id"
          :class="['folder-item', { active: selectedFolder?.id === folder?.id }]"
          @click="selectFolder(folder)"
        >
          <span class="folder-name">{{ folder?.name }}</span>
          <button class="btn btn-icon" @click.stop="deleteFolder(folder?.id)">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    </div>

    <div class="todos" v-if="selectedFolder">
      <div class="section-header">
        <h2>{{ selectedFolder?.name }}</h2>
        <div class="new-todo">
          <input 
            v-model="newTodoTitle" 
            placeholder="Add a new task" 
            class="input"
          />
          <button class="btn btn-primary" @click="createTodo">Add</button>
        </div>
      </div>

      <div class="todo-list">
        <template v-if="selectedFolder?.items?.length">
          <div v-for="todo in selectedFolder.items" :key="todo?.id" class="todo-item">
            <label class="todo-label">
              <input
                type="checkbox"
                :checked="todo?.completed"
                @change="toggleTodo(todo)"
              />
              <span :class="{ completed: todo?.completed }">{{ todo?.name }}</span>
            </label>
            <button class="btn btn-icon" @click="deleteTodo(todo?.id)">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Group, type ID } from "jazz-tools";
import { ref, toRaw, watch } from "vue";
import { computed } from "vue";
import { useAccount, useCoState } from "../main";
import { Folder, FolderList, ToDoItem, ToDoList } from "../schema";

const { me } = useAccount();

// Get the id of the folders list so we can pass it to useCoState.
// It's a computed ref because the id is not available until the root is loaded.
const computedFoldersId = computed(() => me.value?.root?.folders?.id);

// Load the folders list.
// useCoState will react to changes in computedFoldersId and to changes in data inside the FolderList covalue
// It also specifies a depth parameter to load nested values
const folders = useCoState(FolderList, computedFoldersId, [{ items: [{}] }]);

const selectedFolder = ref<Folder>();
const newFolderName = ref("");
const newTodoTitle = ref("");

// Select the first folder if none is selected
watch(folders, (loadedFolders) => {
  if (selectedFolder.value) return;
  selectedFolder.value = loadedFolders?.[0] || undefined;
});

const selectFolder = (folder: Folder) => {
  selectedFolder.value = folder;
};

const createFolder = () => {
  if (!newFolderName.value.trim()) return;

  // Create a group where the folder will be owned by the current user
  const group = Group.create({ owner: me.value });

  // Create the folder
  const newFolder = Folder.create(
    {
      name: newFolderName.value,
      items: ToDoList.create([], { owner: group }),
    },
    { owner: group },
  );

  // Add the folder to the list of folders. This change will be synced to all connected clients.
  folders.value?.push(newFolder);
  newFolderName.value = "";
};

const deleteFolder = (folderId: ID<Folder> | undefined) => {
  if (!folders.value || !folderId) return;

  const index = folders.value.findIndex((f) => f.id === folderId);
  if (index !== -1) {
    // Remove the folder from the list. This change will be synced to all connected clients.
    folders.value.splice(index, 1);
  }

  if (selectedFolder.value?.id === folderId) {
    selectedFolder.value = folders.value[0] || null;
  }
};

// Todo handlers
const createTodo = () => {
  if (!newTodoTitle.value.trim() || !selectedFolder.value) return;
  const group = Group.create({ owner: me.value });
  const newTodo = ToDoItem.create(
    {
      name: newTodoTitle.value,
      completed: false,
    },
    { owner: group },
  );

  // Add the todo to the list of todos. This change will be synced to all connected clients.
  // toRaw is used to get the plain object from the reactive object, because the plain object is already proxied by Jazz.
  // otherwise it will throw an error.
  toRaw(selectedFolder.value)?.items?.push(newTodo);
  newTodoTitle.value = "";
};

const deleteTodo = (todoId: ID<ToDoItem> | undefined) => {
  if (!selectedFolder.value?.items || !todoId) return;

  const index = toRaw(selectedFolder.value)?.items?.findIndex(
    (t) => t?.id === todoId,
  );
  if (index !== -1 && index !== undefined) {
    toRaw(selectedFolder.value)?.items?.splice(index, 1);
  }
};

const toggleTodo = (todo: ToDoItem | null) => {
  if (!todo) return;
  todo.completed = !todo.completed;
};
</script>

<style scoped>
.todo-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

h2 {
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
}

.folders {
  border-right: 1px solid #eee;
}

.folder-list,
.todo-list {
  padding: 1rem;
}

.folder-item {
  padding: 0.75rem 1rem;
  margin: 0.25rem 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 6px;
  transition: all 0.2s;
  color: #333;
}

.folder-item:hover {
  background-color: #f8f9fa;
}

.folder-item.active {
  background-color: #e9ecef;
}

.todo-item {
  padding: 0.75rem 1rem;
  margin: 0.25rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 6px;
  transition: all 0.2s;
  color: #333;
}

.todo-item:hover {
  background-color: #f8f9fa;
}

.todo-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: #333;
}

.completed {
  text-decoration: line-through;
  color: #6c757d;
}

.input {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.9rem;
  width: 100%;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-icon {
  padding: 0.25rem;
  background: transparent;
  color: #dc3545;
}

.btn-icon:hover {
  background-color: #fee2e2;
}

.new-folder,
.new-todo {
  display: flex;
  gap: 0.5rem;
}

.folder-name {
  color: #333;
}
</style>
