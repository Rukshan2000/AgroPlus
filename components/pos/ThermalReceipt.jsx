'use client'

import React from 'react'

export default function ThermalReceipt({ cart, saleId, paymentDetails, billDiscount = 0 }) {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const billDiscountAmount = (subtotal * billDiscount) / 100
  const total = subtotal - billDiscountAmount
  const currentDate = new Date()

  return (
    <div 
      id="thermal-receipt" 
      style={{
        width: '80mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '14px',
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
        {/* Logo */}
        <div style={{ marginBottom: '3mm', display: 'flex', justifyContent: 'center' }}>
          <img
            src={`${process.env.NEXT_PUBLIC_APP_URL || ''}/assets/logo.png`}
            alt="Green Plus Agro"
            style={{
              width: '40mm',
              height: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
            onError={(e) => {
              console.error('Logo failed to load:', e.target.src)
              // Try without NEXT_PUBLIC_APP_URL if it failed with it
              if (process.env.NEXT_PUBLIC_APP_URL && e.target.src.startsWith(process.env.NEXT_PUBLIC_APP_URL)) {
                e.target.src = '/assets/logo.png'
                return
              }
              e.target.style.display = 'none'
            }}
          />
        </div>

        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          Tel: +94 77 236 5879
        </div>
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          www.greenplusagro.lk
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed black', margin: '3mm 0' }}></div>

      {/* Sale Info */}
      <div style={{ fontSize: '12px', marginBottom: '3mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
          <span>Bill Number:</span>
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
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '1mm' }}>
              {item.name}
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '12px',
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
        <div style={{ fontSize: '13px', marginBottom: '3mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
            <span>Subtotal:</span>
            <span>LKR {subtotal.toFixed(2)}</span>
          </div>
          {billDiscount > 0 && (
            <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '2mm',
          color: 'black'
            }}>
          <span>Bill Discount ({billDiscount}%):</span>
          <span>-LKR {billDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '16px',
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

      {/* Payment Details */}
      {paymentDetails && (
        <div style={{ fontSize: '13px', marginBottom: '3mm' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '1mm',
            fontWeight: 'bold'
          }}>
            <span>Payment Method:</span>
            <span style={{ textTransform: 'uppercase' }}>{paymentDetails.method}</span>
          </div>
          {paymentDetails.method === 'cash' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
                <span>Amount Paid:</span>
                <span>LKR {paymentDetails.amount_paid.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Change:</span>
                <span>LKR {paymentDetails.change.toFixed(2)}</span>
              </div>
            </>
          )}
          <div style={{ borderTop: '1px dashed black', margin: '2mm 0' }}></div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '13px',
        marginTop: '5mm',
        lineHeight: '1.6'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>
          Thank You!
        </div>
        <div style={{ fontSize: '12px' }}>
          Please Come Again
        </div>
        <div style={{ fontSize: '11px', marginTop: '3mm', fontStyle: 'italic' }}>
          Your satisfaction is our priority
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ marginTop: '10mm' }}></div>
    </div>
  )
}
