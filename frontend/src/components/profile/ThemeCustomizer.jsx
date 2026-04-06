/**
 * ThemeCustomizer Component
 * 
 * Allows users to customize heatmap color and theme preferences.
 */

import { useState, useEffect } from "react";
import { Palette, Moon, Sun } from "lucide-react";
import { getPreferences, updateTheme } from "../../api/profile";

const ThemeCustomizer = ({ onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [heatmapColor, setHeatmapColor] = useState("#10b981");
  const [mode, setMode] = useState("dark");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await getPreferences();
      setPreferences(response.data);
      setHeatmapColor(response.data.theme.heatmapColor);
      setMode(response.data.theme.mode);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const handleColorChange = async (color) => {
    setHeatmapColor(color);
    try {
      await updateTheme({ heatmapColor: color });
      if (onThemeChange) {
        onThemeChange({ heatmapColor: color });
      }
    } catch (error) {
      console.error("Error updating color:", error);
    }
  };

  const handleModeChange = async (newMode) => {
    setMode(newMode);
    try {
      await updateTheme({ mode: newMode });
      document.documentElement.classList.toggle("dark", newMode === "dark");
      if (onThemeChange) {
        onThemeChange({ mode: newMode });
      }
    } catch (error) {
      console.error("Error updating mode:", error);
    }
  };

  const presetColors = [
    { name: "Emerald", value: "#10b981" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Orange", value: "#f97316" },
    { name: "Red", value: "#ef4444" },
    { name: "Yellow", value: "#eab308" },
    { name: "Cyan", value: "#06b6d4" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition border border-gray-700"
      >
        <Palette className="w-5 h-5" />
        <span>Customize Theme</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 z-50">
          <h3 className="text-lg font-semibold text-white mb-4">Theme Settings</h3>

          {/* Mode Toggle */}
          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block">Display Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleModeChange("dark")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                  mode === "dark"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => handleModeChange("light")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                  mode === "light"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>
            </div>
          </div>

          {/* Heatmap Color */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Heatmap Color</label>
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`h-12 rounded-lg transition hover:scale-110 ${
                    heatmapColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800" : ""
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Custom Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={heatmapColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={heatmapColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="#10b981"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Preview</p>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => {
                const opacity = level === 0 ? 0 : level === 1 ? 0.3 : level === 2 ? 0.5 : level === 3 ? 0.7 : 1;
                return (
                  <div
                    key={level}
                    className="w-8 h-8 rounded"
                    style={{
                      backgroundColor: level === 0 ? "#1f2937" : heatmapColor,
                      opacity: level === 0 ? 1 : opacity,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeCustomizer;
