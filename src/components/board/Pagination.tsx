import Link from "next/link";
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import styles from "./BoardPage.module.css";

type PaginationProps = {
  boardId: number;
  currentPage: number;
  totalPages: number;
};

const PAGE_GROUP_SIZE = 5;

export default function Pagination({ boardId, currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const groupStart = Math.floor((currentPage - 1) / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP_SIZE - 1, totalPages);
  const pages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);

  const makeHref = (page: number) => `/boards/${boardId}?page=${page}`;

  return (
    <div className={styles.pagination}>
      <Link
        href={makeHref(1)}
        className={styles.pageNavButton}
        aria-label="첫 페이지"
        aria-disabled={currentPage === 1}
      >
        <DoubleArrowLeftIcon />
      </Link>
      <Link
        href={makeHref(Math.max(1, currentPage - 1))}
        className={styles.pageNavButton}
        aria-label="이전 페이지"
        aria-disabled={currentPage === 1}
      >
        <ChevronLeftIcon />
      </Link>

      <div className={styles.pageNumbers}>
        {pages.map((page) => (
          <Link
            key={page}
            href={makeHref(page)}
            className={`${styles.pageNumberButton} ${page === currentPage ? styles.pageNumberActive : ""}`}
          >
            {page}
          </Link>
        ))}
      </div>

      <Link
        href={makeHref(Math.min(totalPages, currentPage + 1))}
        className={styles.pageNavButton}
        aria-label="다음 페이지"
        aria-disabled={currentPage === totalPages}
      >
        <ChevronRightIcon />
      </Link>
      <Link
        href={makeHref(totalPages)}
        className={styles.pageNavButton}
        aria-label="마지막 페이지"
        aria-disabled={currentPage === totalPages}
      >
        <DoubleArrowRightIcon />
      </Link>
    </div>
  );
}
