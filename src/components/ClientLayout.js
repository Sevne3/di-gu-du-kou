"use client";
import MusicPlayer from "@/components/MusicPlayer";
import ThemeToggleBtn from "@/components/ThemeToggleBtn";
import MobileNav from "@/components/MobileNav";

export default function ClientLayout(props) {
  return (
    <>
      {props.children}
      <MusicPlayer />
      <ThemeToggleBtn />
      <MobileNav />
    </>
  );
}