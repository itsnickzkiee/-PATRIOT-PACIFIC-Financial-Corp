import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import multer from "multer";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import pool from "../config/database.js";

const router = Router();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(currentDir, "../../uploads/loan-files");
fs.mkdirSync(uploadsRoot, { recursive: true });

interface FolderRow extends RowDataPacket {
  id: number;
  name: string;
  created_at: Date | string;
}

interface FileRow extends RowDataPacket {
  id: number;
  loan_id: string;
  folder_id: number | null;
  folder_name: string | null;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  relative_path: string;
  uploaded_at: Date | string;
}

interface LoanRow extends RowDataPacket {
  id: string;
}

const safeName = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");

function mapFile(row: FileRow) {
  return {
    id: row.id,
    loanId: String(row.loan_id),
    folderId: row.folder_id,
    folderName: row.folder_name,
    name: row.original_name,
    type: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    uploadedAt: new Date(row.uploaded_at).toISOString(),
    previewUrl: `/api/loan-files/${row.id}/preview`,
    downloadUrl: `/api/loan-files/${row.id}/download`,
  };
}

async function loanExists(loanId: string) {
  const [rows] = await pool.query<LoanRow[]>(
    "SELECT id FROM loans WHERE id = ? LIMIT 1",
    [loanId],
  );
  return rows.length > 0;
}

const storage = multer.diskStorage({
  destination(req, _file, callback) {
    const loanId = String(
      req.params.loanId ?? "unknown",
    );

    const directory = path.join(
      uploadsRoot,
      safeName(loanId),
    );

    fs.mkdirSync(directory, {
      recursive: true,
    });

    callback(null, directory);
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname);
    const base = path.basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80);
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1_000_000)}-${base}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter(_req, file, callback) {
    const allowed = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
    ]);
    if (allowed.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(
      new Error(
        "Unsupported file type.",
      ),
    );
  },
});

router.get("/loan/:loanId", async (req, res) => {
  try {
    const loanId = String(
      req.params.loanId ?? "",
    ).trim();
    if (!(await loanExists(loanId))) {
      res.status(404).json({ message: "Loan not found." });
      return;
    }

    const [folders] = await pool.query<FolderRow[]>(
      "SELECT id, name, created_at FROM loan_folders WHERE loan_id = ? ORDER BY name ASC",
      [loanId],
    );

    const [files] = await pool.query<FileRow[]>(
      `SELECT f.id, f.loan_id, f.folder_id, d.name AS folder_name,
              f.original_name, f.mime_type, f.size_bytes,
              f.relative_path, f.uploaded_at
       FROM loan_files f
       LEFT JOIN loan_folders d ON d.id = f.folder_id
       WHERE f.loan_id = ?
       ORDER BY f.uploaded_at DESC`,
      [loanId],
    );

    res.json({
      folders: folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        createdAt: new Date(folder.created_at).toISOString(),
      })),
      files: files.map(mapFile),
    });
  } catch (error) {
    console.error("Get loan files error:", error);
    res.status(500).json({ message: "Unable to retrieve loan files." });
  }
});

router.post("/loan/:loanId/folders", async (req, res) => {
  try {
    const loanId = String(
      req.params.loanId ?? "",
    ).trim();
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      res.status(400).json({ message: "Folder name is required." });
      return;
    }

    if (!(await loanExists(loanId))) {
      res.status(404).json({ message: "Loan not found." });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO loan_folders (loan_id, name) VALUES (?, ?)",
      [loanId, name],
    );

    res.status(201).json({
      folder: { id: result.insertId, name, createdAt: new Date().toISOString() },
    });
  } catch (error) {
    const dbError = error as { code?: string };
    if (dbError.code === "ER_DUP_ENTRY") {
      res.status(409).json({ message: "This folder already exists." });
      return;
    }
    console.error("Create folder error:", error);
    res.status(500).json({ message: "Unable to create folder." });
  }
});

router.post("/loan/:loanId/upload", upload.array("files", 10), async (req, res) => {
  const uploaded = Array.isArray(
    req.files,
  )
    ? req.files
    : [];

  try {
    const loanId = String(
      req.params.loanId ?? "",
    ).trim();
    if (!(await loanExists(loanId))) {
      uploaded.forEach((file) => fs.rmSync(file.path, { force: true }));
      res.status(404).json({ message: "Loan not found." });
      return;
    }

    if (uploaded.length === 0) {
      res.status(400).json({ message: "Select at least one file." });
      return;
    }

    const rawFolderId = typeof req.body.folderId === "string" ? req.body.folderId.trim() : "";
    const folderId = rawFolderId ? Number(rawFolderId) : null;

    if (folderId !== null) {
      const [rows] = await pool.query<FolderRow[]>(
        "SELECT id, name, created_at FROM loan_folders WHERE id = ? AND loan_id = ? LIMIT 1",
        [folderId, loanId],
      );
      if (rows.length === 0) {
        res.status(404).json({ message: "Folder not found." });
        return;
      }
    }

    const ids: number[] = [];
    for (const file of uploaded) {
      const relativePath = path.relative(uploadsRoot, file.path);
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO loan_files
          (loan_id, folder_id, original_name, stored_name, mime_type, size_bytes, relative_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [loanId, folderId, file.originalname, file.filename, file.mimetype, file.size, relativePath],
      );
      ids.push(result.insertId);
    }

    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await pool.query<FileRow[]>(
      `SELECT f.id, f.loan_id, f.folder_id, d.name AS folder_name,
              f.original_name, f.mime_type, f.size_bytes,
              f.relative_path, f.uploaded_at
       FROM loan_files f
       LEFT JOIN loan_folders d ON d.id = f.folder_id
       WHERE f.id IN (${placeholders})`,
      ids,
    );

    res.status(201).json({ files: rows.map(mapFile) });
  } catch (error) {
    uploaded.forEach((file) => fs.rmSync(file.path, { force: true }));
    console.error("Upload error:", error);
    res.status(500).json({ message: "Unable to upload files." });
  }
});

async function getFile(fileId: number) {
  const [rows] = await pool.query<FileRow[]>(
    `SELECT f.id, f.loan_id, f.folder_id, d.name AS folder_name,
            f.original_name, f.mime_type, f.size_bytes,
            f.relative_path, f.uploaded_at
     FROM loan_files f
     LEFT JOIN loan_folders d ON d.id = f.folder_id
     WHERE f.id = ? LIMIT 1`,
    [fileId],
  );
  return rows[0];
}

router.get("/:fileId/preview", async (req, res) => {
  try {
    const file = await getFile(
      Number(
        String(
          req.params.fileId ?? "",
        ),
      ),
    );
    if (!file) {
      res.status(404).json({ message: "File not found." });
      return;
    }
    const absolutePath = path.resolve(uploadsRoot, file.relative_path);
    if (!absolutePath.startsWith(uploadsRoot) || !fs.existsSync(absolutePath)) {
      res.status(404).json({ message: "Stored file is missing." });
      return;
    }
    res.type(file.mime_type);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).json({ message: "Unable to preview file." });
  }
});

router.get("/:fileId/download", async (req, res) => {
  try {
    const file = await getFile(
      Number(
        String(
          req.params.fileId ?? "",
        ),
      ),
    );
    if (!file) {
      res.status(404).json({ message: "File not found." });
      return;
    }
    const absolutePath = path.resolve(uploadsRoot, file.relative_path);
    if (!absolutePath.startsWith(uploadsRoot) || !fs.existsSync(absolutePath)) {
      res.status(404).json({ message: "Stored file is missing." });
      return;
    }
    res.download(absolutePath, file.original_name);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Unable to download file." });
  }
});

router.delete("/:fileId", async (req, res) => {
  try {
    const fileId = Number(
      String(
        req.params.fileId ?? "",
      ),
    );
    const file = await getFile(fileId);
    if (!file) {
      res.status(404).json({ message: "File not found." });
      return;
    }

    await pool.execute("DELETE FROM loan_files WHERE id = ?", [fileId]);
    const absolutePath = path.resolve(uploadsRoot, file.relative_path);
    if (absolutePath.startsWith(uploadsRoot)) {
      fs.rmSync(absolutePath, { force: true });
    }

    res.json({ message: "File deleted successfully." });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Unable to delete file." });
  }
});

router.use((
  error: unknown,
  _req: unknown,
  res: {
    status: (code: number) => {
      json: (body: {
        message: string;
      }) => void;
    };
  },
  _next: unknown,
) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      message: error.code === "LIMIT_FILE_SIZE" ? "A file exceeds the 20 MB limit." : error.message,
    });
    return;
  }
  res.status(400).json({ message: error instanceof Error ? error.message : "Upload failed." });
});

export default router;