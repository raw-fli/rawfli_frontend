"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cross1Icon,
  EnvelopeClosedIcon,
  EyeOpenIcon,
  EyeNoneIcon,
  LockClosedIcon,
  PersonIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import styles from "./AuthModal.module.css";
import { authApi, saveToken } from "@/lib/auth";
import { ApiError } from "@/lib/api";

type AuthMode = "login" | "signup";

type AuthModalProps = {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onChangeMode: (mode: AuthMode) => void;
  onAuthSuccess?: () => void;
};

export default function AuthModal({
  open,
  mode,
  onClose,
  onChangeMode,
  onAuthSuccess,
}: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const title = useMemo(() => (mode === "login" ? "로그인" : "회원가입"), [mode]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [mode]);

  useEffect(() => {
    if (open) return;

    setShowPassword(false);
    setEmail("");
    setLoginPassword("");
    setSignupPassword("");
    setConfirmPassword("");
    setUsername("");
    setAgreed(false);
    setLoading(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [open]);

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !loginPassword) {
      setErrorMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const token = await authApi.login({ email: email.trim(), password: loginPassword });
      saveToken(token);
      onAuthSuccess?.();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !signupPassword || !confirmPassword || !username.trim()) {
      setErrorMessage("모든 필드를 입력해주세요.");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (!agreed) {
      setErrorMessage("약관 동의가 필요합니다.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await authApi.signup({
        email: email.trim(),
        username: username.trim(),
        password: signupPassword,
      });

      setSuccessMessage("회원가입이 완료되었습니다. 로그인해주세요.");
      setLoginPassword("");
      onChangeMode("login");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.backdropGrid} />
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>
              {mode === "login"
                ? "최고의 사진 커뮤니티에 다시 오신 것을 환영합니다."
                : "새로운 창작의 세계, 지금 바로 시작하세요."}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            <Cross1Icon />
          </button>
        </div>

        {mode === "login" ? (
          <form className={styles.form} onSubmit={handleLoginSubmit}>
            {successMessage && <p className={styles.successText}>{successMessage}</p>}
            {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
            <label className={styles.label}>
              이메일
              <span className={styles.inputWrap}>
                <PersonIcon className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>

            <label className={styles.label}>
              비밀번호
              <span className={styles.inputWrap}>
                <LockClosedIcon className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="비밀번호 표시 전환"
                >
                  {showPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                </button>
              </span>
            </label>

            <label className={styles.checkboxRow}>
              <input type="checkbox" className={styles.checkbox} />
              <span>로그인 유지</span>
            </label>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>

            <div className={styles.separator}>간편 로그인</div>
            <div className={styles.socialRow}>
              <button type="button" className={styles.socialBtn} aria-label="Google 로그인" />
              <button type="button" className={styles.socialBtn} aria-label="Kakao 로그인" />
              <button type="button" className={styles.socialBtn} aria-label="Naver 로그인" />
            </div>

            <p className={styles.footerText}>
              계정이 없으신가요?
              <button type="button" className={styles.linkBtn} onClick={() => onChangeMode("signup")}>
                회원가입
              </button>
            </p>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleSignupSubmit}>
            {successMessage && <p className={styles.successText}>{successMessage}</p>}
            {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
            <label className={styles.label}>
              이메일
              <span className={styles.inputWrap}>
                <EnvelopeClosedIcon className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="email"
                  placeholder="example@photo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>

            <label className={styles.label}>
              비밀번호
              <span className={styles.inputWrap}>
                <LockClosedIcon className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                />
              </span>
            </label>

            <label className={styles.label}>
              비밀번호 확인
              <span className={styles.inputWrap}>
                <CheckIcon className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </span>
            </label>

            <label className={styles.label}>
              닉네임
              <span className={styles.inputWrap}>
                <PersonIcon className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="text"
                  placeholder="사용하실 닉네임을 입력하세요"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </span>
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span>이용약관 및 개인정보 처리방침에 동의합니다.</span>
            </label>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "가입 중..." : "가입하기"}
            </button>

            <p className={styles.footerText}>
              이미 계정이 있으신가요?
              <button type="button" className={styles.linkBtn} onClick={() => onChangeMode("login")}>
                로그인
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
