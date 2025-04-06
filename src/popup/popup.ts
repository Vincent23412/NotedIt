import { getStorage, setStorage, groupBy } from "../utils/utils";

type Note = {
  id: string;
  content: string;
  url: string;
  title: string;
  iconUrl: string;
  hostname: string;
  createdAt: number;
  tags?: string[];
  pinned?: boolean;
  highlightedText?: string;
  noteType?: "manual" | "auto";
  completed?: boolean;
};

type NoteMap = {
  [hostname: string]: Note[];
};

document.addEventListener("DOMContentLoaded", () => {
  const noteList = document.getElementById("note-list") as HTMLUListElement;
  const textarea = document.getElementById("note") as HTMLTextAreaElement;
  const saveButton = document.getElementById(
    "save-button"
  ) as HTMLButtonElement;

  showNoteList(noteList);

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

    // 動態決定標題區域內容
    if (sortKey === "url") {
      const urlLink = document.createElement("a");
      urlLink.href = groupKey;
      urlLink.textContent = "🔗 前往網頁";
      urlLink.target = "_blank";
      urlLink.className = "note-url";
      urlLink.style.marginBottom = "6px";
      urlLink.style.display = "inline-block";
      section.appendChild(urlLink);
    } else if (sortKey === "tags") {
      const tagLabel = document.createElement("div");
      tagLabel.textContent = `🏷️ Tag：${groupKey}`;
      tagLabel.style.fontSize = "13px";
      tagLabel.style.marginBottom = "6px";
      tagLabel.style.fontWeight = "bold";
      section.appendChild(tagLabel);
    } else {
      const label = document.createElement("div");
      label.textContent = `📁 ${sortKey}: ${groupKey}`;
      label.style.fontSize = "13px";
      label.style.marginBottom = "6px";
      section.appendChild(label);
    }

    // 顯示群組內所有筆記（只顯示內容與 icon）
    group.forEach((note) => {
      const row = document.createElement("div");
      row.className = "note-content";

      const iconImg = document.createElement("img");
      iconImg.src = note.iconUrl || "icons/default-icon.png";
      iconImg.alt = "icon";
      iconImg.className = "note-icon";

      const contentSpan = document.createElement("span");
      contentSpan.textContent = note.content;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑";
      deleteBtn.className = "note-delete-btn";
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm("確定要刪除這筆筆記嗎？")) {
          await deleteNoteById(note.id);
          await showNoteList(noteList, sortKey); // 保持原本的排序方式
        }
      });

      row.appendChild(iconImg);
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

const createNoteBlock = (note: Note): HTMLLIElement => {
  const li = document.createElement("li");
  li.className = "note-item";

  const iconImg = document.createElement("img");
  iconImg.src = note.iconUrl || "icons/default-icon.png";
  iconImg.alt = "icon";
  iconImg.className = "note-icon";

  const contentSpan = document.createElement("span");
  contentSpan.textContent = note.content;

  const contentRow = document.createElement("div");
  contentRow.className = "note-content";
  contentRow.appendChild(iconImg);
  contentRow.appendChild(contentSpan);

  const urlLink = document.createElement("a");
  urlLink.href = note.url;
  urlLink.textContent = note.url;
  urlLink.target = "_blank";
  urlLink.className = "note-url";

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "🗑";
  deleteBtn.className = "note-delete-btn";
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (confirm("確定要刪除這筆筆記嗎？")) {
      await deleteNoteById(note.id);
      const noteList = document.getElementById("note-list") as HTMLUListElement;
      await showNoteList(noteList);
    }
  });

  li.appendChild(deleteBtn);
  li.appendChild(contentRow);
  li.appendChild(urlLink);
  return li;
};

const deleteNoteById = async (id: string) => {
  const notes: Note[] = (await getStorage("notes")) || [];

  const filtered = notes.filter((note) => note.id !== id);

  await setStorage({ notes: filtered });

  console.log(`已刪除筆記（id=${id}）`);
};
