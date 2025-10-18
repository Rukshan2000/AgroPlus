'use client'

import React from 'react'

export default function ThermalReceipt({ cart, saleId }) {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax
  const currentDate = new Date()

  return (
    <div 
      id="thermal-receipt" 
      style={{
        width: '80mm',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '10mm',
        margin: '0 auto',
        marginLeft: '5mm',
        marginRight: '5mm',
        backgroundColor: 'white',
        color: 'black'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '2mm' }}>
          AGROPLUS
        </div>
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          Farm Fresh Products & Supplies
        </div>
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          Tel: +94 XX XXX XXXX
        </div>
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          www.agroplus.lk
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed black', margin: '3mm 0' }}></div>

      {/* Sale Info */}
      <div style={{ fontSize: '10px', marginBottom: '3mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
          <span>Sale ID:</span>
          <span style={{ fontWeight: 'bold' }}>{saleId || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
          <span>Date:</span>
          <span>{currentDate.toLocaleDateString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Time:</span>
          <span>{currentDate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed black', margin: '3mm 0' }}></div>

      {/* Items */}
      <div style={{ marginBottom: '3mm' }}>
        {cart.map((item, index) => (
          <div key={index} style={{ marginBottom: '3mm' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '1mm' }}>
              {item.name}
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '10px',
              paddingLeft: '2mm'
            }}>
              <span>
                {item.quantity} x LKR {item.unitPrice.toFixed(2)}
                {item.discount > 0 && ` (-${item.discount}%)`}
              </span>
              <span style={{ fontWeight: 'bold' }}>
                LKR {item.total.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid black', margin: '3mm 0' }}></div>

      {/* Totals */}
      <div style={{ fontSize: '11px', marginBottom: '3mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
          <span>Subtotal:</span>
          <span>LKR {subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2mm' }}>
          <span>Tax (8%):</span>
          <span>LKR {tax.toFixed(2)}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '14px',
          fontWeight: 'bold',
          borderTop: '1px solid black',
          paddingTop: '2mm'
        }}>
          <span>TOTAL:</span>
          <span>LKR {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed black', margin: '3mm 0' }}></div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '11px',
        marginTop: '5mm',
        lineHeight: '1.6'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>
          Thank You!
        </div>
        <div style={{ fontSize: '10px' }}>
          Please Come Again
        </div>
        <div style={{ fontSize: '9px', marginTop: '3mm', fontStyle: 'italic' }}>
          Your satisfaction is our priority
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ marginTop: '10mm' }}></div>
    </div>
  )
}
