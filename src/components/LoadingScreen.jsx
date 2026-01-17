import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <div className="flex flex-col items-center animate-pulse">
                {/* Branding */}
                <h1 className="text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2">
                    AstroDEV
                </h1>

                {/* Tagline */}
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mb-8">
                    Empowering Your Inventory
                </p>

                {/* Loading Indicator */}
                <div className="w-16 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-8">
                    <div className="h-full bg-blue-600 dark:bg-blue-400 w-1/2 animate-[shimmer_1.5s_infinite] rounded-full"></div>
                </div>

                {/* Contact Info */}
                <div className="absolute bottom-10 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Contact Support
                    </p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        rehanali09742@gmail.com
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
        </div>
    );
};

export default LoadingScreen;
