"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { ExitIcon, GearIcon, HomeIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { isAdminLoggedIn, removeAdminToken } from "@/lib/admin-auth";
import styles from "@/app/admin/dashboard/dashboard-layout.module.css";

const emptySubscribe = () => () => {};

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === "/admin";
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isAuthorized = isAuthPage || (isClient && isAdminLoggedIn());

  useEffect(() => {
    if (!isAuthorized) {
      router.replace("/admin");
    }
  }, [isAuthorized, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return <div className={styles.guard}>관리자 인증을 확인하는 중입니다.</div>;
  }

  const navItems = [
    { href: "/admin/dashboard", label: "대시보드", icon: <HomeIcon /> },
    { href: "/admin/cameras", label: "카메라 관리", icon: <GearIcon /> },
    { href: "/admin/lenses", label: "렌즈 관리", icon: <MixerHorizontalIcon /> },
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
