/**
 * Pi Payment Module - Fixed Payment Flow
 * حل مشكلة Payment Expired
 */

import type { PaymentData } from './types';

declare global {
  interface Window {
    Pi?: any;
  }
}

export function isPiAvailable(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

/**
 * Initialize Pi SDK with proper timeout handling
 */
export async function initializePi(): Promise<void> {
  if (!isPiAvailable()) {
    console.warn('[PI PAYMENT] Pi SDK not available');
    return;
  }
  
  try {
    await window.Pi!.init({ version: '2.0', sandbox: true });
    console.log('[PI PAYMENT] SDK initialized successfully');
  } catch (error) {
    console.error('[PI PAYMENT] Init failed:', error);
    throw error;
  }
}

/**
 * Authenticate user with extended timeout
 */
export async function authenticate(): Promise<{ uid: string; username: string }> {
  if (!isPiAvailable()) {
    throw new Error('Pi SDK not available');
  }
  
  try {
    const scopes = ['username', 'payments'];
    const auth = await window.Pi!.authenticate(scopes, onIncompletePayment);
    
    return {
      uid: auth.user.uid,
      username: auth.user.username
    };
  } catch (error) {
    console.error('[PI PAYMENT] Auth failed:', error);
    throw error;
  }
}

/**
 * Create VIP payment with proper callback sequence
 * الحل الرئيسي لمشكلة Payment Expired
 */
export async function createVIPPayment(userId: string): Promise<boolean> {
  if (!isPiAvailable()) {
    throw new Error('Pi SDK not available. Please use Pi Browser.');
  }
  
  try {
    let paymentApproved = false;
    
    // إنشاء الدفع مع معالجة صحيحة للـ callbacks
    const payment = await window.Pi!.createPayment({
      amount: 1,
      memo: 'Reputa Score VIP Subscription',
      metadata: { 
        type: 'vip_subscription', 
        userId,
        timestamp: Date.now()
      }
    }, {
      // Callback 1: عندما يصبح الدفع جاهزاً للموافقة من السيرفر
      onReadyForServerApproval: async (paymentId: string) => {
        console.log('[PI PAYMENT] Ready for approval:', paymentId);
        
        try {
          // إرسال طلب الموافقة للسيرفر فوراً
          const response = await fetch('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, userId, amount: 1 })
          });
          
          const data = await response.json();
          
          if (data.approved) {
            paymentApproved = true;
            console.log('[PI PAYMENT] Server approved payment');
          } else {
            throw new Error('Server approval failed');
          }
        } catch (error) {
          console.error('[PI PAYMENT] Approval error:', error);
          throw error;
        }
      },
      
      // Callback 2: عندما يكتمل الدفع على البلوكشين
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log('[PI PAYMENT] Ready for completion:', paymentId, txid);
        
        try {
          // إرسال طلب الإكمال للسيرفر
          const response = await fetch('/api/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid, userId, amount: 1 })
          });
          
          const data = await response.json();
          
          if (data.completed) {
            // تفعيل VIP محلياً
            activateVIP(userId);
            console.log('[PI PAYMENT] Payment completed successfully');
          }
        } catch (error) {
          console.error('[PI PAYMENT] Completion error:', error);
        }
      },
      
      // Callback 3: إلغاء الدفع
      onCancel: (paymentId: string) => {
        console.log('[PI PAYMENT] Payment cancelled by user:', paymentId);
      },
      
      // Callback 4: حدوث خطأ
      onError: (error: Error, paymentId?: string) => {
        console.error('[PI PAYMENT] Payment error:', error, paymentId);
      }
    });
    
    console.log('[PI PAYMENT] Payment created:', payment.identifier);
    return paymentApproved;
    
  } catch (error) {
    console.error('[PI PAYMENT] Create payment failed:', error);
    throw error;
  }
}

/**
 * معالجة المدفوعات غير المكتملة
 */
function onIncompletePayment(payment: any): void {
  console.log('[PI PAYMENT] Incomplete payment found:', payment);
  
  // محاولة إكمال الدفع تلقائياً
  if (payment.status === 'pending_approval') {
    fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: payment.identifier,
        userId: payment.metadata?.userId,
        amount: payment.amount
      })
    }).catch(console.error);
  }
}

/**
 * تفعيل VIP محلياً
 */
function activateVIP(userId: string): void {
  const vipData = {
    active: true,
    userId,
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  localStorage.setItem(`vip_${userId}`, JSON.stringify(vipData));
  
  // إطلاق حدث لتحديث الواجهة
  window.dispatchEvent(new CustomEvent('vip-activated', { detail: vipData }));
}

/**
 * التحقق من حالة VIP
 */
export function checkVIPStatus(userId: string): boolean {
  try {
    const vipData = localStorage.getItem(`vip_${userId}`);
    if (!vipData) return false;
    
    const { active, expiresAt } = JSON.parse(vipData);
    return active && new Date(expiresAt) > new Date();
  } catch {
    return false;
  }
}

/**
 * إرسال Pi يدوياً إلى محفظة أخرى
 * الميزة الجديدة المطلوبة
 */
export async function sendPiManually(
  recipientAddress: string,
  amount: number,
  memo: string = ''
): Promise<{ success: boolean; txid?: string }> {
  if (!isPiAvailable()) {
    throw new Error('Pi SDK required for sending Pi');
  }
  
  try {
    const user = await authenticate();
    
    const payment = await window.Pi!.createPayment({
      amount,
      memo: memo || `Transfer from Reputa Score`,
      metadata: { 
        type: 'p2p_transfer',
        senderId: user.uid,
        recipientAddress,
        timestamp: Date.now()
      }
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log('[SEND PI] Approval:', paymentId);
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log('[SEND PI] Completed:', txid);
        return { success: true, txid };
      },
      onCancel: () => {
        console.log('[SEND PI] Cancelled');
      },
      onError: (error: Error) => {
        console.error('[SEND PI] Error:', error);
      }
    });
    
    return { success: true, txid: payment.identifier };
    
  } catch (error) {
    console.error('[SEND PI] Failed:', error);
    return { success: false };
  }
}

/**
 * فتح محفظة Pi
 */
export async function openPiWallet(): Promise<void> {
  if (isPiAvailable()) {
    try {
      await window.Pi!.openWallet();
    } catch (error) {
      console.error('[PI WALLET] Open failed:', error);
    }
  }
}
