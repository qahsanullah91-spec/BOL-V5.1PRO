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
 * Backward-compatible wrapper around <AfghanVehiclePlate />,
 * matching the authentic flat white Afghan vehicle registration plate standard.
 */
export function AfghanTruckPlate(props: AfghanTruckPlateProps) {
  return <AfghanVehiclePlate {...props} />
}

export default AfghanVehiclePlate
