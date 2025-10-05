// app/page.tsx
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-800 dark:text-white">
          Your Self-Deployable Cloud Storage
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-600 dark:text-gray-300">
          Store your files securely using your own Telegram Bot and Channel. Free, unlimited (up to Telegram's limits), and under your control.
        </p>
        <div className="flex justify-center space-x-4">
          <a href="/login">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200">
              Get Started
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}