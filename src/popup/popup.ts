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
import {
  startCountdownFromStorage,
  pauseTime,
  startTimer,
  removeTimer,
} from "../utils/timerUtils";
import { time } from "console";

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
  const addTimerBtn = document.getElementById(
    "add-timer-btn"
  ) as HTMLInputElement;
  const newSubject = document.getElementById(
    "new-timer-name"
  ) as HTMLInputElement;

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

  addTimerBtn.addEventListener("click", async () => {
    await startTimer(newSubject.value, Date.now());
    newSubject.value = "";
    await showTimer(); 
  });

  document
    .getElementById("switch-to-timer")
    ?.addEventListener("click", async () => {
      document.getElementById("note-tab")!.style.display = "none";
      document.getElementById("timer-tab")!.style.display = "block";
      document.getElementById("switch-to-timer")!.style.display = "none";
      document.getElementById("switch-to-note")!.style.display = "block";

      const timers: Timer[] = await getStorage("timers");

      // const timerMap = new Map<string, Map<String, any>>();
      console.log(timers, "timers");
      if (timers && timers.length > 0) {
        showTimer();
      }

      document
        .getElementById("switch-to-note")
        ?.addEventListener("click", () => {
          document.getElementById("note-tab")!.style.display = "block";
          document.getElementById("timer-tab")!.style.display = "none";
          document.getElementById("switch-to-timer")!.style.display = "block";
          document.getElementById("switch-to-note")!.style.display = "none";
        });
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

async function showTimer() {
  const timers: Timer[] = (await getStorage("timers")) || [];
  const timerList = document.getElementById("timer-list")!;
  timerList.innerHTML = "";
  timers.forEach(async (t: Timer) => {
    const li = document.createElement("li");
    li.className = "timer-item";

    const name = document.createElement("div");
    name.className = "timer-name";
    name.textContent = t.item;

    const time = document.createElement("div");
    time.className = "timer-time";
    const minutes = Math.floor(t.time / 60);
    const seconds = t.time % 60;
    time.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const controls = document.createElement("div");
    controls.className = "timer-controls";

    const startBtn = document.createElement("button");
    startBtn.className = "start-btn";
    startBtn.textContent = "▶️";

    const pauseBtn = document.createElement("button");
    pauseBtn.className = "pause-btn";
    pauseBtn.textContent = "⏸";

    const resetBtn = document.createElement("button");
    resetBtn.className = "reset-btn";
    resetBtn.textContent = "🔄";

    controls.appendChild(startBtn);
    controls.appendChild(pauseBtn);
    controls.appendChild(resetBtn);

    li.appendChild(name);
    li.appendChild(time);
    li.appendChild(controls);

    const itemMap = new Map<string, any>();

    for (const key in t) {
      if (Object.prototype.hasOwnProperty.call(t, key)) {
        itemMap.set(key as keyof Timer, t[key as keyof Timer]);
      }
    }
    itemMap.set("timerDisplay", time);
    // timerMap.set(t.item, itemMap);

    startBtn.addEventListener("click", () => {
      startCountdownFromStorage(itemMap);
    });
    pauseBtn.addEventListener("click", pauseTime(itemMap));
    resetBtn.addEventListener("click", removeTimer(itemMap));

    timerList.appendChild(li);

    // 若有正在執行的 timer，可額外顯示主視覺 timer（可選）
    if (t.isStop === false) {
      await startCountdownFromStorage(itemMap);
    }
  });
}
