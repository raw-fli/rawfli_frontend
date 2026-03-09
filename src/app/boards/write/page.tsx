"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  FontBoldIcon,
  FontItalicIcon,
  ImageIcon,
  Link2Icon,
  VideoIcon,
  Cross2Icon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";
import AuthModal from "@/components/auth/AuthModal";
import {
  boardsControllerGetBoards,
  useArticleControllerCreateArticle,
  BoardResponseDto,
  CreateArticleDto,
  awsControllerUploadFile,
  Image as UploadedImage,
} from "@rawfli/types";
import { isLoggedIn } from "@/lib/auth";
import styles from "./page.module.css";

export default function ArticleWritePage() {
  const router = useRouter();

  const [boardId, setBoardId] = useState<number | null>(null);
  const [boards, setBoards] = useState<BoardResponseDto[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageIds, setUploadedImageIds] = useState<(string | null)[]>([]);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createArticle = useArticleControllerCreateArticle();

  useEffect(() => {
    if (!isLoggedIn()) {
      setAuthModalOpen(true);
      return;
    }
    boardsControllerGetBoards().then((res) => {
      const communityBoards = res.data.filter((b) => b.type === "community");
      setBoards(communityBoards);
    });
  }, [router]);

  const handleImageSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );
    if (!newFiles.length) return;

    const startIndex = imageFiles.length;

    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
    setUploadedImageIds((prev) => [...prev, ...newFiles.map(() => null)]);
    setPendingUploads((prev) => prev + 1);

    try {
      const result = await awsControllerUploadFile({ images: newFiles });
      const uploaded = (result as unknown as { data: UploadedImage[] }).data;
      setUploadedImageIds((prev) => {
        const updated = [...prev];
        uploaded.forEach((img, i) => {
          updated[startIndex + i] = img.id;
        });
        return updated;
      });
    } catch {
      setSubmitError("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
      setImageFiles((prev) => prev.filter((_, i) => i < startIndex || i >= startIndex + newFiles.length));
      setImagePreviews((prev) => prev.filter((_, i) => i < startIndex || i >= startIndex + newFiles.length));
      setUploadedImageIds((prev) => prev.filter((_, i) => i < startIndex || i >= startIndex + newFiles.length));
    } finally {
      setPendingUploads((prev) => prev - 1);
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadedImageIds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleImageSelect(e.dataTransfer.files);
  };

  const handleSubmit = () => {
    if (!boardId || !title.trim() || !content.trim()) return;
    setSubmitError(null);

    const dto: CreateArticleDto = {
      title: title.trim(),
      content: content.trim(),
      imageIds: uploadedImageIds.filter((id): id is string => id !== null),
    };

    createArticle.mutate(
      { boardId, data: dto },
      {
        onSuccess: (res) => {
          const articleId = res.data.id;
          router.push(`/boards/${boardId}/articles/${articleId}`);
        },
        onError: () => {
          setSubmitError("게시글 등록에 실패했습니다. 로그인 상태를 확인해주세요.");
        },
      }
    );
  };

  const canSubmit = !!title.trim() && !!content.trim() && !createArticle.isPending && pendingUploads === 0;

  return (
    <div className={styles.page}>
      <HomeHeader />

      <AuthModal
        open={authModalOpen}
        mode="login"
        onClose={() => router.back()}
        onChangeMode={() => {}}
        onAuthSuccess={() => {
          setAuthModalOpen(false);
          boardsControllerGetBoards().then((res) => {
            const communityBoards = res.data.filter((b) => b.type === "community");
            setBoards(communityBoards);
          });
        }}
      />

      <main className={styles.main}>
        <div className={styles.grid}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>게시글 작성</h2>

            {boards.length > 0 && (
              <div className={styles.boardSelector}>
                {boards.map((board) => (
                  <button
                    key={board.id}
                    type="button"
                    className={`${styles.boardChip} ${board.id === boardId ? styles.boardChipActive : ""}`}
                    onClick={() => setBoardId(board.id)}
                  >
                    {board.name}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              className={styles.titleInput}
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {/* Editor */}
            <div className={styles.editor}>
              <div className={styles.toolbar}>
                <button type="button" className={styles.toolbarButton} aria-label="굵게">
                  <FontBoldIcon />
                </button>
                <button type="button" className={styles.toolbarButton} aria-label="기울임">
                  <FontItalicIcon />
                </button>
                <button type="button" className={styles.toolbarButton} aria-label="링크">
                  <Link2Icon />
                </button>
                <div className={styles.toolbarDivider} />
                <button type="button" className={styles.toolbarButton} aria-label="이미지">
                  <ImageIcon />
                </button>
                <button type="button" className={styles.toolbarButton} aria-label="동영상">
                  <VideoIcon />
                </button>
                <div style={{ marginLeft: "auto" }}>
                  <button type="button" className={styles.toolbarButton} aria-label="도움말">
                    <QuestionMarkCircledIcon />
                  </button>
                </div>
              </div>
              <textarea
                className={styles.contentTextarea}
                placeholder="내용을 입력하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* Image upload */}
            <div className={styles.uploadSection}>
              <span className={styles.uploadLabel}>사진 첨부</span>
              <div
                className={styles.uploadZone}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className={styles.uploadIcon}>
                  <CameraIcon width={28} height={28} />
                </div>
                <div className={styles.uploadText}>
                  <p className={styles.uploadTextPrimary}>
                    클릭하거나 사진을 이곳에 드래그하세요
                  </p>
                  <p className={styles.uploadTextSecondary}>
                    최대 20MB 이하의 JPG, PNG, WEBP 파일
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => handleImageSelect(e.target.files)}
              />

              {imagePreviews.length > 0 && (
                <div className={styles.imagePreviewList}>
                  {imagePreviews.map((src, i) => (
                    <div key={src} className={styles.imagePreviewItem}>
                      <img src={src} alt={`첨부 ${i + 1}`} />
                      <button
                        type="button"
                        className={styles.imageRemoveButton}
                        onClick={() => handleRemoveImage(i)}
                        aria-label="이미지 제거"
                      >
                        <Cross2Icon width={12} height={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              {submitError && (
                <p style={{ color: "var(--hot-badge-color, #ff4d4d)", fontSize: "0.875rem", marginRight: "auto" }}>
                  {submitError}
                </p>
              )}
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => router.back()}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.submitButton}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                등록하기
              </button>
            </div>
          </div>

          {/* ── Right Column: Sidebar ── */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3 className={`${styles.sidebarCardTitle} ${styles.sidebarCardTitleAccent}`}>
                <CameraIcon width={18} height={18} />
                작성 팁
              </h3>
              <ul className={styles.tipList}>
                <li className={styles.tipItem}>
                  <span className={styles.tipNumber}>01</span>
                  <p>선명한 고화질 사진은 커뮤니티 베스트에 선정될 확률이 높습니다.</p>
                </li>
                <li className={styles.tipItem}>
                  <span className={styles.tipNumber}>02</span>
                  <p>사용한 장비 정보(바디, 렌즈, 설정값)를 공유해주시면 다른 회원들에게 큰 도움이 됩니다.</p>
                </li>
                <li className={styles.tipItem}>
                  <span className={styles.tipNumber}>03</span>
                  <p>타인의 저작권을 존중하며, 직접 촬영한 사진만 업로드해 주세요.</p>
                </li>
              </ul>
            </div>

            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarCardTitle}>커뮤니티 가이드</h3>
              <div className={styles.guideList}>
                <p>• 비방, 욕설, 광고성 게시글은 삭제될 수 있습니다.</p>
                <p>• 게시판 성격에 맞는 카테고리를 선택해 주세요.</p>
                <p>• 개인정보가 노출되지 않도록 주의해 주세요.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
