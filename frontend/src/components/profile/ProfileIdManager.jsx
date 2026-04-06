// /**
//  * ProfileIdManager Component
//  * 
//  * Allows users to change their public profile ID with validation
//  */

// import { useState } from "react";
// import { Edit2, Check, X, AlertCircle } from "lucide-react";
// import { changeProfileId } from "../../api/profile";
// import toast from "react-hot-toast";

// const ProfileIdManager = ({ currentId, onIdChanged }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [newId, setNewId] = useState(currentId);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");

//   const validateId = (id) => {
//     const regex = /^[a-zA-Z0-9]{8,12}$/;
//     if (!regex.test(id)) {
//       return "ID must be 8-12 alphanumeric characters";
//     }
//     return "";
//   };

//   const handleSave = async () => {
//     const validationError = validateId(newId);
//     if (validationError) {
//       setError(validationError);
//       return;
//     }

//     setIsLoading(true);
//     setError("");

//     try {
//       await changeProfileId(newId);
//       toast.success("Profile ID updated successfully!");
//       setIsEditing(false);
//       if (onIdChanged) {
//         onIdChanged(newId);
//       }
//       // Redirect to new profile URL
//       setTimeout(() => {
//         window.location.href = `/profile/${newId}`;
//       }, 1000);
//     } catch (err) {
//       const errorMsg = err.response?.data?.message || "Failed to update profile ID";
//       setError(errorMsg);
//       toast.error(errorMsg);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     setNewId(currentId);
//     setError("");
//     setIsEditing(false);
//   };

//   return (
//     <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
//       <h3 className="text-lg font-semibold text-white mb-3">Profile ID</h3>
      
//       {!isEditing ? (
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-gray-400 text-sm mb-1">Your profile URL:</p>
//             <code className="text-emerald-400 bg-gray-900 px-3 py-1 rounded">
//               /profile/{currentId}
//             </code>
//           </div>
//           <button
//             onClick={() => setIsEditing(true)}
//             className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
//           >
//             <Edit2 className="w-4 h-4" />
//             Change ID
//           </button>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           <div>
//             <label className="block text-sm text-gray-400 mb-2">
//               New Profile ID (8-12 alphanumeric characters)
//             </label>
//             <input
//               type="text"
//               value={newId}
//               onChange={(e) => {
//                 setNewId(e.target.value);
//                 setError("");
//               }}
//               className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
//               placeholder="e.g., MyNewID123"
//               maxLength={12}
//             />
//             {error && (
//               <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
//                 <AlertCircle className="w-4 h-4" />
//                 <span>{error}</span>
//               </div>
//             )}
//           </div>
          
//           <div className="flex gap-2">
//             <button
//               onClick={handleSave}
//               disabled={isLoading || newId === currentId}
//               className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
//             >
//               <Check className="w-4 h-4" />
//               {isLoading ? "Saving..." : "Save"}
//             </button>
//             <button
//               onClick={handleCancel}
//               disabled={isLoading}
//               className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
//             >
//               <X className="w-4 h-4" />
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProfileIdManager;


/**
 * ProfileIdManager Component
 * 
 * Allows users to change their public profile ID with validation
 */

import { useState } from "react";
import { Edit2, Check, X, AlertCircle } from "lucide-react";
import { changeProfileId } from "../../api/profile";
import toast from "react-hot-toast";

const ProfileIdManager = ({ currentId, onIdChanged }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newId, setNewId] = useState(currentId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateId = (id) => {
    const regex = /^[a-zA-Z0-9]{8,12}$/;
    if (!regex.test(id)) {
      return "ID must be 8-12 alphanumeric characters";
    }
    return "";
  };

  const handleSave = async () => {
    const validationError = validateId(newId);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await changeProfileId(newId);
      toast.success("Profile ID updated successfully!");
      setIsEditing(false);
      if (onIdChanged) {
      const [profile, setProfile] = useState({ id: currentId }); // Initialize profile state
        onIdChanged(newId);
      }
      // Redirect to new profile URL
      setTimeout(() => {
        window.location.href = `/profile/${newId}`;
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update profile ID";
      setError(errorMsg);
      const loading = isLoading; // Use loading state for profile loading
      if (loading) {
        return <div className="profile-id-manager-loading">Loading profile...</div>;
      }
      const safeProfile = {
        id: profile?.id ?? "N/A",
        // ...add other fields as needed...
      };
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewId(currentId);
    setError("");
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-3">Profile ID</h3>
      
      {!isEditing ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Your profile URL:</p>
            <code className="text-emerald-400 bg-gray-900 px-3 py-1 rounded">
              /profile/{currentId}
            </code>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Change ID
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              New Profile ID (8-12 alphanumeric characters)
            </label>
            <input
              type="text"
              value={newId}
              onChange={(e) => {
                setNewId(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g., MyNewID123"
              maxLength={12}
            />
            {error && (
              <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading || newId === currentId}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              {isLoading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileIdManager;
