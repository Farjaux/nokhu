import React, { useState } from 'react';
import VideoSection from '../components/VideoSection';
import GenreList from '../components/GenreList';
import CategoryList from '../components/CategoryList';

const VideoFeed = () => {
  const [selectedParentCategory, setSelectedParentCategory] = useState('60ace37f-e8dd-4872-b5f8-02e448b4a8c4'); // Default to Adventure
  const [selectedSubcategory, setSelectedSubcategory] = useState('All'); // Default to All

  // Handle Category Selection
  const handleCategorySelect = (parentCategoryId) => {
    setSelectedParentCategory(parentCategoryId);
    setSelectedSubcategory('All'); // Reset subcategory to All when switching parent
  };

  // Handle Subcategory Selection
  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
  };

  return (
    <div className="bg-black min-h-screen flex flex-col space-y-2">
      {/* Category List */}
      <CategoryList 
        selectedParentCategory={selectedParentCategory} 
        onCategorySelect={handleCategorySelect} 
      />

      {/* Genre List */}
      <GenreList 
        parentCategory={selectedParentCategory} 
        selectedGenre={selectedSubcategory} 
        onGenreSelect={handleSubcategorySelect} 
      />

      {/* Video Sections - Pass Selected Parent & Subcategory */}
      <VideoSection 
        title="Featured" 
        parentCategoryId={selectedParentCategory} 
        subcategoryId={selectedSubcategory === 'All' ? null : selectedSubcategory} 
      />
      <VideoSection 
        title="For You" 
        parentCategoryId={selectedParentCategory} 
        subcategoryId={selectedSubcategory === 'All' ? null : selectedSubcategory} 
      />
      <VideoSection 
        title="Recently Added" 
        parentCategoryId={selectedParentCategory} 
        subcategoryId={selectedSubcategory === 'All' ? null : selectedSubcategory} 
      />
      <VideoSection 
        title="Most Played" 
        parentCategoryId={selectedParentCategory} 
        subcategoryId={selectedSubcategory === 'All' ? null : selectedSubcategory} 
      />
    </div>
  );
};

export default VideoFeed;
