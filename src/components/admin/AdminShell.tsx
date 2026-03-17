"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExitIcon, GearIcon, HomeIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { isAdminLoggedIn, removeAdminToken } from "@/lib/admin-auth";
import styles from "@/app/admin/dashboard/dashboard-layout.module.css";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === "/admin";
  const [isAuthorized, setIsAuthorized] = useState(isAuthPage);
  const [isAuthChecked, setIsAuthChecked] = useState(isAuthPage);

  useEffect(() => {
    if (isAuthPage) {
      setIsAuthorized(true);
      setIsAuthChecked(true);
      return;
    }

    const authorized = isAdminLoggedIn();
    setIsAuthorized(authorized);
    setIsAuthChecked(true);
  }, [isAuthPage]);

  useEffect(() => {
    if (!isAuthPage && isAuthChecked && !isAuthorized) {
      router.replace("/admin");
    }
  }, [isAuthPage, isAuthChecked, isAuthorized, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!isAuthChecked || !isAuthorized) {
    return <div className={styles.guard}>관리자 인증을 확인하는 중입니다.</div>;
  }

  const navItems = [
    { href: "/admin/dashboard", label: "대시보드", icon: <HomeIcon /> },
    { href: "/admin/cameras", label: "카메라 관리", icon: <GearIcon /> },
    { href: "/admin/lenses", label: "렌즈 관리", icon: <MixerHorizontalIcon /> },
    { href: "/admin/images", label: "업로드 이미지", icon: <GearIcon /> },
    { href: "/admin/deleted-posts", label: "삭제 게시글", icon: <MixerHorizontalIcon /> },
    { href: "/admin/deleted-comments", label: "삭제 댓글", icon: <MixerHorizontalIcon /> },
  ];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div>
          <h2 className={styles.brand}>Rawfli Admin</h2>
          <p className={styles.caption}>관리자 패널</p>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(pathname, item.href) ? styles.navItemActive : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={() => {
            removeAdminToken();
            router.replace("/admin");
          }}
        >
          <ExitIcon />
          <span>로그아웃</span>
        </button>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
