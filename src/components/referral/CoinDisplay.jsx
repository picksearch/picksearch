import React from "react";
import { Coins } from "lucide-react";

export default function CoinDisplay({ coins = 0, size = "default" }) {
  const sizeClasses = {
    small: "text-sm",
    default: "text-lg",
    large: "text-2xl"
  };
  
  const iconSizes = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-7 h-7"
  };

  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full">
        <Coins className={`${iconSizes[size]} text-white`} />
      </div>
      <span className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
        {coins?.toLocaleString() || 0}
      </span>
      <span className={`text-gray-500 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
        서치코인
      </span>
    </div>
  );
}