export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black bg-opacity-90 dark:bg-opacity-90">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Spinner animation */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Initializing
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please wait while we load your session...
          </p>
        </div>
      </div>
    </div>
  );
}
