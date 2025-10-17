'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search, Grid3X3, List, Package } from 'lucide-react'
import offlineProductModel from '@/models/offlineProductModel'

export default function ProductGrid({
  productSearch,
  setProductSearch,
  filteredProducts,
  onProductSelect
}) {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchInputRef = useRef(null)
  const gridRef = useRef(null)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!filteredProducts.length) return

      const maxCols = viewMode === 'grid' ? 3 : 1
      const maxRows = Math.ceil(filteredProducts.length / maxCols)

      switch (e.key) {
        case 'ArrowRight':
          if (viewMode === 'grid') {
            e.preventDefault()
            setSelectedIndex(prev => 
              prev < filteredProducts.length - 1 ? prev + 1 : prev
            )
          }
          break
        case 'ArrowLeft':
          if (viewMode === 'grid') {
            e.preventDefault()
            setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (viewMode === 'grid') {
            setSelectedIndex(prev => {
              const newIndex = prev + maxCols
              return newIndex < filteredProducts.length ? newIndex : prev
            })
          } else {
            setSelectedIndex(prev => 
              prev < filteredProducts.length - 1 ? prev + 1 : prev
            )
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (viewMode === 'grid') {
            setSelectedIndex(prev => {
              const newIndex = prev - maxCols
              return newIndex >= 0 ? newIndex : prev
            })
          } else {
            setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
          }
          break
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
            e.preventDefault()
            const product = filteredProducts[selectedIndex]
            onProductSelect(product.sku || product.id.toString())
            setSelectedIndex(-1)
          }
          break
        case 'Escape':
          setSelectedIndex(-1)
          searchInputRef.current?.focus()
          break
      }
    }

    if (selectedIndex >= 0) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedIndex, filteredProducts, viewMode, onProductSelect])

  // Focus management
  const handleSearchFocus = () => {
    setSelectedIndex(-1)
  }

  const handleProductClick = (product, index) => {
    setSelectedIndex(index)
    onProductSelect(product.sku || product.id.toString())
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown' && filteredProducts.length > 0) {
      e.preventDefault()
      setSelectedIndex(0)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Quick Select
          <Badge variant="secondary" className="ml-2">
            {filteredProducts.length} items
          </Badge>
        </Label>
        
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={searchInputRef}
          type="text"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          onFocus={handleSearchFocus}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search products by name, SKU, or ID..."
          className="pl-10 mb-3"
        />
      </div>

      {/* Product Grid/List */}
      <ScrollArea className="h-48" ref={gridRef}>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No products found</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-2">
            {filteredProducts.map((product, index) => (
              <Button
                key={product.id}
                variant={selectedIndex === index ? 'default' : 'outline'}
                className={`h-20 p-2 flex flex-col items-center justify-center text-xs transition-all duration-200 ${
                  selectedIndex === index 
                    ? 'ring-2 ring-blue-500 scale-105' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleProductClick(product, index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={`font-bold text-xs mb-1 ${
                  selectedIndex === index 
                    ? 'text-white' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {product.sku || product.id}
                </div>
                <div className={`text-xs truncate w-full text-center leading-tight ${
                  selectedIndex === index 
                    ? 'text-white' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {product.name.substring(0, 12)}
                </div>
                <div className={`text-xs font-semibold mt-1 ${
                  selectedIndex === index 
                    ? 'text-white' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  LKR {parseFloat(product.price || 0).toFixed(2)}
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredProducts.map((product, index) => (
              <Button
                key={product.id}
                variant={selectedIndex === index ? 'default' : 'outline'}
                className={`w-full h-14 p-3 flex items-center justify-between text-sm transition-all duration-200 ${
                  selectedIndex === index 
                    ? 'ring-2 ring-blue-500 scale-[1.02]' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleProductClick(product, index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex flex-col items-start flex-1">
                  <div className={`font-bold text-sm ${
                    selectedIndex === index 
                      ? 'text-white' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {product.name}
                  </div>
                  <div className={`text-xs ${
                    selectedIndex === index 
                      ? 'text-white opacity-90' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    SKU: {product.sku || product.id}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`font-bold text-sm ${
                    selectedIndex === index 
                      ? 'text-white' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    LKR {parseFloat(product.price || 0).toFixed(2)}
                  </div>
                  <div className={`text-xs ${
                    selectedIndex === index 
                      ? 'text-white opacity-90' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Stock: {product.available_quantity || 0}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Keyboard Shortcuts Help */}
      {selectedIndex >= 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <strong>Shortcuts:</strong> ↑↓←→ Navigate • Enter Select • Esc Cancel
        </div>
      )}
    </div>
  )
}
