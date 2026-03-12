"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PersonIcon,
  Pencil2Icon,
  IdCardIcon,
  LockClosedIcon,
  ExitIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import styles from "./SettingsPage.module.css";
import {
  useMeControllerGetMe,
  useMeControllerUpdateProfile,
  useMeControllerUpdatePassword,
  awsControllerUploadFile,
  getMeControllerGetMeQueryKey,
} from "@rawfli/types";
import type { MeResponseDto } from "@rawfli/types";
import { useQueryClient } from "@tanstack/react-query";
import { isLoggedIn, removeToken } from "@/lib/auth";
import { toS3ImageUrl } from "@/shared/utils/image";

const BIO_MAX_LENGTH = 300;

type Toast = {
  type: "success" | "error";
  message: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: meResp, isLoading } = useMeControllerGetMe();
  const me: MeResponseDto | undefined = meResp?.data;

  const updateProfile = useMeControllerUpdateProfile();
  const updatePassword = useMeControllerUpdatePassword();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageKey, setProfileImageKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!me) return;
    setUsername(me.username);
    setBio(me.bio ?? "");
    setProfileImageKey(me.profileImageKey);
  }, [me]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
  };

  const hasChanges = me
    ? username !== me.username ||
      bio !== (me.bio ?? "") ||
      profileImageKey !== me.profileImageKey ||
      pendingFile !== null
    : false;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    e.target.value = "";
  };

  const handleResetImage = () => {
    setPendingFile(null);
    setPreviewUrl(null);
    setProfileImageKey(null);
  };

  const handleSave = async () => {
    if (!me || saving) return;
    setSaving(true);

    try {
      let finalImageKey = profileImageKey;

      if (pendingFile) {
        const uploadResult = await awsControllerUploadFile({ images: [pendingFile] });
        const imgs = (uploadResult as unknown as { data: { key: string }[] }).data;
        if (imgs.length > 0) {
          finalImageKey = imgs[0].key;
        }
      }

      await updateProfile.mutateAsync({
        data: {
          username,
          bio: bio || null,
          profileImageKey: finalImageKey,
        },
      });

      setPendingFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: getMeControllerGetMeQueryKey() });
      showToast("success", "변경 사항이 저장되었습니다.");
    } catch {
      showToast("error", "저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!me) return;
    setUsername(me.username);
    setBio(me.bio ?? "");
    setProfileImageKey(me.profileImageKey);
    setPendingFile(null);
    setPreviewUrl(null);
  };

  const handlePasswordSubmit = async () => {
    if (!currentPassword || !newPassword) return;

    try {
      await updatePassword.mutateAsync({
        data: { currentPassword, newPassword },
      });
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      showToast("success", "비밀번호가 변경되었습니다.");
    } catch {
      showToast("error", "현재 비밀번호가 올바르지 않습니다.");
    }
  };

  const handleLogout = () => {
    removeToken();
    router.replace("/");
  };

  const displayImageUrl =
    previewUrl ?? toS3ImageUrl(profileImageKey ?? undefined) ?? null;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.main} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <aside className={styles.sidebar}>
          <p className={styles.sidebarLabel}>Account</p>
          <nav className={styles.sidebarNav}>
            <button
              type="button"
              className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}
            >
              <PersonIcon className={styles.sidebarIcon} />
              계정 정보
            </button>
          </nav>
          <div className={styles.sidebarFooter}>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              <ExitIcon className={styles.sidebarIcon} />
              로그아웃
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <h3 className={styles.pageTitle}>계정 정보 수정</h3>
          <p className={styles.pageDesc}>
            프로필과 기본 계정 정보를 최신으로 유지하세요.
          </p>

          <section className={styles.section}>
            <div className={styles.profileImageSection}>
              <div className={styles.avatarGroup}>
                <div className={styles.avatarWrap}>
                  {displayImageUrl ? (
                    <img
                      className={styles.avatarImage}
                      src={displayImageUrl}
                      alt="프로필"
                    />
                  ) : (
                    <div className={styles.avatarFallback}>
                      <PersonIcon className={styles.avatarFallbackIcon} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.avatarEditBadge}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Pencil2Icon className={styles.avatarEditIcon} />
                </button>
              </div>
              <div className={styles.avatarInfo}>
                <h4 className={styles.avatarLabel}>프로필 이미지</h4>
                <p className={styles.avatarHint}>
                  자신을 나타내는 이미지를 업로드하세요.
                  <br />
                  (JPG, PNG 최대 5MB 권장)
                </p>
                <div className={styles.avatarActions}>
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    사진 업로드
                  </button>
                  <button
                    type="button"
                    className={styles.resetButton}
                    onClick={handleResetImage}
                  >
                    기본값으로 초기화
                  </button>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleImageSelect}
            />
          </section>

          <div className={styles.divider} />

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <IdCardIcon className={styles.sectionIcon} />
              <h4 className={styles.sectionTitle}>기본 정보</h4>
            </div>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>닉네임</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="닉네임 입력"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>자기소개</label>
                <textarea
                  className={styles.fieldTextarea}
                  placeholder="나를 소개하는 한 마디"
                  rows={4}
                  maxLength={BIO_MAX_LENGTH}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <p className={styles.fieldHint}>
                  {bio.length} / {BIO_MAX_LENGTH}
                </p>
              </div>
            </div>
          </section>

          <div className={styles.divider} />

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <LockClosedIcon className={styles.sectionIcon} />
              <h4 className={styles.sectionTitle}>로그인 보안</h4>
            </div>
            <div className={styles.securityGrid}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>이메일 주소</label>
                <div className={styles.readonlyWrap}>
                  <input
                    type="email"
                    className={styles.readonlyField}
                    value={me?.email ?? ""}
                    readOnly
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>비밀번호</label>
                <button
                  type="button"
                  className={styles.passwordMask}
                  onClick={() => setPasswordOpen(true)}
                >
                  <span className={styles.passwordDots}>••••••••••••</span>
                  <span className={styles.passwordAction}>재설정</span>
                </button>
              </div>
            </div>
          </section>

          <div className={styles.footer}>
            <button type="button" className={styles.deleteButton}>
              계정 영구 삭제
            </button>
            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.cancelAction}
                onClick={handleCancel}
                disabled={!hasChanges}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                {saving ? "저장 중..." : "변경 사항 저장"}
              </button>
            </div>
          </div>
        </main>
      </div>

      {passwordOpen && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPasswordOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPasswordOpen(false);
          }}
        >
          <div className={styles.modal}>
            <h4 className={styles.modalTitle}>비밀번호 변경</h4>
            <p className={styles.modalDesc}>
              보안을 위해 현재 비밀번호를 먼저 확인합니다.
            </p>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>현재 비밀번호</label>
                <input
                  type="password"
                  className={styles.fieldInput}
                  placeholder="현재 비밀번호"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>새 비밀번호</label>
                <input
                  type="password"
                  className={styles.fieldInput}
                  placeholder="6자리 이상"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancel}
                onClick={() => {
                  setPasswordOpen(false);
                  setCurrentPassword("");
                  setNewPassword("");
                }}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={handlePasswordSubmit}
                disabled={
                  !currentPassword ||
                  newPassword.length < 6 ||
                  updatePassword.isPending
                }
              >
                {updatePassword.isPending ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.toastSuccess : styles.toastError
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircledIcon className={styles.toastIcon} />
          ) : (
            <CrossCircledIcon className={styles.toastIcon} />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
