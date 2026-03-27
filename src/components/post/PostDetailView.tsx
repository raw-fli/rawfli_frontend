"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useMemo, useState } from "react";
import { CameraIcon, ClockIcon, MagnifyingGlassIcon, PersonIcon } from "@radix-ui/react-icons";
import {
  CommentResponseDto,
  PhotoResponseDto,
  PostResponseDto,
  postsControllerCreatePhotoComment,
} from "@rawfli/types";
import { getApiErrorMessage } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { toS3ImageUrl } from "@/shared/utils/image";
import { formatRelativeTime } from "@/shared/utils/time";
import styles from "./PostDetailView.module.css";

type PostDetailViewProps = {
  post: PostResponseDto;
  initialPhotoId?: string;
};

type CommentMode = "photo" | "post";

type CommentItemProps = {
  comment: CommentResponseDto;
  depth?: number;
  parentAuthor?: string;
};

function pickInitialPhotoId(
  photos: PhotoResponseDto[],
  coverPhotoId?: string | null,
  initialPhotoId?: string,
) {
  if (initialPhotoId && photos.some((photo) => photo.id === initialPhotoId)) {
    return initialPhotoId;
  }
  if (coverPhotoId && photos.some((photo) => photo.id === coverPhotoId)) {
    return coverPhotoId;
  }
  return photos[0]?.id ?? "";
}

function countAllComments(comments: CommentResponseDto[]): number {
  return comments.reduce(
    (sum, comment) => sum + 1 + countAllComments(comment.replies ?? []),
    0,
  );
}

function getGearLabel(gear?: { brand: string | null; modelName: string } | null): string {
  if (!gear) return "정보 없음";
  const brand = gear.brand?.trim();
  return brand ? `${brand} ${gear.modelName}` : gear.modelName;
}

function extractHashtags(text?: string): string[] {
  if (!text) return [];
  const tags = text.match(/#[^\s#]+/g) ?? [];
  return Array.from(new Set(tags)).slice(0, 4);
}

function CommentItem({ comment, depth = 0, parentAuthor }: CommentItemProps) {
  const replies = comment.replies ?? [];

  return (
    <>
      <article
        className={`${styles.commentItem} ${depth > 0 ? styles.replyItem : ""}`}
        style={depth > 0 ? { marginLeft: `${Math.min(depth, 3) * 22}px` } : undefined}
      >
        <div className={styles.commentMetaRow}>
          <Link href={`/users/${comment.author.id}`} className={styles.commentAuthor}>
            <span className={styles.commentAvatar}>
              {comment.author.profileImageKey ? (
                <img
                  src={toS3ImageUrl(comment.author.profileImageKey)}
                  alt={comment.author.username}
                  className={styles.commentAvatarImg}
                />
              ) : (
                <PersonIcon className={styles.commentAvatarIcon} />
              )}
            </span>
            <span>{comment.author.username}</span>
            {parentAuthor && <span className={styles.replyTo}>→ @{parentAuthor}</span>}
          </Link>
          <span className={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className={styles.commentText}>{comment.content}</p>
      </article>

      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          parentAuthor={comment.author.username}
        />
      ))}
    </>
  );
}

export default function PostDetailView({ post, initialPhotoId }: PostDetailViewProps) {
  const [photos, setPhotos] = useState<PhotoResponseDto[]>(post.photos ?? []);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(() =>
    pickInitialPhotoId(post.photos ?? [], post.coverPhotoId, initialPhotoId),
  );
  const [commentMode, setCommentMode] = useState<CommentMode>("photo");
  const [commentDraft, setCommentDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) ?? photos[0],
    [photos, selectedPhotoId],
  );

  const selectedPhotoIndex = selectedPhoto
    ? photos.findIndex((photo) => photo.id === selectedPhoto.id)
    : -1;

  const selectedPhotoComments = selectedPhoto?.comments ?? [];
  const selectedPhotoCommentTotal = countAllComments(selectedPhotoComments);

  const postCommentTotal = useMemo(
    () => photos.reduce((sum, photo) => sum + countAllComments(photo.comments ?? []), 0),
    [photos],
  );

  const photosWithComments = useMemo(
    () =>
      photos
        .map((photo, index) => ({
          photo,
          index,
          totalComments: countAllComments(photo.comments ?? []),
        }))
        .filter((item) => item.totalComments > 0),
    [photos],
  );

  const metadataItems = selectedPhoto
    ? [
        selectedPhoto.iso ? `ISO ${selectedPhoto.iso}` : null,
        selectedPhoto.shutterSpeedDisplay ? selectedPhoto.shutterSpeedDisplay : null,
        selectedPhoto.aperture ? `f/${selectedPhoto.aperture}` : null,
        selectedPhoto.focalLength ? `${selectedPhoto.focalLength}mm` : null,
      ].filter((item): item is string => Boolean(item))
    : [];

  const descriptionTags = useMemo(
    () => extractHashtags(selectedPhoto?.description),
    [selectedPhoto?.description],
  );

  const progressPercent =
    photos.length > 0 && selectedPhotoIndex >= 0
      ? Math.round(((selectedPhotoIndex + 1) / photos.length) * 100)
      : 0;

  const handleSubmitComment = async () => {
    const trimmed = commentDraft.trim();
    if (!selectedPhoto || !trimmed || submitting) return;
    if (!isLoggedIn()) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await postsControllerCreatePhotoComment(post.id, selectedPhoto.id, {
        content: trimmed,
      });
      const newComment = response.data;

      setPhotos((prev) =>
        prev.map((photo) => {
          if (photo.id !== selectedPhoto.id) return photo;

          return {
            ...photo,
            comments: [...(photo.comments ?? []), newComment],
            commentCount: photo.commentCount + 1,
          };
        }),
      );
      setCommentDraft("");
    } catch (error) {
      alert(getApiErrorMessage(error, "댓글 작성 중 오류가 발생했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const mainImageUrl = selectedPhoto ? toS3ImageUrl(selectedPhoto.imageKey) : undefined;

  return (
    <div className={styles.layout}>
      <div className={styles.breadcrumb}>
        <Link href="/posts" className={styles.backLink}>포스트 목록으로</Link>
        <span className={styles.separator}>/</span>
        <span className={styles.currentTitle}>{post.title}</span>
      </div>

      <section className={styles.viewerCard}>
        <div className={styles.photoStage}>
          {selectedPhoto && mainImageUrl ? (
            <img src={mainImageUrl} alt={post.title} className={styles.mainImage} />
          ) : (
            <div className={styles.emptyMedia}>등록된 작품이 없습니다.</div>
          )}
        </div>

        <div className={styles.viewerInfo}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>사용 장비</span>
            <div className={styles.gearTags}>
              <div className={styles.gearTag}>
                <CameraIcon className={styles.gearIcon} />
                <span className={styles.gearType}>BODY</span>
                <span className={styles.gearName}>{getGearLabel(selectedPhoto?.camera)}</span>
              </div>
              <div className={styles.gearTag}>
                <MagnifyingGlassIcon className={styles.gearIcon} />
                <span className={styles.gearType}>LENS</span>
                <span className={styles.gearName}>{getGearLabel(selectedPhoto?.lens)}</span>
              </div>
            </div>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>촬영 데이터</span>
            <div className={styles.metaChips}>
              {metadataItems.length > 0 ? (
                metadataItems.map((item) => (
                  <span key={item} className={styles.metaChip}>
                    {item}
                  </span>
                ))
              ) : (
                <span className={styles.metaEmpty}>등록된 메타데이터가 없습니다.</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {photos.length > 0 && (
        <section className={styles.timelineCard}>
          <div className={styles.timelineHead}>
            <ClockIcon className={styles.timelineHeadIcon} />
            <span>타임라인 (History)</span>
          </div>
          <div className={styles.timelineList}>
            {photos.map((photo, index) => {
              const thumbUrl = toS3ImageUrl(photo.imageKey);
              const isActive = photo.id === selectedPhoto?.id;
              const photoCommentTotal = countAllComments(photo.comments ?? []);
              const label = photo.description?.trim() || `작품 ${index + 1}`;

              return (
                <button
                  key={photo.id}
                  type="button"
                  className={`${styles.timelineItem} ${isActive ? styles.timelineItemActive : styles.timelineItemDim}`}
                  onClick={() => {
                    setSelectedPhotoId(photo.id);
                    setCommentMode("photo");
                  }}
                >
                  <div className={styles.timelineThumb}>
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={label} className={styles.timelineThumbImage} />
                    ) : (
                      <div className={styles.timelineThumbEmpty}>No Image</div>
                    )}
                  </div>
                  <div className={styles.timelineMetaRow}>
                    <span className={isActive ? styles.timelineCurrent : styles.timelineLabel}>
                      #{String(index + 1).padStart(2, "0")} {isActive ? "Current" : label}
                    </span>
                    <span className={styles.timelineCommentCount}>댓글 {photoCommentTotal}</span>
                  </div>
                  {isActive ? <div className={styles.timelineMarker} /> : null}
                </button>
              );
            })}
          </div>
          <div className={styles.timelineRail} />
        </section>
      )}

      <section className={styles.storyGrid}>
        <article className={`${styles.storyCard} ${styles.storyCardPrimary}`}>
          <div className={styles.storyHead}>
            <span className={styles.storyQuote} aria-hidden="true">❝</span>
            <h2 className={styles.storyTitle}>작품 설명</h2>
          </div>
          <p className={styles.storyText}>
            {selectedPhoto?.description?.trim() || "작품 설명이 아직 등록되지 않았습니다."}
          </p>
          {descriptionTags.length > 0 && (
            <div className={styles.storyTags}>
              {descriptionTags.map((tag) => (
                <span key={tag} className={styles.storyTag}>{tag}</span>
              ))}
            </div>
          )}
        </article>

        <article className={`${styles.storyCard} ${styles.storyCardSecondary}`}>
          <div className={styles.storyHead}>
            <span className={styles.storyHeadDotMuted} />
            <h2 className={styles.storyTitle}>포스트 내용</h2>
          </div>
          <div className={styles.markdownBody}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p style={{ margin: "0 0 1em" }}>{children}</p>,
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>Series Progress</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </article>
      </section>

      <section className={styles.commentCard}>
        <div className={styles.commentTabs}>
          <button
            type="button"
            className={`${styles.commentTab} ${commentMode === "photo" ? styles.commentTabActive : ""}`}
            onClick={() => setCommentMode("photo")}
          >
            작품 댓글 ({selectedPhotoCommentTotal})
          </button>
          <button
            type="button"
            className={`${styles.commentTab} ${commentMode === "post" ? styles.commentTabActive : ""}`}
            onClick={() => setCommentMode("post")}
          >
            포스트 전체 댓글 ({postCommentTotal})
          </button>
        </div>

        {commentMode === "photo" ? (
          <>
            {selectedPhotoComments.length > 0 ? (
              <div className={styles.commentList}>
                {selectedPhotoComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyComment}>이 작품에는 아직 댓글이 없습니다.</div>
            )}

            {selectedPhoto ? (
              <div className={styles.commentWrite}>
                <textarea
                  className={styles.commentInput}
                  placeholder="현재 작품에 대한 감상을 남겨주세요."
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className={styles.commentButton}
                  onClick={handleSubmitComment}
                  disabled={submitting || !commentDraft.trim()}
                >
                  {submitting ? "등록 중..." : "댓글 등록"}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {photosWithComments.length > 0 ? (
              <div className={styles.postCommentGroups}>
                {photosWithComments.map(({ photo, index, totalComments }) => (
                  <section key={photo.id} className={styles.postCommentGroup}>
                    <button
                      type="button"
                      className={styles.groupTitle}
                      onClick={() => {
                        setSelectedPhotoId(photo.id);
                        setCommentMode("photo");
                      }}
                    >
                      작품 #{index + 1} · 댓글 {totalComments}개 보기
                    </button>
                    <div className={styles.commentList}>
                      {(photo.comments ?? []).map((comment) => (
                        <CommentItem key={`${photo.id}-${comment.id}`} comment={comment} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className={styles.emptyComment}>포스트에 등록된 댓글이 없습니다.</div>
            )}
          </>
        )}
      </section>
    </div>
  );
}