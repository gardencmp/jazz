import React, { useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import BaseModal from "./base-modal";
import Button from "./button";
import { Alert, AlertDescription } from "./alert";
import { Folder } from "../schema";
import { CoMap } from "jazz-tools";

export interface PasswordItemFormValues extends FieldValues {
  name: string;
  username?: string;
  password: string;
  uri?: string;
  deleted: boolean;
  folder: Folder | null;
}

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: PasswordItemFormValues;
  onSave: (item: PasswordItemFormValues) => void;
  folders: Folder[];
  selectedFolder: Folder | undefined;
}

const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  initialValues,
  onSave,
  folders,
  selectedFolder,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    // @ts-expect-error error
  } = useForm<PasswordItemFormValues>({
    defaultValues: initialValues || {
      name: "",
      username: "",
      password: "",
      uri: "",
      deleted: false,
      folder: selectedFolder,
    },
  });

  useEffect(() => {
    if (initialValues) {
      Object.entries(initialValues).forEach(([key, value]) => {
        const valueToSet = value instanceof CoMap ? value.id : value;
        setValue(key as keyof PasswordItemFormValues & string, valueToSet);
      });
    } else {
      reset();
    }
  }, [initialValues, setValue, reset]);

  const onSubmit: SubmitHandler<PasswordItemFormValues> = (data) => {
    const folderId = data?.folder as unknown as string;
    const selectedFolder = folders.find((folder) => folder.id === folderId);
    if (selectedFolder) {
      data.folder = selectedFolder;
    }
    onSave(data);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialValues ? "Edit Password" : "Add New Password"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            type="text"
            {...register("name", { required: "Name is required" })}
            id="name"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.name && (
            <Alert variant="destructive">
              <AlertDescription>{errors.name.message}</AlertDescription>
            </Alert>
          )}
        </div>
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <input
            type="text"
            {...register("username")}
            id="username"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
              },
            })}
            id="password"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.password && (
            <Alert variant="destructive">
              <AlertDescription>{errors.password.message}</AlertDescription>
            </Alert>
          )}
        </div>
        <div>
          <label
            htmlFor="uri"
            className="block text-sm font-medium text-gray-700"
          >
            URI
          </label>
          <input
            type="url"
            {...register("uri", {
              validate: (value) =>
                !value ||
                value.startsWith("http://") ||
                value.startsWith("https://") ||
                "URI must start with http:// or https://",
            })}
            id="uri"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.uri && (
            <Alert variant="destructive">
              <AlertDescription>{errors.uri.message}</AlertDescription>
            </Alert>
          )}
        </div>
        <div>
          <label
            htmlFor="folder"
            className="block text-sm font-medium text-gray-700"
          >
            Folder
          </label>
          <select
            {...register("folder", { required: "Must select a folder" })}
            id="folder"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select a folder</option>
            {folders.map((folder) => (
              <option
                key={folder.id}
                value={folder.id}
                selected={
                  initialValues
                    ? initialValues?.folder?.id === folder.id
                    : selectedFolder?.id === folder.id
                }
              >
                {folder.name}
              </option>
            ))}
          </select>
          {errors.folder && (
            <Alert variant="destructive">
              <AlertDescription>{errors.folder.message}</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initialValues ? "Update" : "Save"}</Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default NewItemModal;
