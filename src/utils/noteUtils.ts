import { Note } from "../types/note.types";
import { group } from "console";
function getStorage<T = any>(key: string): Promise<T> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

function setStorage(obj: object): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
}

function groupBy<T>(
  items: T[],
  keyGetter: (item: T) => any
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const item of items) {
    const rawKey = keyGetter(item);
    const key = String(rawKey ?? "未分類");
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  }
  return grouped;
}

const deleteNoteById = async (id: string) => {
  const notes: Note[] = (await getStorage("notes")) || [];

  const filtered = notes.filter((note) => note.id !== id);

  await setStorage({ notes: filtered });

  console.log(`已刪除筆記（id=${id}）`);
};

const deleteAllNote = async () => {
  const confirmed = confirm("確定要刪除所有筆記嗎？此操作無法復原！");
  if (!confirmed) return;

  await chrome.storage.local.remove("notes");
  const noteList = document.getElementById("note-list") as HTMLUListElement;
  noteList.innerHTML = "";
  console.log("已清除所有筆記");
};

const exportGroupNotes = (groupKey: string, notes: Note[]) => {
  const contents: string[] = notes
    .filter((note) => note.content && note.content.trim() !== "")
    .map((note) => note.content);

  console.log("匯出群組：", groupKey);

  const outputFile = {
    sortedKey: groupKey,
    content: contents,
  };

  const blob = new Blob([JSON.stringify(outputFile, null, 2)], {
    type: "application/json",
  });

  const safeFileName = groupKey.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `notes_export_${safeFileName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export {
  getStorage,
  setStorage,
  groupBy,
  deleteNoteById,
  deleteAllNote,
  exportGroupNotes,
};
