# 📝 NotedIt - 即時筆記 Chrome 擴充功能

NotedIt 是一款簡潔實用的 Chrome 擴充功能，讓你在瀏覽任意網頁時快速記下筆記，並自動記錄該網頁的網址、標題與 icon。支援分群、標籤、匯出/匯入等功能，是開發者、學生與資訊工作者的輕量型筆記好幫手。

---

## 🚀 功能特色

- ✏️ **即時筆記輸入**：在 popup 中快速新增筆記
- 🔗 **自動記錄當前網址、網頁圖示（favicon）與標題**
- 🗂️ **分群顯示**：支援依 `url` / `hostname` / `tags` 分組檢視
- 🏷️ **多標籤支援**：自訂 tags 作為筆記分類
- 📤 **匯出群組筆記**：每個群組都可單獨匯出 JSON 檔
- 📥 **匯入筆記備份**：可將匯出的 JSON 還原回系統中
- 🗑 **刪除單筆 / 所有筆記**：清除不再需要的資料

---

## 📦 安裝方法（開發者模式）

1. 下載專案或 `git clone`：
   ```bash
   git clone https://github.com/Vincent23412/NotedIt.git
   cd NotedIt
```
2. 安裝依賴並打包（需安裝 Node.js）：
```
yarn install
yarn build
```
3. 開啟 Chrome → chrome://extensions/

開啟右上角的「開發者模式」
點「載入未封裝項目」，選擇 dist 資料夾

📁 專案結構簡介
```
NotedIt/
├── src/                  # TypeScript 程式碼
│   └── popup/            # popup 畫面邏輯
│   └── utils/            # 工具函式（儲存、分群、時間格式等）
├── public/               # HTML / 圖示等靜態資源
├── dist/                 # Webpack 輸出結果（安裝用）
├── manifest.json         # Chrome 擴充設定
├── webpack.config.js     # 編譯設定
```


📄 匯出 / 匯入 JSON 格式
```
{
  "sortedKey": "chat.openai.com",
  "content": [
    {
      "id": "note-uuid",
      "content": "這是一段筆記內容",
      "url": "https://chat.openai.com",
      "hostname": "chat.openai.com",
      "iconUrl": "...",
      "title": "ChatGPT",
      "tags": ["AI", "筆記"],
      "createdAt": 1711780000000
    }
  ]
}
```

🙌 貢獻者
由 Vincent23412 開發與維護。
歡迎提出 PR 或 Issue，一起打造實用的筆記工具！

運行畫面

![image](https://github.com/user-attachments/assets/fd066f6b-6e33-4aed-9f06-54283a2014cf)
