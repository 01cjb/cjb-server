"use client";
import { IconHeart } from "./Icons";
import { useStore } from "./Store";
export default function WishButton({ id, className = "" }: { id: number; className?: string }) {
  const { wish, toggleWish } = useStore();
  const on = wish.includes(id);
  return (
    <button onClick={(e) => { e.preventDefault(); toggleWish(id); }} aria-label={on ? "찜 해제" : "찜하기"} className={`${on ? "text-accent" : "text-neutral-400"} ${className}`}>
      <IconHeart filled={on} className="size-5" />
    </button>
  );
}
