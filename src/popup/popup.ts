import { getStorage, setStorage } from "../utils/utils";

type Note = {
  content: string;
  url: string;
};

document.addEventListener("DOMContentLoaded", () => {
  const noteList = document.getElementById("note-list") as HTMLUListElement;
  const textarea = document.getElementById("note") as HTMLTextAreaElement;
  const saveButton = document.getElementById(
    "save-button"
  ) as HTMLButtonElement;

  showNoteList(noteList, textarea);

  saveButton.addEventListener("click", createNoteSaver(noteList, textarea));
});

const showNoteList = async (
  noteList: HTMLUListElement,
  textarea: HTMLTextAreaElement
) => {
  const notes: Note[] = (await getStorage("notes")) || [];

  noteList.innerHTML = "";

  notes.forEach((note) => {
    addNoteBlock(note, noteList);
  });
};

const createNoteSaver = (
  noteList: HTMLUListElement,
  textarea: HTMLTextAreaElement
) => {
  return async () => {
    const content = textarea.value;
    if (!content) return;

    const [notesData, tabs] = await Promise.all([
      getStorage<Note[]>("notes"),
      chrome.tabs.query({ active: true, currentWindow: true }),
    ]);

    const notes = notesData || [];
    const url = tabs[0]?.url || "unknown";

    const note = {
      content,
      url,
    };

    notes.push({ ...note });

    await setStorage({ notes });

    textarea.value = "";

    addNoteBlock(note, noteList);
  };
};

const addNoteBlock = (note: Note, noteList: HTMLUListElement) => {
  const li = document.createElement("li");
  // 建立內容區
  const contentSpan = document.createElement("div");
  contentSpan.textContent = `📝 ${note.content}`;

  // 建立超連結區
  const urlLink = document.createElement("a");
  urlLink.href = note.url;
  urlLink.textContent = `🔗 ${note.url}`;
  urlLink.target = "_blank"; // 新分頁打開

  // 加上點擊後回填 textarea 的功能
  li.appendChild(contentSpan);
  li.appendChild(urlLink);

  noteList.appendChild(li);
};
