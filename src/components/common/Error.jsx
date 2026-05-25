export default function ErrorComponent({ message }) {
  return (
    <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-red-800">Unable to load data</h3>
        <p className="text-xs text-red-600 mt-0.5">
          {message || "Something went wrong. Please try again later."}
        </p>
      </div>
    </div>
  )
}