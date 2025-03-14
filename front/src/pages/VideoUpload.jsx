import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_ALL_CATEGORIES } from "../graphql/categoriesQueries";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";

function VideoUpload() {
  const { user } = useAuth();
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public'); // default to public
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailError, setThumbnailError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormComplete, setIsFormComplete] = useState(false);

  // Category states
  const [parentCategory, setParentCategory] = useState(""); // Parent selection
  const [secondLevelCategories, setSecondLevelCategories] = useState([]);
  const [thirdLevelCategories, setThirdLevelCategories] = useState([]);
  const [secondCategory, setSecondCategory] = useState(""); // Single selection
  const [thirdCategories, setThirdCategories] = useState([]); // Multi-selection

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    // Fetch categories
    const { data, loading, error } = useQuery(GET_ALL_CATEGORIES);

  useEffect(() => {
    if (user && user.id) {
      setUserId(user.id);
    }
  }, [user]);

  // Process categories when data is available
  useEffect(() => {
    if (loading || error || !data) return;

    setSecondLevelCategories([]); // Reset when new categories load
    setThirdLevelCategories([]);
  }, [data, loading, error]);

  // Update second-level categories when the parent changes
  useEffect(() => {
    if (!data || !parentCategory) return;

    const selectedParentCategory = data.getAllCategories.find((cat) => cat.name === parentCategory);
    setSecondLevelCategories(selectedParentCategory?.subcategories || []);
    setSecondCategory(""); // Reset second-level selection
    setThirdLevelCategories([]);
    setThirdCategories([]); // Reset third-level selections
  }, [parentCategory, data]);

    // Update third-level categories when second category changes
    useEffect(() => {
      if (!secondCategory) {
        setThirdLevelCategories([]);
        setThirdCategories([]); // Reset third-level selection
        return;
      }
  
      const selectedSecondCategory = secondLevelCategories.find((cat) => cat.id === secondCategory);
      setThirdLevelCategories(selectedSecondCategory?.subcategories || []);
    }, [secondCategory, secondLevelCategories]);

  // Check if all fields are filled in
  useEffect(() => {
    if (
      userId &&
      title &&
      description &&
      visibility &&
      videoFile &&
      thumbnailFile &&
      !thumbnailError &&
      secondCategory
    ) {
      setIsFormComplete(true);
    } else {
      setIsFormComplete(false);
    }
  }, [userId, title, description, visibility, videoFile, thumbnailFile, thumbnailError, secondCategory]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const { width, height } = img;
      if (Math.abs(width / height - 16 / 9) < 0.01) {
        setThumbnailFile(file);
        setThumbnailError('');
      } else {
        setThumbnailError('Thumbnail must be 16:9 aspect ratio.');
      }
    };
  };

  const handleVideoChange = (e) => {
    if (e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormComplete) return; // Prevent submission if form isn't complete

    setIsUploading(true);
    setUploadStatus(null); 

    const selectedCategoryIds = [
      parentCategory,
      secondCategory,
      ...thirdCategories,
    ].filter(Boolean);

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('visibility', visibility);
    formData.append('video', videoFile);
    formData.append('thumbnail', thumbnailFile);
    formData.append("category_ids", JSON.stringify(selectedCategoryIds));

    try {
      await axios.post(`${BACKEND_URL}/api/videos/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus("success");
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
      setParentCategory("");
      setSecondCategory("");
      setThirdCategories([]);
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(error.response?.data?.message || "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Upload Video</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold">Title</label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 mt-1 bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold">Description</label>
            <textarea
              name="description"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 mt-1 bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

                    {/* Parent Category (Locked) */}
                    <div>
            <label className="block text-gray-400 text-sm font-semibold">Main Category</label>
            <select
              value={parentCategory}
              onChange={(e) => setParentCategory(e.target.value)}
              className="w-full p-2 mt-1 bg-gray-800 rounded-md border border-gray-700"
              required
            >
              <option value="">Select a main category</option>
              {data?.getAllCategories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Second Category Dropdown (Single selection) */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold">Category</label>
            <select
              value={secondCategory}
              onChange={(e) => setSecondCategory(e.target.value)}
              className="w-full p-2 mt-1 bg-gray-800 rounded-md border border-gray-700"
              required
            >
              <option value="">Select a category</option>
              {secondLevelCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Third Category Dropdown (Multiple selection) */}
{thirdLevelCategories.length > 0 && (
  <div>
    <label className="block text-gray-400 text-sm font-semibold">Subcategories</label>
    <div className="grid grid-cols-2 gap-2 mt-2">
      {thirdLevelCategories.map((category) => (
        <div
          key={category.id}
          className={`cursor-pointer p-2 rounded-md border ${
            thirdCategories.includes(category.id) ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-300"
          } hover:bg-blue-500 transition`}
          onClick={() => {
            setThirdCategories((prev) =>
              prev.includes(category.id)
                ? prev.filter((id) => id !== category.id) // Remove if already selected
                : [...prev, category.id] // Add if not selected
            );
          }}
        >
          {category.name}
        </div>
      ))}
    </div>
  </div>
)}



          {/* Visibility Dropdown */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold">Visibility</label>
            <select
              name="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full p-2 mt-1 bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

                    {/* Video File Upload */}
                    <div>
            <label className="block text-gray-400 text-sm font-semibold">Video File</label>
            <label className="flex items-center justify-center w-full p-3 mt-1 bg-gray-700 rounded-md border border-gray-600 cursor-pointer hover:bg-gray-600 transition">
              <span>{videoFile ? videoFile.name : 'Choose File'}</span>
              <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
            </label>
          </div>

          {/* Thumbnail File Upload */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold">Thumbnail (16:9)</label>
            <label className="flex items-center justify-center w-full p-3 mt-1 bg-gray-700 rounded-md border border-gray-600 cursor-pointer hover:bg-gray-600 transition">
              <span>{thumbnailFile ? thumbnailFile.name : 'Choose File'}</span>
              <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
            </label>
            {thumbnailError && <p className="text-red-500 text-sm mt-2">{thumbnailError}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full p-3 text-white font-semibold rounded-md transition duration-300 ${
              isFormComplete
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
            disabled={!isFormComplete}
          >
            Upload Video
          </button>
        </form>
      </div>

      {/* Uploading Popup */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded-lg text-center">
            <div className="loader animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Uploading Video...</p>
          </div>
        </div>
      )}

      {/* Upload Success Popup */}
      {uploadStatus === 'success' && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded-lg text-center">
            <p className="text-green-400 text-lg font-semibold">Video Uploaded Successfully!</p>
            <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md" onClick={() => setUploadStatus(null)}>OK</button>
          </div>
        </div>
      )}

      {/* Upload Error Popup */}
      {uploadStatus === 'error' && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded-lg text-center">
            <p className="text-red-500 text-lg font-semibold">Something Went Wrong</p>
            <p className="text-gray-300 mt-2">{errorMessage}</p>
            <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md" onClick={() => setUploadStatus(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoUpload;
