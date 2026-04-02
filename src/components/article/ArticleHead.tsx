"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArticleResponseDto, articleControllerDeleteArticle } from "@rawfli/types";
import { DotsHorizontalIcon, Pencil2Icon, PersonIcon, TrashIcon } from "@radix-ui/react-icons";
import { ApiError } from "@/lib/api";
import { getUserIdFromToken, isLoggedIn } from "@/lib/auth";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "./ArticleHead.module.css";

type ArticleHeadProps = {
  article: ArticleResponseDto;
  boardId: number;
  boardName: string;
  formattedDate: string;
};

export default function ArticleHead({ article, boardId, boardName, formattedDate }: ArticleHeadProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      setLoggedIn(isLoggedIn());
      setCurrentUserId(getUserIdFromToken());
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const canManageArticle = loggedIn && currentUserId === article.author.id;

  const openEditPage = () => {
    setMenuOpen(false);
    router.push(`/boards/write?boardId=${boardId}&articleId=${article.id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      await articleControllerDeleteArticle(boardId, article.id);
      router.replace(`/boards/${boardId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert("게시글 삭제에 실패했습니다.");
      }
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  return (
    <div className={styles.articleHead}>
      {canManageArticle && (
        <div ref={menuRef} className={styles.menuWrap}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="게시글 메뉴"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <DotsHorizontalIcon />
          </button>

          {menuOpen && (
            <div className={styles.menuPopover} role="menu" aria-label="게시글 메뉴">
              <button type="button" className={styles.menuItem} role="menuitem" onClick={openEditPage}>
                <Pencil2Icon /> 수정하기
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${styles.menuDanger}`}
                role="menuitem"
                onClick={handleDelete}
                disabled={deleting}
              >
                <TrashIcon /> {deleting ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.headerTopRow}>
        <Link href={`/boards/${boardId}`} className={styles.boardLabel}>
          {boardName}
        </Link>
      </div>

      <h1 className={styles.title}>{article.title}</h1>

      <div className={styles.metaRow}>
        <Link href={`/users/${article.author.id}`} className={styles.metaStrong}>
          <span className={styles.authorAvatar}>
            {article.author.profileImageKey ? (
              <img
                src={toS3ImageUrl(article.author.profileImageKey)}
                alt={article.author.username}
                className={styles.authorAvatarImg}
              />
            ) : (
              <PersonIcon className={styles.authorAvatarIcon} />
            )}
          </span>
          {article.author.username}
        </Link>
        <span className={styles.metaDivider}>·</span>
        <span>{formattedDate}</span>
        <span className={styles.metaDivider}>·</span>
        <span>조회 {article.views.toLocaleString()}</span>
        <span className={styles.metaDivider}>·</span>
        <span className={styles.likeCount}>추천 {article.likesCount.toLocaleString()}</span>
      </div>
    </div>
  );
}
