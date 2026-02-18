"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import styles from "./HomePage.module.css";
import { api, ApiError } from "@/lib/api";

type SearchResult = {
  type: "post" | "article";
  id: number;
  boardId: number;
  boardName: string;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
  };
  views: number;
  likesCount: number;
  commentCount: number;
  createdAt: string;
};

type SearchResponse = {
  results: SearchResult[];
  total: number;
};

export default function SearchBar() {
  const containerRef = useRef<HTMLFormElement>(null);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const target = event.target as Node;
      if (!containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = keyword.trim();
    if (!trimmed) {
      setResults([]);
      setMessage("검색어를 입력하세요.");
      setOpen(true);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const data = await api.get<SearchResponse>(
        `/api/v1/boards/search?keyword=${encodeURIComponent(trimmed)}&limit=5`
      );
      setResults(data.results || []);
      setMessage(data.results.length === 0 ? "검색 결과가 없습니다." : null);
      setOpen(true);
    } catch (error) {
      setResults([]);
      setMessage(error instanceof ApiError ? error.message : "검색 중 문제가 발생했습니다.");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const getDetailLink = (result: SearchResult) =>
    result.type === "post"
      ? `/boards/${result.boardId}/posts/${result.id}`
      : `/boards/${result.boardId}/articles/${result.id}`;

  return (
    <form ref={containerRef} className={styles.searchField} onSubmit={handleSearch}>
      <MagnifyingGlassIcon className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        placeholder="검색어를 입력하세요"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        onFocus={() => keyword.trim() && setOpen(true)}
        aria-label="검색어 입력"
      />

      {open && (results.length > 0 || message) && (
        <div className={styles.searchDropdown}>
          {loading && <span className={styles.searchMeta}>검색 중...</span>}
          {message && !loading && <span className={styles.searchMeta}>{message}</span>}
          {!loading &&
            results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={getDetailLink(result)}
                className={styles.searchItem}
                onClick={() => setOpen(false)}
              >
                <span className={styles.searchTitle}>{result.title}</span>
                <span className={styles.searchMeta}>
                  {result.boardName} · {result.author.username} · 조회 {result.views}
                </span>
              </Link>
            ))}
        </div>
      )}
    </form>
  );
}
