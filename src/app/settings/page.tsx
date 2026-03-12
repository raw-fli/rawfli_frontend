"use client";

import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";
import SettingsPage from "@/components/settings/SettingsPage";

export default function SettingsRoute() {
  return (
    <div>
      <HomeHeader />
      <SettingsPage />
      <HomeFooter />
    </div>
  );
}
