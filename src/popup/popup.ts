import {
  getStorage,
  setStorage,
  groupBy,
  deleteNoteById,
  deleteAllNote,
  exportGroupNotes,
} from "../utils/utils";
import { Note, NoteMap } from "../types/note";

document.addEventListener("DOMContentLoaded", () => {
  const noteList = document.getElementById("note-list") as HTMLUListElement;
  const textarea = document.getElementById("note") as HTMLTextAreaElement;
  const saveButton = document.getElementById(
    "save-button"
  ) as HTMLButtonElement;
  const sortSelect = document.getElementById(
    "sort-select"
  ) as HTMLSelectElement;
  const clearButton = document.getElementById(
    "clear-button"
  ) as HTMLButtonElement;

  clearButton.addEventListener("click", deleteAllNote);

  showNoteList(noteList, sortSelect.value as keyof Note);
  sortSelect.addEventListener("change", () => {
    showNoteList(noteList, sortSelect.value as keyof Note);
  });

  saveButton.addEventListener("click", createNoteSaver(noteList, textarea));
});

const showNoteList = async (
  noteList: HTMLUListElement,
  sortKey: keyof Note = "tags"
) => {
  const notes: Note[] = (await getStorage("notes")) || [];
  noteList.innerHTML = "";

  const groupedNotes = groupBy<Note>(notes, (note) => {
    const raw = note[sortKey];
    return Array.isArray(raw)
      ? raw.join(",") || "未分類"
      : String(raw ?? "未分類");
  });

  for (const [groupKey, group] of Object.entries(groupedNotes)) {
    const section = document.createElement("li");
    section.className = "note-item";

    // ==== 群組標題區塊 ====
    const groupHeader = document.createElement("div");
    groupHeader.className = "group-header";

    const titleSpan = document.createElement("span");

    if (sortKey === "url") {
      titleSpan.innerHTML = `<a href="${groupKey}" target="_blank" class="note-url">🔗 前往網頁</a>`;
    } else if (sortKey === "tags") {
      titleSpan.textContent = `🏷️ Tag：${groupKey}`;
    } else {
      titleSpan.textContent = `📁 ${sortKey}: ${groupKey}`;
    }

    const exportGroupBtn = document.createElement("button");
    exportGroupBtn.textContent = "📤 匯出";
    exportGroupBtn.className = "export-group-btn";
    exportGroupBtn.addEventListener("click", () => {
      exportGroupNotes(groupKey, group);
    });

    groupHeader.appendChild(titleSpan);
    groupHeader.appendChild(exportGroupBtn);
    section.appendChild(groupHeader);

    // ==== 每筆筆記內容列 ====
    group.forEach((note) => {
      const row = document.createElement("div");
      row.className = "note-content";
      const iconLink = document.createElement("a");
      iconLink.href = note.url;
      iconLink.target = "_blank";
      iconLink.rel = "noopener noreferrer";

      const iconImg = document.createElement("img");
      iconImg.src = note.iconUrl || "icons/default-icon.png";
      iconImg.alt = "icon";
      iconImg.className = "note-icon";

      iconLink.appendChild(iconImg);

      const contentSpan = document.createElement("span");
      contentSpan.textContent = note.content;
      contentSpan.className = "note-text";

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑";
      deleteBtn.className = "note-delete-btn";
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm("確定要刪除這筆筆記嗎？")) {
          await deleteNoteById(note.id);
          await showNoteList(noteList, sortKey); // 保留排序方式
        }
      });

      row.appendChild(iconLink);
      row.appendChild(contentSpan);
      row.appendChild(deleteBtn);

      section.appendChild(row);
    });

    noteList.appendChild(section);
  }
};

const createNoteSaver = (
  noteList: HTMLUListElement,
  textarea: HTMLTextAreaElement
) => {
  return async () => {
    const content = textarea.value;
    if (!content) return;

    const tagInput = document.getElementById("tag-input") as HTMLInputElement;
    const rawTags = tagInput.value;
    const tags = rawTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const [notesData, tabs] = await Promise.all([
      getStorage("notes"),
      chrome.tabs.query({ active: true, currentWindow: true }),
    ]);
    const url = tabs[0]?.url || "unknown";
    const iconUrl = tabs[0]?.favIconUrl || "";
    const title = tabs[0]?.title || "unknown";
    const hostname = url !== "unknown" ? new URL(url).hostname : "unknown";
    const notes: Note[] = notesData || [];
    const id = `${url}-${content}`;
    const note: Note = {
      id,
      title,
      content,
      url,
      iconUrl,
      hostname,
      createdAt: Date.now(),
      tags,
    };

    notes.push(note);

    notes.sort((a, b) => a.hostname.charCodeAt(0) - b.hostname.charCodeAt(0));

    await setStorage({ notes });

    textarea.value = "";

    showNoteList(noteList);
  };
};
