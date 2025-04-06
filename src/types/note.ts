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
export { Note , NoteMap};
