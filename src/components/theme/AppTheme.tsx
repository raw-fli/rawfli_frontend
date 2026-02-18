import type { ReactNode } from "react";
import styles from "./AppTheme.module.css";

type AppThemeProps = {
  children: ReactNode;
};

export default function AppTheme({ children }: AppThemeProps) {
  return <div className={styles.theme}>{children}</div>;
}
