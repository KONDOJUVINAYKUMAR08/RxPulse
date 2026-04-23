export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-3 border-[#E8F5E9] border-t-[#2D6A4F] rounded-full animate-spin`}
        style={{ borderWidth: '3px' }} />
      {text && <p className="text-sm text-[#6B7280] font-medium">{text}</p>}
    </div>
  );
}
