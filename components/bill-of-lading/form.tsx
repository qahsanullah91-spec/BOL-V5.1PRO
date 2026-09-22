"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BilingualField } from "./form-field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function BillOfLadingForm() {
  return (
    <div className="space-y-6">
      {/* Document Reference */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BilingualField
              labelEn="Bill of Lading No."
              labelFa="شماره بارنامه"
              id="bolNumber"
              placeholder="BOL-2024-XXXX"
            />
            <BilingualField
              labelEn="Date"
              labelFa="تاریخ"
              id="date"
              type="date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parties Information */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4">
            <BilingualField
              labelEn="Shipper / Exporter"
              labelFa="فرستنده"
              id="shipper"
              type="textarea"
              placeholder="Name and address of the shipper..."
            />
            <BilingualField
              labelEn="Consignee"
              labelFa="گیرنده"
              id="consignee"
              type="textarea"
              placeholder="Name and address of the consignee..."
            />
            <BilingualField
              labelEn="Notify Party"
              labelFa="طرف اطلاع‌رسانی"
              id="notifyParty"
              type="textarea"
              placeholder="Party to be notified..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Details */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BilingualField
              labelEn="Vessel"
              labelFa="کشتی"
              id="vessel"
              placeholder="Vessel name"
            />
            <BilingualField
              labelEn="Voyage"
              labelFa="سفر"
              id="voyage"
              placeholder="Voyage number"
            />
            <BilingualField
              labelEn="Port of Loading"
              labelFa="بندر بارگیری"
              id="portOfLoading"
              placeholder="Loading port"
            />
            <BilingualField
              labelEn="Port of Discharge"
              labelFa="بندر تخلیه"
              id="portOfDischarge"
              placeholder="Discharge port"
            />
            <BilingualField
              labelEn="Place of Receipt"
              labelFa="محل دریافت"
              id="placeOfReceipt"
              placeholder="Receipt location"
            />
            <BilingualField
              labelEn="Place of Delivery"
              labelFa="محل تحویل"
              id="placeOfDelivery"
              placeholder="Delivery location"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cargo Details */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4">
            <BilingualField
              labelEn="Description of Goods"
              labelFa="شرح کالا"
              id="description"
              type="textarea"
              placeholder="Detailed description of goods..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <BilingualField
                labelEn="Number of Packages"
                labelFa="تعداد بسته‌ها"
                id="packages"
                placeholder="0"
              />
              <BilingualField
                labelEn="Weight (kg)"
                labelFa="وزن"
                id="weight"
                placeholder="0.00"
              />
              <BilingualField
                labelEn="Measurement (m³)"
                labelFa="حجم"
                id="measurement"
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Freight Terms */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Freight Terms</span>
              <span className="text-sm font-medium text-foreground" dir="rtl">شرایط کرایه</span>
            </div>
            <RadioGroup defaultValue="prepaid" className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prepaid" id="prepaid" />
                <Label htmlFor="prepaid" className="text-sm">
                  <span>Prepaid</span>
                  <span className="text-muted-foreground ml-2" dir="rtl">کرایه پرداخته شده</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="collect" id="collect" />
                <Label htmlFor="collect" className="text-sm">
                  <span>Collect</span>
                  <span className="text-muted-foreground ml-2" dir="rtl">کرایه در مقصد</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Signature Area */}
      <Card className="border-primary/20 border-dashed border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-center flex-1">
              <div className="border-b border-border w-48 mx-auto mb-2 h-16"></div>
              <p className="text-sm font-medium text-foreground">Signature & Stamp</p>
              <p className="text-sm text-muted-foreground" dir="rtl">امضا و مهر شرکت</p>
            </div>
            <div className="text-center flex-1">
              <div className="border-b border-border w-48 mx-auto mb-2 h-16"></div>
              <p className="text-sm font-medium text-foreground">Date</p>
              <p className="text-sm text-muted-foreground" dir="rtl">تاریخ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
