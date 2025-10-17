'use client'

import React from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function CartItem({
  item,
  index,
  onUpdateQuantity,
  onRemove
}) {
  const handleIncrementQuantity = () => {
    onUpdateQuantity(index, item.quantity + 1)
  }

  const handleDecrementQuantity = () => {
    onUpdateQuantity(index, item.quantity - 1)
  }

  const handleRemove = () => {
    onRemove(index)
  }

  return (
    <Card className="bg-gray-50 dark:bg-gray-800/50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{item.name}</h4>
            {item.variationName && (
              <Badge variant="outline" className="text-xs mb-1">
                {item.variationName}
              </Badge>
            )}
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              SKU: {item.sku || item.id}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              LKR {item.originalPrice.toFixed(2)} 
              {item.discount > 0 && (
                <span className="text-red-600 dark:text-red-400 font-semibold ml-1">
                  (-{item.discount}%)
                </span>
              )}
            </p>
          </div>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrementQuantity}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="px-3 py-1 text-lg">
              {item.quantity}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrementQuantity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-xl text-green-600 dark:text-green-400">
              LKR {item.total.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
