/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import Button from "./components/button";
import InviteModal from "./components/invite-modal";
import NewItemModal from "./components/new-item-modal";
import Table from "./components/table";

import { CoMapInit, Group, ID } from "jazz-tools";
import { useNavigate, useParams } from "react-router-dom";
import { Folder, FolderList, PasswordItem } from "./1_schema";
import { useAccount, useCoState } from "./2_main";
import {
  addSharedFolder,
  createFolder,
  deleteItem,
  saveItem,
  updateItem,
} from "./4_actions";
import { Alert, AlertDescription } from "./components/alert";
import { PasswordItemFormValues } from "./types";

const VaultPage: React.FC = () => {
  const { me, logOut } = useAccount();
  const sharedFolderId = useParams<{ sharedFolderId: ID<Folder> }>()
    .sharedFolderId;

  const navigate = useNavigate();

  useEffect(() => {
    if (!sharedFolderId) return;

    addSharedFolder(sharedFolderId, me).then(() => {
      navigate("/vault");
    });

    // We want to trigger this only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = me.root?.folders?.flatMap(
    (folder) =>
      folder?.items?.filter(
        (item): item is Exclude<typeof item, null> => !!item,
      ) || [],
  );
  const folders = useCoState(FolderList, me.root?._refs.folders?.id, [
    { items: [{}] },
  ]);

  const [selectedFolder, setSelectedFolder] = useState<Folder | undefined>();
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNewFolderInputVisible, setIsNewFolderInputVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingItem, setEditingItem] = useState<PasswordItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = selectedFolder
    ? items?.filter(
        (item) => item?.folder?.name === selectedFolder.name && !item.deleted,
      )
    : items?.filter((item) => !item?.deleted);

  const handleSaveNewItem = async (newItem: PasswordItemFormValues) => {
    try {
      saveItem(newItem as CoMapInit<PasswordItem>);
    } catch (err: any) {
      setError("Failed to save new item. Please try again.");
      throw new Error(err);
    }
  };

  const handleUpdateItem = async (updatedItem: PasswordItemFormValues) => {
    if (!editingItem) return;
    try {
      updateItem(editingItem, updatedItem);
      setEditingItem(null);
    } catch (err: any) {
      setError("Failed to update item. Please try again.");
      throw new Error(err);
    }
  };

  const handleDeleteItem = async (item: PasswordItem) => {
    try {
      deleteItem(item);
    } catch (err) {
      setError("Failed to delete item. Please try again.");
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName) {
      try {
        const newFolder = createFolder(newFolderName, me);
        setNewFolderName("");
        setIsNewFolderInputVisible(false);
        setSelectedFolder(newFolder);
      } catch (err) {
        setError("Failed to create folder. Please try again.");
      }
    }
  };

  const handleDeleteFolder = async () => {
    try {
      const selectedFolderIndex = me.root?.folders?.findIndex(
        (folder) => folder?.id === selectedFolder?.id,
      );
      if (selectedFolderIndex !== undefined && selectedFolderIndex > -1)
        me.root?.folders?.splice(selectedFolderIndex, 1);
    } catch (err) {
      setError("Failed to create folder. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      logOut();
    } catch (err) {
      setError("Failed to logout. Please try again.");
    }
  };

  const columns = [
    { header: "Name", accessor: "name" as const },
    { header: "Username", accessor: "username" as const },
    { header: "URI", accessor: "uri" as const },
    {
      header: "Actions",
      accessor: "id" as const,
      render: (item: PasswordItem) => (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigator.clipboard.writeText(item.password)}>
            Copy Password
          </Button>
          <Button
            onClick={() => setEditingItem(item)}
            disabled={
              item._owner.castAs(Group).myRole() !== "admin" &&
              item._owner.castAs(Group).myRole() !== "writer"
            }
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDeleteItem(item)}
            variant="danger"
            disabled={
              item._owner.castAs(Group).myRole() !== "admin" &&
              item._owner.castAs(Group).myRole() !== "writer"
            }
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="container flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-8">Password Vault</h1>
        <Button onClick={handleLogout} variant="secondary">
          Logout
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            key={"folder-all"}
            onClick={() => setSelectedFolder(undefined)}
            variant={!selectedFolder ? "primary" : "secondary"}
          >
            All
          </Button>
          {folders?.map((folder) => (
            <Button
              key={folder.id}
              onClick={() => setSelectedFolder(folder)}
              variant={
                selectedFolder?.name === folder?.name ? "primary" : "secondary"
              }
            >
              {folder?.name}
            </Button>
          ))}
          {isNewFolderInputVisible ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="border rounded px-2 py-1"
              />
              <Button onClick={handleCreateFolder}>Save</Button>
            </div>
          ) : (
            <Button onClick={() => setIsNewFolderInputVisible(true)}>
              New Folder
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsNewItemModalOpen(true)}
            disabled={
              !selectedFolder ||
              (selectedFolder._owner.castAs(Group).myRole() !== "admin" &&
                selectedFolder._owner.castAs(Group).myRole() !== "writer")
            }
          >
            New Item
          </Button>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            disabled={
              !selectedFolder ||
              (selectedFolder._owner.castAs(Group).myRole() !== "admin" &&
                selectedFolder._owner.castAs(Group).myRole() !== "writer")
            }
          >
            Share Folder
          </Button>
          <Button onClick={handleDeleteFolder} disabled={!selectedFolder}>
            Delete Folder
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table data={filteredItems} columns={columns} />
      </div>
      {folders ? (
        <NewItemModal
          isOpen={isNewItemModalOpen || !!editingItem}
          onClose={() => {
            setIsNewItemModalOpen(false);
            setEditingItem(null);
          }}
          onSave={editingItem ? handleUpdateItem : handleSaveNewItem}
          folders={folders}
          selectedFolder={selectedFolder}
          initialValues={
            editingItem && editingItem.folder ? { ...editingItem } : undefined
          }
        />
      ) : null}

      {folders ? (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          selectedFolder={selectedFolder}
        />
      ) : null}
    </div>
  );
};

export default VaultPage;
