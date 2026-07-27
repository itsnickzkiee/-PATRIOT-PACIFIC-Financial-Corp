import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";

import Drawer from "./Drawer";
import { useWorkspace } from "../state/workspace";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;
const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

type LoanFolder = {
  id: number;
  name: string;
  createdAt: string;
};

type LoanFile = {
  id: number;
  loanId: string;
  folderId: number | null;
  folderName: string | null;
  name: string;
  type: string;
  sizeBytes: number;
  uploadedAt: string;
  previewUrl: string;
  downloadUrl: string;
};

type LoanFilesResponse = {
  folders?: LoanFolder[];
  files?: LoanFile[];
  message?: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeLabel(file: LoanFile) {
  return file.name.split(".").pop()?.toUpperCase() ?? "FILE";
}

export default function LoanFilesSheet() {
  const { activeLoan, panel, closePanel, pushToast } = useWorkspace();
  const open = panel === "files" && Boolean(activeLoan);

  const [folders, setFolders] = useState<LoanFolder[]>([]);
  const [files, setFiles] = useState<LoanFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFolder =
    folders.find((folder) => folder.id === currentFolderId) ?? null;

  const visibleFiles =
    currentFolderId === null
      ? files
      : files.filter((file) => file.folderId === currentFolderId);

  async function loadFiles() {
    if (!activeLoan) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/loan-files/loan/${encodeURIComponent(activeLoan.id)}`,
      );
      const data = (await response.json()) as LoanFilesResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to load loan files.");
      }

      setFolders(data.folders ?? []);
      setFiles(data.files ?? []);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Unable to load loan files.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setCurrentFolderId(null);
    setNewFolderMode(false);
    setFolderName("");
    void loadFiles();
  }, [open, activeLoan?.id]);

  if (!activeLoan) return null;

  async function createFolder() {
    if (!activeLoan) return;

    const name = folderName.trim();
    if (!name) return;

    try {
      const response = await fetch(
        `${API_URL}/loan-files/loan/${encodeURIComponent(activeLoan.id)}/folders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const data = (await response.json()) as {
        folder?: LoanFolder;
        message?: string;
      };

      if (!response.ok || !data.folder) {
        throw new Error(data.message ?? "Unable to create folder.");
      }

      setFolders((current) =>
        [...current, data.folder!].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setFolderName("");
      setNewFolderMode(false);
      pushToast(`Folder “${name}” created.`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Unable to create folder.");
    }
  }

  async function uploadFiles(selected: FileList | File[]) {
    if (!activeLoan) return;

    const chosen = Array.from(selected);
    if (chosen.length === 0) return;

    const oversized = chosen.find((file) => file.size > 20 * 1024 * 1024);
    if (oversized) {
      pushToast(`${oversized.name} exceeds 20 MB.`);
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      chosen.forEach((file) => formData.append("files", file));
      if (currentFolderId !== null) {
        formData.append("folderId", String(currentFolderId));
      }

      const response = await fetch(
        `${API_URL}/loan-files/loan/${encodeURIComponent(activeLoan.id)}/upload`,
        { method: "POST", body: formData },
      );
      const data = (await response.json()) as {
        files?: LoanFile[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to upload files.");
      }

      await loadFiles();
      pushToast(`${data.files?.length ?? chosen.length} file(s) uploaded.`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Unable to upload files.");
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(file: LoanFile) {
    if (!window.confirm(`Delete “${file.name}”?`)) return;

    try {
      const response = await fetch(`${API_URL}/loan-files/${file.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to delete file.");
      }

      setFiles((current) => current.filter((item) => item.id !== file.id));
      pushToast(`${file.name} deleted.`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Unable to delete file.");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={closePanel}
      width={1160}
      header={
        <>
          <Folder className="h-5 w-5 shrink-0 text-amber-300" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-200/60">
              Loan Files
            </p>
            <h2 className="font-display truncate text-lg font-bold text-white">
              <span className="font-mono text-amber-300">#{activeLoan.id}</span>
              <span className="mx-2 text-white/30">·</span>
              {activeLoan.borrower}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setNewFolderMode(true)}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-[#2a0713] shadow-md shadow-amber-400/20 transition hover:brightness-105 active:scale-95"
          >
            <FolderPlus className="h-3.5 w-3.5" /> New Folder
          </button>
        </>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
        onChange={(event) => {
          if (event.target.files) void uploadFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="w-60 shrink-0 space-y-5 overflow-y-auto border-r border-border bg-stone-50/70 p-4">
          <div>
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Library
            </p>
            <button
              type="button"
              onClick={() => setCurrentFolderId(null)}
              className={`mt-1.5 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                currentFolderId === null
                  ? "bg-rose-700 text-white shadow-sm"
                  : "text-foreground/80 hover:bg-muted"
              }`}
            >
              <List className="h-4 w-4" /> All Files
              <span className="ml-auto text-xs">{files.length}</span>
            </button>
          </div>

          <div>
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Folders
            </p>
            <div className="mt-1.5 space-y-1">
              {folders.map((folder) => {
                const count = files.filter((file) => file.folderId === folder.id).length;
                return (
                  <button
                    type="button"
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      currentFolderId === folder.id
                        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                        : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    {currentFolderId === folder.id ? (
                      <FolderOpen className="h-4 w-4" />
                    ) : (
                      <Folder className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="truncate">{folder.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{count}</span>
                  </button>
                );
              })}

              {folders.length === 0 && !loading && (
                <p className="px-3 py-2 text-xs italic text-muted-foreground">
                  No folders yet.
                </p>
              )}

              {newFolderMode && (
                <div className="space-y-2 px-1 pt-2">
                  <input
                    autoFocus
                    value={folderName}
                    onChange={(event) => setFolderName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void createFolder();
                      if (event.key === "Escape") setNewFolderMode(false);
                    }}
                    placeholder="Folder name"
                    className="h-9 w-full rounded-lg border border-input bg-white px-3 text-xs outline-none focus:border-rose-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void createFolder()}
                      className="h-8 flex-1 rounded-lg bg-rose-700 px-3 text-xs font-bold text-white"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFolderMode(false)}
                      className="h-8 flex-1 rounded-lg border border-input bg-white px-3 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 p-5 pb-2">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                void uploadFiles(event.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 py-6 text-sm transition ${
                dragOver
                  ? "border-rose-500 bg-rose-50 text-rose-700"
                  : "border-stone-200 bg-white text-muted-foreground hover:border-rose-300 hover:text-rose-600"
              }`}
            >
              {uploading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span>
                <b>{uploading ? "Uploading..." : "Drag and drop files here"}</b>{" "}
                {!uploading && "or click to browse · Max 20 MB"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 px-5 py-3 text-sm">
            <button
              type="button"
              onClick={() => setCurrentFolderId(null)}
              className="font-semibold text-muted-foreground hover:text-rose-700"
            >
              All Files
            </button>
            {currentFolder && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-bold text-foreground">{currentFolder.name}</span>
              </>
            )}
            <button
              type="button"
              onClick={() => setView(view === "list" ? "grid" : "list")}
              className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted"
              title="Toggle view"
            >
              {view === "list" ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <List className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            {loading ? (
              <div className="grid h-full min-h-[300px] place-items-center text-center">
                <div>
                  <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-rose-600" />
                  <p className="mt-3 text-sm text-muted-foreground">Loading files...</p>
                </div>
              </div>
            ) : visibleFiles.length > 0 ? (
              view === "list" ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      <th className="py-3">Name</th>
                      <th className="py-3">Type</th>
                      <th className="py-3">Size</th>
                      <th className="py-3">Uploaded</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFiles.map((file) => (
                      <tr
                        key={file.id}
                        className="border-b border-border/60 last:border-0 hover:bg-stone-50/70"
                      >
                        <td className="py-3">
                          <span className="flex items-center gap-3 text-sm font-medium">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-500">
                              <FileText className="h-4 w-4" />
                            </span>
                            {file.name}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">{fileTypeLabel(file)}</td>
                        <td className="py-3 text-sm text-muted-foreground">{formatFileSize(file.sizeBytes)}</td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => window.open(`${SERVER_URL}${file.previewUrl}`, "_blank", "noopener,noreferrer")}
                              title="Preview"
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => window.open(`${SERVER_URL}${file.downloadUrl}`, "_blank", "noopener,noreferrer")}
                              title="Download"
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeFile(file)}
                              title="Delete"
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {visibleFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="card-shadow rounded-xl border border-border bg-white p-4"
                    >
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-500">
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="mt-3 truncate text-sm font-semibold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fileTypeLabel(file)} · {formatFileSize(file.sizeBytes)}
                      </p>
                      <div className="mt-3 flex gap-1">
                        <button
                          type="button"
                          onClick={() => window.open(`${SERVER_URL}${file.previewUrl}`, "_blank", "noopener,noreferrer")}
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(`${SERVER_URL}${file.downloadUrl}`, "_blank", "noopener,noreferrer")}
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeFile(file)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              <div className="grid h-full min-h-[300px] place-items-center py-14 text-center">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-stone-100 text-stone-400">
                    <FolderOpen className="h-8 w-8" />
                  </div>
                  <p className="font-display mt-4 text-lg font-bold">This folder is empty</p>
                  <p className="mt-1 text-sm text-muted-foreground">Upload a real file from your computer.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-700/25 transition hover:brightness-110"
                  >
                    <Upload className="h-4 w-4" /> Upload Files
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-border bg-stone-50/70 px-5 py-3 text-xs text-muted-foreground">
            <span>{folders.length} folders, {files.length} files</span>
            <span>Max 20 MB per file</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
}