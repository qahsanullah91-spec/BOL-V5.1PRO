"use client"

import React from "react"
import {
  AfghanVehiclePlate,
  AfghanVehiclePlateProps,
  parseAfghanPlate,
  getProvinceInfo,
  getProvinceCode,
  normalizeProvinceName,
  convertToLatinDigits,
  convertToPersianDigits,
  AFGHAN_PLATE_LETTERS,
  type AfghanProvince,
  type ParsedAfghanPlate,
} from "./afghan-vehicle-plate"

export {
  AfghanVehiclePlate,
  parseAfghanPlate,
  getProvinceInfo,
  getProvinceCode,
  normalizeProvinceName,
  convertToLatinDigits,
  convertToPersianDigits,
  AFGHAN_PLATE_LETTERS,
  type AfghanProvince,
  type ParsedAfghanPlate,
}

export type AfghanTruckPlateProps = AfghanVehiclePlateProps

/**
 * <AfghanTruckPlate />
 *
 * Official Afghanistan Truck Registration Plate UI Component.
 * Faithfully renders the commercial freight truck plate (with "ل" / "L" classification)
 * adhering 1:1 to official Afghanistan physical registration plates:
 * - Pure flat white background (#ffffff)
 * - Solid thin black border with slightly rounded corners
 * - Top Row: Dari/Pashto Province + Persian Digits + "ل" (Lorri/Truck)
 * - Middle Left: Authentic Kabul architectural landmark line-art illustration
 * - Bottom Row: 3-letter Latin Province Code + Latin Digits + "L"
 */
export function AfghanTruckPlate(props: AfghanTruckPlateProps) {
  return <AfghanVehiclePlate defaultLetter="ل" defaultLetterEn="L" {...props} />
}

export default AfghanTruckPlate
