import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  initialFiles,
  initialUsers,
} from "../data/mock";

import type {
  FileItem,
  Loan,
  UserRecord,
} from "../data/mock";

export type PanelKind =
  | "details"
  | "notes"
  | "files"
  | null;

interface WorkspaceState {
  activeLoan: Loan | null;
  panel: PanelKind;

  openPanel: (
    loan: Loan,
    panel: Exclude<PanelKind, null>,
  ) => void;

  closePanel: () => void;

  files: Record<
    string,
    {
      folders: string[];
      files: FileItem[];
    }
  >;

  addFolder: (
    loanId: string,
    name: string,
  ) => void;

  addFile: (
    loanId: string,
    folder: string,
    name: string,
    size: string,
  ) => void;

  deleteFile: (
    loanId: string,
    fileId: number,
  ) => void;

  users: UserRecord[];

  addUser: (
    user: Omit<
      UserRecord,
      "id" | "dateAdded" | "lastActive"
    >,
  ) => void;

  setUserStatus: (
    id: number,
    status: UserRecord["status"],
  ) => void;

  deleteUser: (
    id: number,
  ) => void;

  toasts: {
    id: number;
    message: string;
  }[];

  pushToast: (
    message: string,
  ) => void;

  dismissToast: (
    id: number,
  ) => void;
}

const WorkspaceContext =
  createContext<WorkspaceState | null>(
    null,
  );

let nextToastId = 0;

export function WorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeLoan, setActiveLoan] =
    useState<Loan | null>(null);

  const [panel, setPanel] =
    useState<PanelKind>(null);

  const [files, setFiles] =
    useState(initialFiles);

  const [users, setUsers] =
    useState(initialUsers);

  const [toasts, setToasts] =
    useState<
      {
        id: number;
        message: string;
      }[]
    >([]);

  const pushToast = useCallback(
    (message: string) => {
      const id = ++nextToastId;

      setToasts((current) => [
        ...current,
        { id, message },
      ]);

      window.setTimeout(() => {
        setToasts((current) =>
          current.filter(
            (toast) => toast.id !== id,
          ),
        );
      }, 3200);
    },
    [],
  );

  const dismissToast = useCallback(
    (id: number) => {
      setToasts((current) =>
        current.filter(
          (toast) => toast.id !== id,
        ),
      );
    },
    [],
  );

  const openPanel = useCallback(
    (
      loan: Loan,
      selectedPanel: Exclude<
        PanelKind,
        null
      >,
    ) => {
      setActiveLoan(loan);
      setPanel(selectedPanel);
    },
    [],
  );

  const closePanel = useCallback(() => {
    setPanel(null);
  }, []);

  const addFolder = useCallback(
    (loanId: string, name: string) => {
      const folderName = name.trim();

      if (!folderName) {
        return;
      }

      setFiles((currentFiles) => {
        const current = currentFiles[loanId] ?? {
          folders: [],
          files: [],
        };

        if (
          current.folders.includes(folderName)
        ) {
          return currentFiles;
        }

        return {
          ...currentFiles,
          [loanId]: {
            ...current,
            folders: [
              ...current.folders,
              folderName,
            ],
          },
        };
      });
    },
    [],
  );

  const addFile = useCallback(
    (
      loanId: string,
      folder: string,
      name: string,
      size: string,
    ) => {
      setFiles((currentFiles) => {
        const current = currentFiles[loanId] ?? {
          folders: [],
          files: [],
        };

        const extension =
          name
            .split(".")
            .pop()
            ?.toUpperCase() ?? "FILE";

        return {
          ...currentFiles,
          [loanId]: {
            ...current,
            files: [
              ...current.files,
              {
                id: Date.now(),
                name,
                type: extension,
                size,
                folder,
              },
            ],
          },
        };
      });
    },
    [],
  );

  const deleteFile = useCallback(
    (loanId: string, fileId: number) => {
      setFiles((currentFiles) => {
        const current = currentFiles[loanId] ?? {
          folders: [],
          files: [],
        };

        return {
          ...currentFiles,
          [loanId]: {
            ...current,
            files: current.files.filter(
              (file) => file.id !== fileId,
            ),
          },
        };
      });
    },
    [],
  );

  const addUser = useCallback(
    (
      user: Omit<
        UserRecord,
        "id" | "dateAdded" | "lastActive"
      >,
    ) => {
      setUsers((currentUsers) => [
        {
          ...user,
          id:
            Math.max(
              0,
              ...currentUsers.map(
                (currentUser) =>
                  currentUser.id,
              ),
            ) + 1,
          dateAdded:
            new Date().toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            ),
          lastActive: "Never",
        },
        ...currentUsers,
      ]);
    },
    [],
  );

  const setUserStatus = useCallback(
    (
      id: number,
      status: UserRecord["status"],
    ) => {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === id
            ? { ...user, status }
            : user,
        ),
      );
    },
    [],
  );

  const deleteUser = useCallback(
    (id: number) => {
      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user.id !== id,
        ),
      );
    },
    [],
  );

  const value = useMemo<WorkspaceState>(
    () => ({
      activeLoan,
      panel,
      openPanel,
      closePanel,
      files,
      addFolder,
      addFile,
      deleteFile,
      users,
      addUser,
      setUserStatus,
      deleteUser,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      activeLoan,
      panel,
      openPanel,
      closePanel,
      files,
      addFolder,
      addFile,
      deleteFile,
      users,
      addUser,
      setUserStatus,
      deleteUser,
      toasts,
      pushToast,
      dismissToast,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(
    WorkspaceContext,
  );

  if (!context) {
    throw new Error(
      "useWorkspace must be used within WorkspaceProvider",
    );
  }

  return context;
}