import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white shadow-md rounded-t-xl mx-2 mb-2 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} LLM Tutor. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
