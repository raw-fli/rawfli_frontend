"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BellIcon, CameraIcon, ExitIcon, GearIcon, PersonIcon } from "@radix-ui/react-icons";
import SearchBar from "./SearchBar";
import styles from "./HomePage.module.css";
import AuthModal from "@/components/auth/AuthModal";
import { isLoggedIn, removeToken } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "커뮤니티", href: "#" },
  { label: "갤러리", href: "#" },
  { label: "장비", href: "#" },
];

export default function HomeHeader() {
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loggedIn, setLoggedIn] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>
              <CameraIcon />
            </div>
            <span className={styles.logoTitle}>Raw.fli</span>
            <nav className={styles.nav}>
              {navItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles.navLink} ${index === 0 ? styles.navLinkActive : ""}`}
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
                    <PersonIcon />
                  </button>

                  {profileMenuOpen && (
                    <div className={styles.profileMenu} role="menu" aria-label="프로필 메뉴">
                      <button type="button" className={styles.profileMenuItem} role="menuitem">
                        <PersonIcon /> 마이페이지
                      </button>
                      <button type="button" className={styles.profileMenuItem} role="menuitem">
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
