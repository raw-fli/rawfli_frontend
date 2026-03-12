export function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\([^)]*\)/g, "") // 이미지 ![](url)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크 [text](url) → text
    .replace(/```[\s\S]*?```/g, "") // 코드블록 ```...```
    .replace(/`[^`]*`/g, "") // 인라인 코드 `...`
    .replace(/^#{1,6}\s+/gm, "") // 헤딩 #
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1") // bold/italic
    .replace(/^[-*+]\s+/gm, "") // 리스트
    .replace(/^\d+\.\s+/gm, "") // 번호 리스트
    .replace(/^>\s+/gm, "") // blockquote
    .replace(/~~([^~]+)~~/g, "$1") // strikethrough
    .replace(/\n{2,}/g, " ") // 줄바꿈
    .trim();
}
