import {
  getStorage,
  setStorage,
  groupBy,
  deleteNoteById,
  deleteAllNote,
  exportGroupNotes,
} from "../utils/noteUtils";
import { Note, NoteMap } from "../types/note.types";
import { Timer } from "../types/timer.types";
import { startCountdownFromStorage } from "../utils/timerUtils";

document.addEventListener("DOMContentLoaded", async () => {
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
  const importButton = document.getElementById(
    "import-button"
  ) as HTMLButtonElement;
  const importFileInput = document.getElementById(
    "import-file"
  ) as HTMLInputElement;
  const timerStartBtn = document.getElementById(
    "startBtn"
  ) as HTMLButtonElement;
  const timerPauseBtn = document.getElementById(
    "pauseBtn"
  ) as HTMLButtonElement;
  const timerResetBtn = document.getElementById(
    "resetBtn"
  ) as HTMLButtonElement;
  const timer = document.getElementById("timer") as HTMLDivElement;

  clearButton.addEventListener("click", deleteAllNote);

  showNoteList(noteList, sortSelect.value as keyof Note);
  sortSelect.addEventListener("change", () => {
    showNoteList(noteList, sortSelect.value as keyof Note);
  });

  importButton.addEventListener("click", () => {
    importFileInput.click(); // 觸發隱藏的 input
  });

  importFileInput.addEventListener("change", importFile);

  saveButton.addEventListener("click", createNoteSaver(noteList, textarea));

  const DURATION = 30 * 60; // 1800秒
  let countInterval: number | null = null;

  // ▶️ 切換到 Timer 區塊
  document
    .getElementById("switch-to-timer")
    ?.addEventListener("click", async () => {
      document.getElementById("note-tab")!.style.display = "none";
      document.getElementById("timer-tab")!.style.display = "block";
      document.getElementById("switch-to-timer")!.style.display = "none";
      document.getElementById("switch-to-note")!.style.display = "block";

      await startCountdownFromStorage(countInterval, DURATION, timer);
    });

  // 🔙 切換回筆記區塊
  document.getElementById("switch-to-note")?.addEventListener("click", () => {
    document.getElementById("note-tab")!.style.display = "block";
    document.getElementById("timer-tab")!.style.display = "none";
    document.getElementById("switch-to-timer")!.style.display = "block";
    document.getElementById("switch-to-note")!.style.display = "none";
  });

  // ▶️ Timer Start 按鈕
  timerStartBtn.addEventListener("click", async () => {
    await startCountdownFromStorage(countInterval, DURATION, timer);
  });

  // ⏸ Timer Pause 按鈕
  timerPauseBtn.addEventListener("click", () => {
    if (countInterval !== null) {
      clearInterval(countInterval);
      countInterval = null;
    }
  });
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

    console.log("notes data", notes);

    await setStorage({ notes });

    textarea.value = "";

    showNoteList(noteList);
  };
};

const importFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    const importedNotes: Note[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.content)
        ? parsed.content
        : [];

    if (!importedNotes.length) {
      alert("⚠️ 匯入格式錯誤或沒有任何筆記！");
      return;
    }

    const existingNotes: Note[] = (await getStorage("notes")) || [];

    const newNotes = importedNotes.map((note) => ({
      ...note,
      id: crypto.randomUUID(),
    }));

    const merged = [...existingNotes, ...newNotes];
    await setStorage({ notes: merged });

    alert(`✅ 已匯入 ${newNotes.length} 筆筆記！`);
    const noteList = document.getElementById("note-list") as HTMLUListElement;
    const sortSelect = document.getElementById(
      "sort-select"
    ) as HTMLSelectElement;
    showNoteList(noteList, sortSelect.value as keyof Note);
  } catch (err) {
    alert("❌ 匯入失敗，檔案格式可能錯誤！");
    console.error(err);
  } finally {
    (event.target as HTMLInputElement).value = "";
  }
};
