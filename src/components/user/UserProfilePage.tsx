"use client";

import { useState } from "react";
import {
  FileTextIcon,
  ImageIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import type { UserInfoResponseDto, ArticleListItemResponseDto } from "@rawfli/types";
import { toS3ImageUrl } from "@/shared/utils/image";
import { formatRelativeTime } from "@/shared/utils/time";
import styles from "./UserProfilePage.module.css";

type Tab = "articles" | "posts";

interface UserProfilePageProps {
  user: UserInfoResponseDto;
}

export default function UserProfilePage({ user }: UserProfilePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const profileImageUrl = toS3ImageUrl(user.profileImageKey ?? undefined);
  console.log(user);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarBorder}>
              <div className={styles.avatarInner}>
                {profileImageUrl ? (
                  <img
                    className={styles.avatarImage}
                    src={profileImageUrl}
                    alt={`${user.username} 프로필`}
                  />
                ) : (
                  <PersonIcon className={styles.avatarFallback} />
                )}
              </div>
            </div>
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.username}>{user.username}</h1>
              <div className={styles.actions}>
                <button type="button" className={styles.followButton}>
                  팔로우
                </button>
                <button type="button" className={styles.messageButton}>
                  메시지
                </button>
              </div>
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{user.articles.length}</span>
                <span className={styles.statLabel}>게시물</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {formatCount(user.followerCount)}
                </span>
                <span className={styles.statLabel}>팔로워</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {formatCount(user.followingCount)}
                </span>
                <span className={styles.statLabel}>팔로잉</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          <div className={styles.tabList}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "articles" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("articles")}
            >
              <FileTextIcon className={styles.tabIcon} />
              내 게시글
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "posts" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              <ImageIcon className={styles.tabIcon} />
              내 포스트
            </button>
          </div>
        </div>

        {activeTab === "articles" && <ArticlesTab articles={user.articles} username={user.username} />}
        {activeTab === "posts" && <PostsTab />}
      </main>
    </div>
  );
}

function ArticlesTab({ articles, username }: { articles: ArticleListItemResponseDto[]; username: string }) {
  if (articles.length === 0) {
    return (
      <div className={styles.empty}>
        <FileTextIcon className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>게시글이 없습니다</p>
        <p className={styles.emptyDesc}>아직 작성한 게시글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.postGrid}>
      {articles.map((article) => (
        <div key={article.id} className={styles.postCard}>
          <h3 className={styles.postTitle}>{article.title}</h3>
          <p className={styles.postContent}>{article.content}</p>
          <div className={styles.postMeta}>
            <span>{username}</span>
            <span>{formatRelativeTime(article.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PostsTab() {
  return (
    <div className={styles.empty}>
      <ImageIcon className={styles.emptyIcon} />
      <p className={styles.emptyTitle}>준비 중입니다</p>
      <p className={styles.emptyDesc}>포스트 목록 기능이 곧 추가됩니다.</p>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}
