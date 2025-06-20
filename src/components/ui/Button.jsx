import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  // Track if button was clicked to prevent multiple submissions
  const [wasClicked, setWasClicked] = React.useState(false);
  
  // Auto-reset click state after timeout (safety measure)
  React.useEffect(() => {
    let timer;
    if (wasClicked) {
      timer = setTimeout(() => {
        console.log('Auto-resetting button click state after timeout');
        setWasClicked(false);
      }, 10000); // 10 second safety timeout
    }
    return () => clearTimeout(timer);
  }, [wasClicked]);
  
  // Reset click state when loading state changes to false
  React.useEffect(() => {
    if (!loading && wasClicked) {
      console.log('Resetting button click state as loading finished');
      setWasClicked(false);
    }
  }, [loading, wasClicked]);
  
  // Ultra-robust click event handler with debugging
  const handleClick = (e) => {
    console.log(`Button clicked: type=${type}, disabled=${disabled}, loading=${loading}, wasClicked=${wasClicked}`);
    
    // Prevent action if button is in loading, disabled, or was already clicked
    if (loading || disabled || wasClicked) {
      console.log('Button click ignored - button is in loading, disabled, or was already clicked');
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // For submit buttons, mark as clicked to prevent multiple submissions
    if (type === 'submit') {
      console.log('Setting wasClicked to true for submit button');
      setWasClicked(true);
    }
    
    // Execute click handler with error protection
    if (onClick) {
      try {
        onClick(e);
      } catch (error) {
        console.error('Error in button click handler:', error);
        // Reset click state on error
        setWasClicked(false);
        // Show error toast if available
        if (window.toast && window.toast.error) {
          window.toast.error('Une erreur est survenue');
        }
      }
    }
  };
  // Define variant styles
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-indigo-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
  };
  
  // Combine all classes
  const buttonClasses = `
    inline-flex items-center justify-center px-4 py-2 border border-transparent
    text-sm font-medium rounded-md shadow-sm
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors duration-200 ease-in-out
    ${variants[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;