/**
 * LoadingSpinner Component
 * 
 * Simple loading indicator
 */

const LoadingSpinner = ({ size = "medium" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-4 border-gray-600 border-t-emerald-500 rounded-full animate-spin`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
