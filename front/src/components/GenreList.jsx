import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_SUBCATEGORIES } from '../graphql/categoriesQueries';

const GenreList = ({ parentCategory, selectedGenre, onGenreSelect }) => {
  const { loading, error, data } = useQuery(GET_SUBCATEGORIES, {
    variables: { id: parentCategory },
    skip: !parentCategory, // Don't run query until a parent category is selected
  });

  if (loading) return <p className="text-white">Loading genres...</p>;
  if (error) return <p className="text-red-500">Error loading genres</p>;

  const genres = data?.getCategory?.subcategories || [];

  return (
    <div className="pt-1 p-3">
      <div className="flex justify-center space-x-4">
        {/* "All" option always present */}
        <button
          className={`px-3 py-1 rounded-md text-sm text-white hover:bg-gray-700 ${
            selectedGenre === 'All' ? 'bg-gray-700' : 'bg-gray-800'
          }`}
          onClick={() => onGenreSelect('All')}
        >
          All
        </button>

        {/* Dynamic genres */}
        {genres.map((genre) => (
          <button
            key={genre.id}
            className={`px-3 py-1 rounded-md text-sm text-white hover:bg-gray-700 ${
              selectedGenre === genre.id ? 'bg-gray-700' : 'bg-gray-800'
            }`}
            onClick={() => onGenreSelect(genre.id)}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenreList;
