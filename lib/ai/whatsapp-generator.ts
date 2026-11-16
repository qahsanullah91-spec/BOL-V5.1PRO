/**
 * Sky Ariana AI Operations Assistant - WhatsApp Message Generator
 * Generates verified, professional business WhatsApp messages across 11 key logistics categories.
 * Strictly adheres to database grounding: never invents weights, dates, amounts, containers, or rates.
 */

import { SupportedLanguage, AIWhatsAppCard } from '@/lib/types/ai-assistant'

export type WhatsAppCategory =
  | 'SHIPMENT_UPDATE'
  | 'CONTAINER_LOCATION'
  | 'VESSEL_DEPARTURE_ARRIVAL'
  | 'ETA_ETD'
  | 'CUSTOMS_CLEARANCE'
  | 'DOCUMENT_REQUEST'
  | 'BL_CORRECTION'
  | 'PAYMENT_REMINDER'
  | 'INVOICE_PACKING_LIST'
  | 'CUSTOMER_COMMUNICATION'
  | 'TRUCK_BORDER_UPDATE'

export interface WhatsAppGeneratorParams {
  category?: WhatsAppCategory
  shipment?: any
  bol?: any
  invoice?: any
  language?: SupportedLanguage
  customNote?: string
  recipientPhone?: string
  recipientName?: string
}

export function generateWhatsAppMessageCard(params: WhatsAppGeneratorParams): AIWhatsAppCard {
  const {
    category = 'SHIPMENT_UPDATE',
    shipment,
    bol,
    invoice,
    language = 'EN',
    customNote,
    recipientPhone,
    recipientName,
  } = params

  const bRecord = bol || shipment || {}
  const bolNumber = bRecord.bol_number || bRecord.bolNumber || bRecord.referenceNumber || 'N/A'
  const containerNo =
    bRecord.container?.containerNumber ||
    bRecord.containerNumber ||
    (bRecord.containers && bRecord.containers[0]?.containerNumber) ||
    'N/A'
  const truckNo = bRecord.truck_number || bRecord.truckNumber || 'N/A'
  const driverName = bRecord.driver_name || bRecord.driverName || 'N/A'
  const driverPhone = bRecord.driver_contact || bRecord.driverPhone || ''
  const driverRent = bRecord.driver_rent || bRecord.driverRent || ''
  const customer =
    recipientName ||
    bRecord.consignee_name ||
    bRecord.receiverName ||
    bRecord.shipper_name ||
    bRecord.customerName ||
    'Valued Customer'
  const origin = bRecord.origin || 'Origin'
  const destination = bRecord.destination || 'Destination'
  const status = (bRecord.status || 'In Transit').replace(/_/g, ' ')
  const location = bRecord.currentLocation || bRecord.current_location || 'In Transit'
  const eta = bRecord.vessel?.eta || bRecord.eta || 'Pending confirmation'
  const etd = bRecord.vessel?.etd || bRecord.etd || 'Pending confirmation'
  const vesselName = bRecord.vessel?.vesselName || bRecord.vesselName || ''
  const cartons = bRecord.total_packages || bRecord.cartons || bRecord.packages || ''
  const grossWeight = bRecord.gross_weight || bRecord.grossWeight || ''
  const dateStr = new Date().toISOString().split('T')[0]

  let shortMsg = ''
  let detailedMsg = ''
  let cardTitle = ''

  // --------------------------------------------------------------------------
  // Categorized Templates
  // --------------------------------------------------------------------------
  switch (category) {
    case 'CONTAINER_LOCATION':
      cardTitle = 'Container Location Update'
      if (language === 'FA') {
        shortMsg = `📦 *پیگیری کانتینر: ${containerNo}*\n📍 موقعیت فعلی: *${location}*\n🚚 بارنامه: ${bolNumber}\nوضعیت: ${status}`
        detailedMsg =
          `📋 *اطلاعیه موقعیت کانتینر — شرکت بازرگانی اسکای آریانا*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📦 شماره کانتینر: *${containerNo}*\n` +
          `📄 شماره بارنامه: *${bolNumber}*\n` +
          `📍 موقعیت دقیق فعلی: *${location}*\n` +
          `🏁 مقصد نهایی: *${destination}*\n` +
          `⏱️ وضعیت ترانزیت: *${status}*\n` +
          (vesselName ? `🚢 کشتی / لاین: *${vesselName}*\n` : '') +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `برای هرگونه استعلام با بخش پشتیبانی اسکای آریانا در تماس باشید.`
      } else if (language === 'PS') {
        shortMsg = `📦 *د کانتینر موقعیت: ${containerNo}*\n📍 اوسنی ځای: *${location}*\n🚚 بارنامه: ${bolNumber}\nحالت: ${status}`
        detailedMsg =
          `📋 *د کانتینر د ځای خبرتیا — د اسکای آریانا شرکت*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📦 د کانتینر شمېره: *${containerNo}*\n` +
          `📄 د بارنامې شمېره: *${bolNumber}*\n` +
          `📍 اوسنی موقعیت: *${location}*\n` +
          `🏁 وروستی منزل: *${destination}*\n` +
          `⏱️ د ترانزیت حالت: *${status}*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `د لازیاتو معلوماتو لپاره له موږ سره اړیکه ونیسئ.`
      } else {
        shortMsg = `📦 *Container Update: ${containerNo}*\n📍 Current Location: *${location}*\n🚚 B/L: ${bolNumber}\nStatus: ${status}`
        detailedMsg =
          `📋 *SKY ARIANA LOGISTICS — CONTAINER TRACKING REPORT*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📦 Container No: *${containerNo}*\n` +
          `📄 B/L Reference: *${bolNumber}*\n` +
          `📍 Current Location: *${location}*\n` +
          `🏁 Destination: *${destination}*\n` +
          `⏱️ Transit Status: *${status}*\n` +
          (vesselName ? `🚢 Vessel / Line: *${vesselName}*\n` : '') +
          `📅 Date: ${dateStr}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Tracked securely via Sky Ariana Operations Tower.`
      }
      break

    case 'TRUCK_BORDER_UPDATE':
      cardTitle = 'Border Station & Truck Transit Update'
      if (language === 'FA') {
        shortMsg = `🚛 *گزارش موتر در مرز*\nبارنامه: *${bolNumber}*\nموتر: ${truckNo} (${driverName})\nموقعیت: *${location}*`
        detailedMsg =
          `🚚 *گزارش ترانزیت گمرک و موتر — شرکت اسکای آریانا*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📄 بارنامه: *${bolNumber}*\n` +
          `🚛 شماره موتر: *${truckNo}*\n` +
          `👤 نام راننده: *${driverName}*\n` +
          (driverPhone ? `📞 تماس راننده: *${driverPhone}*\n` : '') +
          `📍 گمرک / ایستگاه مرزی: *${location}*\n` +
          (cartons ? `📦 کارتن: ${cartons} | وزن: ${grossWeight} کیلوگرام\n` : '') +
          (driverRent ? `💰 کرایه راننده: *${driverRent}*\n` : '') +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `وضعیت ترخیص و عبور مرزی تحت نظارت مداوم است.`
      } else if (language === 'PS') {
        shortMsg = `🚛 *د پولې او موټر راپور*\nبارنامه: *${bolNumber}*\nموټر: ${truckNo} (${driverName})\nځای: *${location}*`
        detailedMsg =
          `🚚 *د پولې او ترانزیت راپور — اسکای آریانا لوجیستیک*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📄 بارنامه: *${bolNumber}*\n` +
          `🚛 د موټر شمېره: *${truckNo}*\n` +
          `👤 موټر چلوونکی: *${driverName}*\n` +
          `📍 د پولې ګمرک: *${location}*\n` +
          (driverRent ? `💰 د موټر کرایه: *${driverRent}*\n` : '') +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `د بار چلند د کنټرول لاندې دی.`
      } else {
        shortMsg = `🚛 *Border & Truck Update*\nB/L: *${bolNumber}*\nTruck: ${truckNo} (${driverName})\nLocation: *${location}*`
        detailedMsg =
          `🚚 *SKY ARIANA LOGISTICS — BORDER TRANSIT & TRUCK REPORT*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📄 B/L Number: *${bolNumber}*\n` +
          `🚛 Truck No: *${truckNo}*\n` +
          `👤 Driver: *${driverName}*\n` +
          (driverPhone ? `📞 Driver Contact: *${driverPhone}*\n` : '') +
          `📍 Border Station: *${location}*\n` +
          (cartons ? `📦 Package Count: ${cartons} | Gross Wt: ${grossWeight} KG\n` : '') +
          (driverRent ? `💰 Driver Rent: *${driverRent}*\n` : '') +
          `📅 Date: ${dateStr}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Customs clearance and cross-border transit in active progress.`
      }
      break

    case 'VESSEL_DEPARTURE_ARRIVAL':
    case 'ETA_ETD':
      cardTitle = 'Vessel & ETA/ETD Schedule Notice'
      if (language === 'FA') {
        shortMsg = `🚢 *اطلاعیه حرکت کشتی: ${vesselName || bolNumber}*\nETD: ${etd} | ETA: ${eta}\nمقصد: ${destination}`
        detailedMsg =
          `🚢 *اطلاعیه برنامه حرکت کشتی و بار دریایی — اسکای آریانا*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📄 بارنامه / کانتینر: *${bolNumber}* / *${containerNo}*\n` +
          `🚢 نام کشتی: *${vesselName || 'Declared Ocean Carrier'}*\n` +
          `🛫 تاریخ حرکت (ETD): *${etd}*\n` +
          `🛬 تاریخ تخمینی رسیدن (ETA): *${eta}*\n` +
          `⚓ بندر مقصد: *${destination}*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `تغییرات برنامه حرکت فوراً به اطلاع خواهد رسید.`
      } else {
        shortMsg = `🚢 *Vessel Schedule: ${vesselName || bolNumber}*\nETD: ${etd} | ETA: ${eta}\nDestination: ${destination}`
        detailedMsg =
          `🚢 *SKY ARIANA LOGISTICS — OCEAN VESSEL & ETA NOTICE*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📄 B/L / Container: *${bolNumber}* / *${containerNo}*\n` +
          `🚢 Vessel: *${vesselName || 'Ocean Carrier'}*\n` +
          `🛫 Est. Departure (ETD): *${etd}*\n` +
          `🛬 Est. Arrival (ETA): *${eta}*\n` +
          `⚓ Discharge Port: *${destination}*\n` +
          `📅 Date: ${dateStr}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Status monitored via Marine Traffic and port terminal feeds.`
      }
      break

    case 'CUSTOMS_CLEARANCE':
      cardTitle = 'Customs Clearance Notification'
      if (language === 'FA') {
        shortMsg = `🛃 *اطلاعیه ترخیص گمرکی*\nبارنامه: *${bolNumber}*\nگمرک: *${location}*\nوضعیت: در حال طی مراحل اسنادی`
        detailedMsg =
          `🛃 *گزارش تشریفات گمرکی — شرکت بازرگانی اسکای آریانا*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📄 بارنامه: *${bolNumber}*\n` +
          `📦 کانتینر / موتر: *${containerNo !== 'N/A' ? containerNo : truckNo}*\n` +
          `🏢 دفتر گمرکی: *${location}*\n` +
          `👤 مشتری: *${customer}*\n` +
          `📑 وضعیت اسناد: ترخیصیه و اظهارنامه گمرکی در حال بررسی\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `به محض صدور برگه خروج، بارگیری به سمت مقصد نهایی انجام خواهد شد.`
      } else {
        shortMsg = `🛃 *Customs Clearance Update*\nB/L: *${bolNumber}*\nCustoms: *${location}*\nStatus: Processing Clearance`
        detailedMsg =
          `🛃 *SKY ARIANA LOGISTICS — CUSTOMS CLEARANCE ADVISORY*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📄 B/L Reference: *${bolNumber}*\n` +
          `📦 Cargo Ref: *${containerNo !== 'N/A' ? containerNo : truckNo}*\n` +
          `🏢 Customs Port: *${location}*\n` +
          `👤 Client: *${customer}*\n` +
          `📑 Documentation Status: Formal customs declaration active\n` +
          `📅 Date: ${dateStr}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Our customs brokerage team is expediting clearance.`
      }
      break

    case 'DOCUMENT_REQUEST':
    case 'BL_CORRECTION':
      cardTitle = 'Shipping Document Request / Correction Notice'
      if (language === 'FA') {
        shortMsg = `📑 *درخواست تکمیل اسناد بارنامه: ${bolNumber}*\nلطفاً اسناد اعلام‌شده را جهت تکمیل پرونده ارسال فرمایید.`
        detailedMsg =
          `📑 *درخواست مدارک و تصحیح بارنامه — اسکای آریانا*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `احتراماً در خصوص محموله بارنامه شماره *${bolNumber}*:\n` +
          (customNote ? `• مورد نیاز: ${customNote}\n` : '') +
          `• لطفاً تصویر واضح پکینگ لیست نهایی و اینویس تجاری را جهت ترخیصیه ارائه فرمایید.\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `تشکر از همکاری به موقع شما.`
      } else {
        shortMsg = `📑 *Document Action Required: ${bolNumber}*\nPlease provide requested documents to proceed with customs clearance.`
        detailedMsg =
          `📑 *SKY ARIANA LOGISTICS — DOCUMENTATION & B/L NOTICE*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Dear *${customer}*,\n` +
          `Regarding your shipment under B/L *${bolNumber}*:\n` +
          (customNote ? `• Required Item: ${customNote}\n` : '') +
          `• Please provide the certified Commercial Invoice & Packing List to complete clearance formalities.\n` +
          `📅 Date: ${dateStr}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Prompt submission avoids port demurrage and border transit detention.`
      }
      break

    case 'PAYMENT_REMINDER':
    case 'INVOICE_PACKING_LIST':
      cardTitle = 'Payment & Financial Statement Reminder'
      const invNum = invoice?.invoice_number || invoice?.invoiceNumber || bRecord.invoiceNo || 'INV'
      const invAmt = invoice?.total_amount || invoice?.amount || bRecord.debit || ''
      const invCurr = invoice?.currency || bRecord.currency || 'USD'
      if (language === 'FA') {
        shortMsg = `💳 *یادآوری فاکتور: ${invNum}*\nمبلغ: *${invAmt} ${invCurr}*\nمربوط به بارنامه: ${bolNumber}`
        detailedMsg =
          `💳 *صورتحساب خدمات ترانزیت و باربری — اسکای آریانا*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `مشتری گرامی: *${customer}*\n` +
          `📄 شماره فاکتور: *${invNum}*\n` +
          `📦 بارنامه مربوطه: *${bolNumber}*\n` +
          `💰 مبلغ قابل تادیه: *${invAmt} ${invCurr}*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `لطفاً پس از واریز، رسید حواله یا فیش بانکی را جهت ثبت در حساب کاربری ارسال فرمایید.`
      } else {
        shortMsg = `💳 *Payment Reminder: ${invNum}*\nAmount: *${invAmt} ${invCurr}*\nB/L Reference: ${bolNumber}`
        detailedMsg =
          `💳 *SKY ARIANA LOGISTICS — FREIGHT INVOICE NOTIFICATION*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Dear *${customer}*,\n` +
          `📄 Invoice No: *${invNum}*\n` +
          `📦 B/L Reference: *${bolNumber}*\n` +
          `💰 Amount Payable: *${invAmt} ${invCurr}*\n` +
          `📅 Date: ${dateStr}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Please provide the bank transfer slip upon settlement to update your ledger account.`
      }
      break

    case 'SHIPMENT_UPDATE':
    case 'CUSTOMER_COMMUNICATION':
    default:
      cardTitle = 'Shipment Status & Tracking Update'
      if (language === 'FA') {
        shortMsg = `📦 *پیگیری بارنامه: ${bolNumber}*\nموقعیت: *${location}*\nوضعیت: ${status}`
        detailedMsg =
          `📋 *گزارش باربری شرکت بازرگانی اسکای آریانا*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `مشتری گرامی: *${customer}*\n` +
          `📦 شماره بارنامه: *${bolNumber}*\n` +
          (containerNo !== 'N/A' ? `🚢 شماره کانتینر: *${containerNo}*\n` : '') +
          (truckNo !== 'N/A' ? `🚛 شماره موتر: *${truckNo}* (${driverName})\n` : '') +
          `📍 موقعیت فعلی: *${location}*\n` +
          `🏁 مقصد نهایی: *${destination}*\n` +
          `⏱️ وضعیت: *${status}*\n` +
          (eta !== 'Pending confirmation' ? `🛬 تاریخ تخمینی ورود: *${eta}*\n` : '') +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `بار شما تحت نظارت مستقیم سیستم هوشمند Sky Ariana BOL-V5 قرار دارد.`
      } else if (language === 'PS') {
        shortMsg = `📦 *د بارنامې راپور: ${bolNumber}*\nځای: *${location}*\nحالت: ${status}`
        detailedMsg =
          `📋 *د باربری او ترانزیت راپور — اسکای آریانا لوجیستیک*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `دروند پېرودونکی: *${customer}*\n` +
          `📦 د بارنامې شمېره: *${bolNumber}*\n` +
          (truckNo !== 'N/A' ? `🚛 د موټر شمېره: *${truckNo}* (${driverName})\n` : '') +
          `📍 اوسنی موقعیت: *${location}*\n` +
          `🏁 وروستی منزل: *${destination}*\n` +
          `⏱️ حالت: *${status}*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `ستاسو بار په خوندي ډول د ترانزیت په حال کې دی.`
      } else {
        shortMsg = `📦 *Shipment Update: ${bolNumber}*\nLocation: *${location}*\nStatus: ${status}`
        detailedMsg =
          `📋 *SKY ARIANA LOGISTICS — OFFICIAL DISPATCH REPORT*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Dear *${customer}*,\n` +
          `📦 B/L Reference: *${bolNumber}*\n` +
          (containerNo !== 'N/A' ? `🚢 Container No: *${containerNo}*\n` : '') +
          (truckNo !== 'N/A' ? `🚛 Truck No: *${truckNo}* (${driverName})\n` : '') +
          `📍 Current Location: *${location}*\n` +
          `🏁 Final Destination: *${destination}*\n` +
          `⏱️ Transit Status: *${status}*\n` +
          (eta !== 'Pending confirmation' ? `🛬 ETA: *${eta}*\n` : '') +
          `📅 Date: ${dateStr}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Monitored live by AQ Companies Control Tower.`
      }
      break
  }

  const primaryMessage = detailedMsg
  const cleanPhone = (recipientPhone || driverPhone || '').replace(/[^0-9]/g, '')
  const waBase = cleanPhone ? `https://wa.me/${cleanPhone}` : `https://wa.me/`
  const waUrl = `${waBase}?text=${encodeURIComponent(primaryMessage)}`

  return {
    id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: cardTitle,
    category,
    bolNumber,
    truckNumber: truckNo !== 'N/A' ? truckNo : undefined,
    containerNumber: containerNo !== 'N/A' ? containerNo : undefined,
    phone: cleanPhone || undefined,
    message: primaryMessage,
    language,
    waUrl,
    shortVersion: shortMsg,
    detailedVersion: detailedMsg,
    currentVersion: 'detailed',
  }
}
