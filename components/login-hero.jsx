"use client"

export default function LoginHero() {
  return (
    <div className="flex w-full lg:w-1/2 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L40 20 L50 15 L45 30 L55 40 L40 45 L35 55 L25 50 L15 55 L10 40 L0 35 L5 20 L10 10 L20 15 L30 10 Z' fill='none' stroke='%23059669' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Logo/Image - Centered */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12">
        <div className="max-w-sm w-full flex items-center justify-center">
          <img
            src="/assets/logo.png"
            alt="Green Plus Agro"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
    </div>
  )
}
