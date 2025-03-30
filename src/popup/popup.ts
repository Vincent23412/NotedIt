// popup.ts
document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("note") as HTMLTextAreaElement;
  console.log(textarea);
  chrome.storage.local.get(["note"], (result) => {
    textarea.value = result.note || "";
  });
  textarea.addEventListener("input", () => {
    chrome.storage.local.set({ note: textarea.value });
  });
});
