import React from 'react';
import PropTypes from 'prop-types';

const Loading = ({ size = 'md', fullPage = false }) => {
  // Size variants
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const spinnerClasses = `
    animate-spin rounded-full
    border-t-transparent border-solid
    border-indigo-600
    ${sizes[size]}
    border-4
  `;

  // For full page loading overlay
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="inline-flex">
            <div className={spinnerClasses}></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // For inline or component-specific loading
  return (
    <div className="flex items-center justify-center p-4">
      <div className={spinnerClasses}></div>
    </div>
  );
};

Loading.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  fullPage: PropTypes.bool,
};

export default Loading;