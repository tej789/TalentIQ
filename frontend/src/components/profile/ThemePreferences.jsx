/**
 * ThemePreferences Component
 * 
 * Allows users to customize their profile theme colors (TypeMaster style).
 */

import { useState } from "react";
import { updateTheme } from "../../api/profile";

const ThemePreferences = ({ selectedColor, onColorChange, publicProfileId }) => {
  const [saving, setSaving] = useState(false);

  // Predefined color palette (TypeMaster style)
  const colorPalette = [
    { name: "Coral", hex: "#ef4444" },      // red-500
    { name: "Pink", hex: "#ec4899" },       // pink-500
    { name: "Purple", hex: "#a855f7" },     // purple-500
    { name: "Indigo", hex: "#8b5cf6" },     // violet-500
    { name: "Blue", hex: "#6366f1" },       // indigo-500
    { name: "Sky", hex: "#3b82f6" },        // blue-500
    { name: "Cyan", hex: "#06b6d4" },       // cyan-500
    { name: "Teal", hex: "#14b8a6" },       // teal-500
    { name: "Emerald", hex: "#10b981" },    // emerald-500
    { name: "Green", hex: "#22c55e" },      // green-500
    { name: "Lime", hex: "#a3e635" },       // lime-400
    { name: "Yellow", hex: "#eab308" },     // yellow-500
    { name: "Amber", hex: "#fbbf24" },      // amber-400
    { name: "Orange", hex: "#f97316" },     // orange-500
    { name: "Red Orange", hex: "#fb923c" }, // orange-400
    { name: "Brown", hex: "#78716c" },      // stone-500
    { name: "Gray", hex: "#9ca3af" },       // gray-400
    { name: "Slate", hex: "#64748b" },      // slate-500
  ];

  const handleColorClick = async (color) => {
    onColorChange(color.hex);
    
    try {
      setSaving(true);
      await updateTheme({ heatmapColor: color.hex });
    } catch (error) {
      console.error("Failed to save theme:", error);
      // Optionally show error toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Theme Preferences</h3>
        <p className="text-sm text-gray-400">Choose your primary color</p>
      </div>

      {/* Color Palette Grid */}
      <div className="grid grid-cols-6 gap-3">
        {colorPalette.map((color) => (
          <button
            key={color.hex}
            onClick={() => handleColorClick(color)}
            className="relative w-12 h-12 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            style={{ backgroundColor: color.hex }}
            title={color.name}
            disabled={saving}
          >
            {/* Checkmark for selected color */}
            {selectedColor === color.hex && (
              <svg
                className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow-lg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      {saving && (
        <div className="mt-3 text-center text-sm text-gray-400">
          Saving preferences...
        </div>
      )}
    </div>
  );
};

export default ThemePreferences;
