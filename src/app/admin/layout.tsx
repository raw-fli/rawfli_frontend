import type { Metadata } from "next";
import AdminQueryProvider from "@/components/providers/AdminQueryProvider";
import AdminShell from "@/components/admin/AdminShell";
import styles from "./admin-layout.module.css";

export const metadata: Metadata = {
  title: "Admin | Rawfli",
  description: "Rawfli Admin Panel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminQueryProvider>
      <div className={styles.page}>
        <AdminShell>{children}</AdminShell>
      </div>
    </AdminQueryProvider>
  );
}
