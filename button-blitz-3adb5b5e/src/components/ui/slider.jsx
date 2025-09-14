"use client"
import * as React from "react";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef(({ className, value, onValueChange, min = 0, max = 1, step = 0.01, ...props }, ref) => {
  const internalValue = value?.[0] ?? 0;
  
  const percentage = ((internalValue - min) / (max - min)) * 100;

  const handleChange = (event) => {
    if (onValueChange) {
      onValueChange([parseFloat(event.target.value)]);
    }
  };

  // This style dynamically creates the progress track effect.
  const backgroundStyle = {
    background: `linear-gradient(to right, rgb(var(--text-accent)) ${percentage}%, rgba(var(--background-secondary), 0.5) ${percentage}%)`
  };

  return (
    <div className="relative flex items-center w-full h-5">
      <input
        type="range"
        value={internalValue}
        onChange={handleChange}
        ref={ref}
        min={min}
        max={max}
        step={step}
        className={cn("custom-slider", className)}
        style={backgroundStyle}
        {...props}
      />
    </div>
  );
});
Slider.displayName = "Slider";

export { Slider };