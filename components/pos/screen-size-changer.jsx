'use client'

import React, { useState, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ScreenSizeChanger() {
  const [zoom, setZoom] = useState(100)
  const [isOpen, setIsOpen] = useState(false)

  // Initialize zoom from localStorage
  useEffect(() => {
    const savedZoom = localStorage.getItem('pos-zoom')
    if (savedZoom) {
      const zoomLevel = parseInt(savedZoom)
      setZoom(zoomLevel)
      applyZoom(zoomLevel)
    }
  }, [])

  const applyZoom = (level) => {
    document.documentElement.style.fontSize = `${(level / 100) * 16}px`
    document.body.style.transform = `scale(${level / 100})`
    document.body.style.transformOrigin = 'top left'
    document.body.style.width = `${100 / (level / 100)}%`
  }

  const handleZoom = (direction) => {
    let newZoom = zoom
    if (direction === 'in') {
      newZoom = Math.min(zoom + 10, 200)
    } else if (direction === 'out') {
      newZoom = Math.max(zoom - 10, 80)
    }
    
    setZoom(newZoom)
    applyZoom(newZoom)
    localStorage.setItem('pos-zoom', newZoom)
  }

  const handleReset = () => {
    setZoom(100)
    applyZoom(100)
    localStorage.setItem('pos-zoom', '100')
  }

  return (
    <div className="relative">
      {/* Main Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        title="Screen Size Controls"
        className="flex items-center gap-2"
      >
        <ZoomIn className="h-4 w-4" />
        <span className="text-xs font-medium">{zoom}%</span>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 min-w-[180px]">
          {/* Zoom Controls */}
          <div className="space-y-3">
            {/* Zoom Slider */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Zoom Level
              </label>
              <input
                type="range"
                min="80"
                max="200"
                step="10"
                value={zoom}
                onChange={(e) => {
                  const newZoom = parseInt(e.target.value)
                  setZoom(newZoom)
                  applyZoom(newZoom)
                  localStorage.setItem('pos-zoom', newZoom)
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>80%</span>
                <span className="font-bold">{zoom}%</span>
                <span>200%</span>
              </div>
            </div>

            <hr className="dark:border-gray-700" />

            {/* Quick Buttons */}
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleZoom('in')}
                className="w-full flex items-center justify-center gap-2"
                title="Increase zoom (Ctrl++)"
              >
                <ZoomIn className="h-4 w-4" />
                Zoom In
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleZoom('out')}
                className="w-full flex items-center justify-center gap-2"
                title="Decrease zoom (Ctrl+-)"
              >
                <ZoomOut className="h-4 w-4" />
                Zoom Out
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2"
                title="Reset to default (Ctrl+0)"
              >
                <RotateCcw className="h-4 w-4" />
                Reset (100%)
              </Button>
            </div>

            <hr className="dark:border-gray-700" />

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Quick Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[80, 100, 120, 140, 160, 200].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setZoom(preset)
                      applyZoom(preset)
                      localStorage.setItem('pos-zoom', preset)
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                      zoom === preset
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            <hr className="dark:border-gray-700" />

            {/* Help Text */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">+</kbd> to zoom in</p>
              <p><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">−</kbd> to zoom out</p>
              <p><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">0</kbd> to reset</p>
            </div>
          </div>
        </div>
      )}

      {/* Close on click outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
