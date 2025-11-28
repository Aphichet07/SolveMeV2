import React from "react";
import Bubble from "./bubble";

export default function BubbleList({ items, isLoading, onItemClick }) {
  if (isLoading) {
    return (
      <div className="mt-4 text-xs text-slate-500">
        กำลังโหลดฟองสบู่ปัญหา…
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="mt-4 text-xs text-slate-500">
        ยังไม่มีปัญหาในระยะนี้
      </div>
    );
  }
  
  return (
    <div
      className="
        mt-4
        flex flex-wrap
        gap-3
        justify-center
      "
    >
      {items.map((b, index) => {
        const scale = 0.8 + Math.random() * 0.5;
        const duration = 5 + Math.random() * 4;
        const delay = Math.random() * 2;
        return (
          <div
            key={b.id || index}
            className="bubble-float-wrapper"
            style={{
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
              }}
            >
              
              <Bubble
                title={b.title}
                description={b.description}
                profile={b.profile}
                distanceText={b.distanceText}
                priority={b.priority}
                expiresAtMs={b.expiresAtMs} 
                onClick={() => onItemClick && onItemClick(b)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
