import { getStorage, setStorage, groupBy } from "../utils/utils";

type Note = {
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

const showNoteList = async (noteList: HTMLUListElement, key: keyof Note = "hostname") => {
  const notes: Note[] = (await getStorage("notes")) || [];

  noteList.innerHTML = "";

  // 預設用 hostname 分組
  const groupedNotes = groupBy<Note>(notes, (note) =>  note[key]);

  console.log("分組後的筆記：", groupedNotes);

  for (const [hostname, noteGroup] of Object.entries(groupedNotes)) {
    // 建立分組容器
    const groupSection = document.createElement("div");
    groupSection.style.marginBottom = "16px";

    // 加上群組標題
    const groupHeader = document.createElement("h4");
    groupHeader.textContent = `🌐 ${hostname}`;
    groupHeader.style.marginBottom = "6px";
    groupHeader.style.borderBottom = "1px solid #ccc";
    groupHeader.style.paddingBottom = "4px";
    groupSection.appendChild(groupHeader);

    // 加入該群的每一筆筆記
    noteGroup.forEach((note) => {
      const li = createNoteBlock(note); // 回傳 li 元素
      groupSection.appendChild(li);
    });

    // 把群組加進主清單
    noteList.appendChild(groupSection);
  }
};

const createNoteSaver = (
  noteList: HTMLUListElement,
  textarea: HTMLTextAreaElement
) => {
  return async () => {
    const content = textarea.value;
    if (!content) return;

    const [notesData, tabs] = await Promise.all([
      getStorage("notes"),
      chrome.tabs.query({ active: true, currentWindow: true }),
    ]);

    const url = tabs[0]?.url || "unknown";
    const iconUrl = tabs[0]?.favIconUrl || "";
    const title = tabs[0]?.title || "unknown";
    const hostname = url !== "unknown" ? new URL(url).hostname : "unknown";
    const notes: Note[] = notesData || [];

    const note: Note = {
      title,
      content,
      url,
      iconUrl,
      hostname,
      createdAt: Date.now(),
    };

    notes.push(note);

    await setStorage({ notes });

    textarea.value = "";

    showNoteList(noteList);
  };
};

const createNoteBlock = (note: Note): HTMLLIElement => {
  const li = document.createElement("li");
  li.style.display = "flex";
  li.style.flexDirection = "column";
  li.style.marginBottom = "10px";
  li.style.padding = "6px";
  li.style.borderBottom = "1px solid #ddd";

  // icon
  const iconImg = document.createElement("img");
  iconImg.src = note.iconUrl || "icons/default-icon.png";
  iconImg.alt = "icon";
  iconImg.width = 16;
  iconImg.height = 16;
  iconImg.style.marginRight = "4px";

  // 內容區
  const contentRow = document.createElement("div");
  contentRow.style.display = "flex";
  contentRow.style.alignItems = "center";
  contentRow.style.gap = "4px";

  const contentSpan = document.createElement("span");
  contentSpan.textContent = note.content;

  contentRow.appendChild(iconImg);
  contentRow.appendChild(contentSpan);

  // 連結區
  const urlLink = document.createElement("a");
  urlLink.href = note.url;
  urlLink.textContent = `🔗 ${note.url}`;
  urlLink.target = "_blank";
  urlLink.style.fontSize = "0.85em";
  urlLink.style.color = "#0066cc";
  urlLink.style.textDecoration = "underline";
  urlLink.style.wordBreak = "break-all";

  li.appendChild(contentRow);
  li.appendChild(urlLink);

  return li;
};

const deleteNote = () => {
  chrome.storage.local.remove("notes", () => {
    console.log("筆記已刪除！");
  });
};
