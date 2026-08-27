'use client'

import React, { useState } from 'react'
import { Keyboard, ChevronUp, ChevronDown, Hash, Type, AtSign } from 'lucide-react'

export default function VirtualKeyboard({
  onKeyPress,
  onEnter,
  onAdd,
  onClear,
  onDelete,
  onClearCart,
  isCartMode = false,
  isDiscountMode = false,
  discountModeType = null,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [keyboardMode, setKeyboardMode] = useState('numbers') // 'numbers', 'letters', 'symbols'
  const [isUpperCase, setIsUpperCase] = useState(false)

  // Keyboard layouts
  const layouts = {
    numbers: [
      ['7', '8', '9'],
      ['4', '5', '6'],
      ['1', '2', '3'],
      ['0', '00', '.']
    ],
    letters: [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BKSP'],
      ['SPACE']
    ],
    symbols: [
      ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
      ['-', '_', '=', '+', '[', ']', '{', '}', '|', '\\'],
      [':', ';', '"', "'", '<', '>', ',', '.', '?', '/'],
      ['~', '`', 'SPACE', 'BKSP']
    ]
  }

  const handleKeyClick = (key) => {
    if (key === 'SHIFT') {
      setIsUpperCase(!isUpperCase)
      return
    }
    if (key === 'BKSP') {
      onDelete?.()
      return
    }
    if (key === 'SPACE') {
      onKeyPress?.(' ')
      return
    }
    
    const outputKey = keyboardMode === 'letters' && !isUpperCase ? key.toLowerCase() : key
    onKeyPress?.(outputKey)
  }

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'numbers': return <Hash className="h-4 w-4" />
      case 'letters': return <Type className="h-4 w-4" />
      case 'symbols': return <AtSign className="h-4 w-4" />
      default: return null
    }
  }

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'numbers': return '123'
      case 'letters': return 'ABC'
      case 'symbols': return '#+=`'
      default: return ''
    }
  }

  return (
    <div className={`bg-gray-900 border-t-2 border-gray-700 ${className}`}>
      {/* Current Mode Indicator */}
      {(isCartMode || isDiscountMode) && (
        <div className="px-2 py-1 bg-blue-950 border-b border-blue-700 text-xs font-bold text-blue-300 text-center">
          {isDiscountMode ? (
            <span>
              💰 DISCOUNT MODE: <span className="text-yellow-400">{discountModeType === 'item' ? 'ITEM %' : 'BILL %'}</span> - Enter percentage and press ADD
            </span>
          ) : isCartMode ? (
            <span>📦 CART MODE - Enter quantity and press ADD</span>
          ) : null}
        </div>
      )}
      
      {/* Action Buttons - Always Visible */}
      <div className="p-1 grid grid-cols-4 gap-1 border-b-2 border-gray-700">
        <button
          onClick={onClear}
          className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-2 rounded-none border-2 border-red-900 text-base"
          title="Clear input"
        >
          CLR
        </button>
        <button
          onClick={onClearCart}
          className="bg-orange-700 hover:bg-orange-800 text-white font-bold py-3 px-2 rounded-none border-2 border-orange-900 text-sm"
          title="Clear cart"
        >
          CART
        </button>
        <button
          onClick={onAdd}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-2 rounded-none border-2 border-green-900 text-base"
          title={isCartMode ? 'Apply quantity' : 'Add to cart'}
        >
          ADD
        </button>
        <button
          onClick={onEnter}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-2 rounded-none border-2 border-blue-800 text-base"
          title={isCartMode ? 'Apply quantity' : 'Complete sale'}
        >
          ENT
        </button>
      </div>

      {/* Keyboard Toggle & Mode Switcher */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-800 border-b border-gray-700">
        {/* Mode Switcher Tabs */}
        <div className="flex gap-1">
          {['numbers', 'letters', 'symbols'].map((mode) => (
            <button
              key={mode}
              onClick={() => setKeyboardMode(mode)}
              className={`px-3 py-1.5 rounded-none text-xs font-bold flex items-center gap-1 border-2 transition-all ${
                keyboardMode === mode
                  ? 'bg-green-700 border-green-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {getModeIcon(mode)}
              <span>{getModeLabel(mode)}</span>
            </button>
          ))}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-none border-2 border-gray-600 text-xs font-bold"
        >
          <Keyboard className="h-4 w-4" />
          {isExpanded ? (
            <>
              <span>Hide</span>
              <ChevronDown className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>Show</span>
              <ChevronUp className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Keyboard Area - Collapsible */}
      {isExpanded && (
        <div className="p-1">
          {keyboardMode === 'numbers' ? (
            // Numeric Keypad - Compact Grid
            <div className="grid grid-cols-3 gap-1">
              {layouts.numbers.flat().map((key, index) => (
                <button
                  key={index}
                  onClick={() => handleKeyClick(key)}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-2 rounded-none border-2 border-gray-700 text-xl"
                >
                  {key}
                </button>
              ))}
            </div>
          ) : keyboardMode === 'letters' ? (
            // QWERTY Keyboard
            <div className="space-y-1">
              {layouts.letters.map((row, rowIndex) => (
                <div key={rowIndex} className={`flex gap-1 ${rowIndex === 1 ? 'px-3' : ''} justify-center`}>
                  {row.map((key, keyIndex) => {
                    const isSpecial = key === 'SHIFT' || key === 'BKSP' || key === 'SPACE'
                    const displayKey = key === 'SHIFT' ? (isUpperCase ? '⇧' : '⇪') : 
                                       key === 'BKSP' ? '⌫' : 
                                       key === 'SPACE' ? 'SPACE' :
                                       (isUpperCase ? key : key.toLowerCase())
                    
                    return (
                      <button
                        key={keyIndex}
                        onClick={() => handleKeyClick(key)}
                        className={`${
                          key === 'SPACE' 
                            ? 'flex-1 min-w-[200px]' 
                            : key === 'SHIFT' || key === 'BKSP'
                            ? 'w-14'
                            : 'w-9'
                        } ${
                          key === 'SHIFT' && isUpperCase
                            ? 'bg-green-700 border-green-500'
                            : key === 'BKSP'
                            ? 'bg-yellow-700 border-yellow-600'
                            : 'bg-gray-800 border-gray-700'
                        } hover:bg-gray-600 text-white font-bold py-3 rounded-none border-2 text-sm`}
                      >
                        {displayKey}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            // Symbols Keyboard
            <div className="space-y-1">
              {layouts.symbols.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 justify-center">
                  {row.map((key, keyIndex) => {
                    const isSpecial = key === 'BKSP' || key === 'SPACE'
                    const displayKey = key === 'BKSP' ? '⌫' : key === 'SPACE' ? 'SPACE' : key
                    
                    return (
                      <button
                        key={keyIndex}
                        onClick={() => handleKeyClick(key)}
                        className={`${
                          key === 'SPACE' 
                            ? 'flex-1 min-w-[120px]' 
                            : key === 'BKSP'
                            ? 'w-12 bg-yellow-700 border-yellow-600'
                            : 'w-9 bg-gray-800 border-gray-700'
                        } hover:bg-gray-600 text-white font-bold py-3 rounded-none border-2 text-sm`}
                      >
                        {displayKey}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Minimized State - Quick Access Numbers */}
      {!isExpanded && (
        <div className="p-1 flex gap-1 justify-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyClick(num)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded-none border-2 border-gray-700 text-sm"
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
