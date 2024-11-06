import { Group } from "jazz-tools";
import React, { useState } from "react";
import { Folder } from "../1_schema";
import { shareFolder } from "../4_actions";
import BaseModal from "./base-modal";
import Button from "./button";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFolder: Folder | undefined;
}

const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  selectedFolder,
}) => {
  const [selectedPermission, setSelectedPermission] = useState<
    "reader" | "writer" | "admin"
  >("reader");
  const [inviteLink, setInviteLink] = useState("");

  const members = selectedFolder?._owner.castAs(Group).members;
  const invitedMembers = members
    ? members
        .filter((m) => !m.account?.isMe && m.role !== "revoked")
        .map((m) => m.account)
    : [];

  const handleCreateInviteLink = () => {
    if (!selectedFolder || !selectedPermission) return;
    const inviteLink = shareFolder(selectedFolder, selectedPermission);
    if (!inviteLink) return;
    setInviteLink(inviteLink);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Invite Users">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="folder"
            className="block text-sm font-medium text-gray-700"
          >
            Select Folder to Share
          </label>
          <select
            id="folder"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option key={selectedFolder?.id} value={selectedFolder?.id}>
              {selectedFolder?.name}
            </option>
          </select>
        </div>
        <div>
          <label
            htmlFor="permission"
            className="block text-sm font-medium text-gray-700"
          >
            Select Permission
          </label>
          <select
            id="permission"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={selectedPermission}
            onChange={(e) =>
              setSelectedPermission(
                e.target.value as "reader" | "writer" | "admin",
              )
            }
          >
            <option value="reader">Reader</option>
            <option value="writer">Writer</option>
          </select>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Existing Shared Users</h3>
          <div className="max-h-40 overflow-y-auto bg-gray-100 rounded-md p-2">
            {invitedMembers.length > 0 ? (
              <ul className="list-disc list-inside">
                {invitedMembers.map((user) => (
                  <li
                    key={user?.id}
                    className="text-sm flex justify-between items-center"
                  >
                    <span>{user?.profile?.name}</span>
                    <button
                      onClick={() => {
                        if (!user?._raw) return;
                        selectedFolder?._owner
                          .castAs(Group)
                          ._raw.removeMember(user?._raw);
                      }}
                      className="ml-4 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No users currently have access to this folder.
              </p>
            )}
          </div>
        </div>
        <Button onClick={handleCreateInviteLink} className="w-full">
          Create Invite Link
        </Button>
        {inviteLink && (
          <div className="mt-4">
            <label
              htmlFor="inviteLink"
              className="block text-sm font-medium text-gray-700"
            >
              Invite Link
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="inviteLink"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                value={inviteLink}
                readOnly
              />
              <Button
                type="button"
                className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 text-gray-500 text-sm"
                onClick={() => navigator.clipboard.writeText(inviteLink)}
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default InviteModal;
