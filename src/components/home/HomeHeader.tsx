"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CameraIcon, ExitIcon, GearIcon, PersonIcon } from "@radix-ui/react-icons";
import SearchBar from "./SearchBar";
import styles from "./HomePage.module.css";
import AuthModal from "@/components/auth/AuthModal";
import { getUserIdFromToken, isLoggedIn, removeToken } from "@/lib/auth";
import { useMeControllerGetMe } from "@rawfli/types";
import { toS3ImageUrl } from "@/shared/utils/image";

type NavItem = {
  key: "community" | "gallery" | "gear";
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { key: "community", label: "커뮤니티", href: "#" },
  { key: "gallery", label: "갤러리", href: "#" },
  { key: "gear", label: "장비", href: "#" },
];

type HomeHeaderProps = {
  activeNav?: "community" | "gallery";
};

export default function HomeHeader({ activeNav }: HomeHeaderProps) {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loggedIn, setLoggedIn] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const { data: meResp } = useMeControllerGetMe({ query: { enabled: loggedIn } });
  const profileImageUrl = meResp?.data?.profileImageKey
    ? toS3ImageUrl(meResp.data.profileImageKey)
    : null;

  useEffect(() => {
    const syncLoginState = () => {
      setLoggedIn(isLoggedIn());
    };

    syncLoginState();
    window.addEventListener("storage", syncLoginState);

    return () => {
      window.removeEventListener("storage", syncLoginState);
    };
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen]);

  const openLogin = () => {
    setAuthMode("login");
    setAuthOpen(true);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setAuthOpen(true);
  };

  const handleLogout = () => {
    removeToken();
    setLoggedIn(false);
    setProfileMenuOpen(false);
  };

  const handleMyPage = () => {
    const userId = getUserIdFromToken();
    if (userId) {
      router.push(`/users/${userId}`);
      setProfileMenuOpen(false);
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoAndNav}>
            <Link href="/" className={styles.logo}>
              <div className={styles.logoMark}>
                <CameraIcon />
              </div>
              <span className={styles.logoTitle}>Raw.fli</span>
            </Link>
            <nav className={styles.nav}>
              {navItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles.navLink} ${(activeNav ? item.key === activeNav : index === 0) ? styles.navLinkActive : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.searchWrap}>
            <SearchBar />
          </div>

          <div className={styles.headerActions}>
            {loggedIn ? (
              <>
                <button type="button" className={styles.iconActionButton} aria-label="알림">
                  <BellIcon />
                </button>
                <div ref={profileMenuRef} className={styles.profileMenuWrap}>
                  <button
                    type="button"
                    className={styles.profileButton}
                    aria-label="프로필"
                    aria-expanded={profileMenuOpen}
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                  >
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="프로필"
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "9999px" }}
                      />
                    ) : (
                      <PersonIcon />
                    )}
                  </button>

                  {profileMenuOpen && (
                    <div className={styles.profileMenu} role="menu" aria-label="프로필 메뉴">
                      <button type="button" className={styles.profileMenuItem} role="menuitem" onClick={handleMyPage}>
                        <PersonIcon /> 마이페이지
                      </button>
                      <button type="button" className={styles.profileMenuItem} role="menuitem" onClick={() => { router.push("/settings"); setProfileMenuOpen(false); }}>
                        <GearIcon /> 설정
                      </button>
                      <button
                        type="button"
                        className={`${styles.profileMenuItem} ${styles.profileMenuDanger}`}
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <ExitIcon /> 로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button type="button" className={styles.textButton} onClick={openLogin}>
                  로그인
                </button>
                <button type="button" className={styles.primaryButton} onClick={openSignup}>
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onChangeMode={setAuthMode}
        onAuthSuccess={() => {
          setLoggedIn(true);
          setAuthOpen(false);
        }}
      />
    </>
  );
}
