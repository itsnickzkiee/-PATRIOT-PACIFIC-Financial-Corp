import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { motion } from "framer-motion";

import {
  LoaderCircle,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
} from "lucide-react";

import Drawer from "./Drawer";
import { useWorkspace } from "../state/workspace";
import { useAuth } from "../state/AuthContext";
import { avatarPalette } from "../data/mock";

const API_URL =
  "http://localhost:5000/api";


type LoanNote = {
  id: number;
  loanId: string;
  userId: number | null;
  author: string;
  initials: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type NotesResponse = {
  notes?: LoanNote[];
  note?: LoanNote;
  message?: string;
};

function formatNoteTime(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function formatMonthHeading(
  value?: string,
): string {
  const date = value
    ? new Date(value)
    : new Date();

  return date.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    },
  );
}

export default function LoanNotesSheet() {
  const { user } = useAuth();

  const {
    activeLoan,
    panel,
    closePanel,
    pushToast,
  } = useWorkspace();

  const open =
    panel === "notes" &&
    Boolean(activeLoan);

  const [notes, setNotes] =
    useState<LoanNote[]>([]);

  const [draft, setDraft] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [posting, setPosting] =
    useState(false);

  const scrollRef =
    useRef<HTMLDivElement>(
      null,
    );

  const filteredNotes =
    useMemo(() => {
      const search =
        query.trim().toLowerCase();

      if (!search) {
        return notes;
      }

      return notes.filter(
        (note) =>
          note.body
            .toLowerCase()
            .includes(search) ||
          note.author
            .toLowerCase()
            .includes(search),
      );
    }, [notes, query]);

  async function loadNotes() {
    if (!activeLoan) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/loan-notes/loan/${encodeURIComponent(
            activeLoan.id,
          )}`,
        );

      const data =
        (await response.json()) as NotesResponse;

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to load notes.",
        );
      }

      setNotes(
        data.notes ?? [],
      );
    } catch (error) {
      console.error(
        "Load notes error:",
        error,
      );

      pushToast(
        error instanceof Error
          ? error.message
          : "Unable to load notes.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft("");
    setQuery("");

    void loadNotes();
  }, [
    open,
    activeLoan?.id,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        scrollRef.current?.scrollTo({
          top:
            scrollRef.current
              .scrollHeight,
          behavior: "smooth",
        });
      }, 120);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    open,
    filteredNotes.length,
  ]);

  if (!activeLoan) {
    return null;
  }

  async function postNote() {
    const body =
      draft.trim();

    if (
      !body ||
      posting
    ) {
      return;
    }

    try {
      setPosting(true);

      const response =
        await fetch(
          `${API_URL}/loan-notes/loan/${encodeURIComponent(
            activeLoan.id,
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              userId: user?.id,
              body,
            }),
          },
        );

      const data =
        (await response.json()) as NotesResponse;

      if (
        !response.ok ||
        !data.note
      ) {
        throw new Error(
          data.message ??
            "Unable to post note.",
        );
      }

      setNotes(
        (current) => [
          ...current,
          data.note!,
        ],
      );

      setDraft("");

      pushToast(
        "Note posted — team notified.",
      );
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Unable to post note.",
      );
    } finally {
      setPosting(false);
    }
  }

  async function deleteNote(
    note: LoanNote,
  ) {
    const confirmed =
      window.confirm(
        "Delete this note?",
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/loan-notes/${note.id}`,
          {
            method: "DELETE",
          },
        );

      const data =
        (await response.json()) as NotesResponse;

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to delete note.",
        );
      }

      setNotes(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              note.id,
          ),
      );

      pushToast(
        "Note deleted.",
      );
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Unable to delete note.",
      );
    }
  }

  return (
    <Drawer
      open={open}
      onClose={closePanel}
      width={1080}
      header={
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-200/60">
            Loan Notes
          </p>

          <h2 className="font-display truncate text-lg font-bold text-white">
            <span className="font-mono text-amber-300">
              #{activeLoan.id}
            </span>

            <span className="mx-2 text-white/30">
              ·
            </span>

            {activeLoan.borrower}
          </h2>
        </div>
      }
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            value={query}
            onChange={(
              event,
            ) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="Search notes..."
            className="h-10 w-full rounded-full border border-input bg-stone-50/60 pl-10 pr-4 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            pushToast(
              "Note options",
            )
          }
          className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-stone-50/40 px-7 py-6"
      >
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />

          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {formatMonthHeading(
              filteredNotes[0]
                ?.createdAt,
            )}
          </p>

          <span className="h-px flex-1 bg-border" />
        </div>

        {loading ? (
          <div className="grid min-h-[300px] place-items-center text-center">
            <div>
              <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-rose-600" />

              <p className="mt-3 text-sm text-muted-foreground">
                Loading notes...
              </p>
            </div>
          </div>
        ) : (
          filteredNotes.map(
            (
              note,
              index,
            ) => (
              <motion.div
                key={note.id}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    index *
                    0.03,
                  duration: 0.25,
                }}
                className="group flex gap-4"
              >
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold ring-2 ring-white ${avatarPalette(
                    note.author,
                  )}`}
                >
                  {note.initials}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-bold">
                      {note.author}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {formatNoteTime(
                        note.createdAt,
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        void deleteNote(
                          note,
                        )
                      }
                      title="Delete note"
                      className="ml-auto hidden h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600 group-hover:grid"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="card-shadow mt-1.5 rounded-2xl rounded-tl-md border border-border bg-white px-4 py-3.5 text-sm leading-relaxed text-foreground/90">
                    {note.body}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDraft(
                        (
                          current,
                        ) =>
                          `@${note.author.split(
                            " ",
                          )[0]} ${current}`,
                      )
                    }
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-rose-700"
                  >
                    <Reply className="h-3 w-3" />

                    Reply
                  </button>
                </div>
              </motion.div>
            ),
          )
        )}

        {!loading &&
          filteredNotes.length ===
            0 && (
            <div className="grid min-h-[320px] place-items-center text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-400">
                  <MessageSquareText className="h-8 w-8" />
                </div>

                <p className="font-display mt-4 text-lg font-bold">
                  No notes yet
                </p>

                <p className="mx-auto mt-1 max-w-72 text-sm text-muted-foreground">
                  Start the conversation.
                  Everyone assigned to
                  this loan gets notified.
                </p>
              </div>
            </div>
          )}
      </div>

      <div className="shrink-0 border-t border-border bg-white px-6 py-4">
        <p className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold ${avatarPalette(
              user?.name ?? "Unknown User",
            )}`}
          >
            {(user?.name ?? "Unknown User")
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) =>
                part.charAt(0).toUpperCase(),
              )
              .join("")}
          </span>

          Posting as

          <span className="font-bold text-foreground">
            {user?.name ?? "Unknown User"}
          </span>
        </p>

        <div className="flex items-end gap-2 rounded-2xl border border-input bg-stone-50/60 p-2 transition focus-within:border-rose-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-500/10">
          <button
            type="button"
            onClick={() =>
              pushToast(
                "Attach files from the Files tab.",
              )
            }
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              setDraft(
                (current) =>
                  `${current} 👍`,
              )
            }
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Smile className="h-4 w-4" />
          </button>

          <textarea
            value={draft}
            onChange={(
              event,
            ) =>
              setDraft(
                event.target.value,
              )
            }
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                  "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                void postNote();
              }
            }}
            rows={1}
            maxLength={5000}
            placeholder="Write a note... Everyone on this loan is notified."
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm outline-none"
          />

          <button
            type="button"
            onClick={() =>
              void postNote()
            }
            disabled={
              !draft.trim() ||
              posting
            }
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-700 to-rose-600 text-white shadow-md shadow-rose-700/25 transition hover:brightness-110 active:scale-90 disabled:from-stone-300 disabled:to-stone-300 disabled:shadow-none"
          >
            {posting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </Drawer>
  );
}