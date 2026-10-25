import sys
import re

def main():
    # Read from pristine backup
    with open('components/bill-of-lading/bol-editor.tsx.bak', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print(f"Read {len(lines)} lines from backup.")
    
    # Verify line assertions
    assert '{/* 01 Document Information Card */}' in lines[6061], f"Line 6061: {lines[6061]}"
    assert '{/* Truck & Driver Details Subsection */}' in lines[6278], f"Line 6278: {lines[6278]}"
    assert '<div className="space-y-3">' in lines[6430] or '{/* Notes Boxes Section' in lines[6429], f"Line 6429-6430 mismatch"
    assert '</Card>' in lines[7109], f"Line 7109: {lines[7109]}"
    assert '{/* 02 Shipper, 03 Consignee' in lines[7111], f"Line 7111: {lines[7111]}"

    print("Line assertions verified successfully!")

    # 1. Document Information (lines 6061 to 6277)
    doc_lines = list(lines[6061:6277])
    doc_lines[1] = doc_lines[1].replace('id="section-doc"', 'id="section-doc-info"')
    doc_card_str = ''.join(doc_lines).rstrip() + '\n              </CardContent>\n            </Card>'

    # 2. Truck & Driver Details
    truck_hdr_str = ''.join(lines[6280:6322]).strip()
    truck_inputs_raw = ''.join(lines[6323:6427]).strip()
    
    # Remove the small redundant plate under Truck No input, since the dedicated plate is rendered below
    mini_plate_pattern = r'\{formData\.truck_number\?\.trim\(\)\s*&&\s*\(\s*<div className="mt-1\.5 flex items-center justify-center">\s*<AfghanTruckPlate value=\{formData\.truck_number\}\s+size="compact"\s*/>\s*</div>\s*\)\}'
    truck_inputs_str = re.sub(mini_plate_pattern, '', truck_inputs_raw)

    truck_card_str = f"""{{/* 02 Truck & Driver Details Card */}}
                <Card id="section-truck" className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/90 dark:border-slate-800 shadow-[0_20px_50px_-15px_rgba(30,58,138,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all">
                  {{/* Top Accent Strip */}}
                  <div className="h-1 w-full bg-linear-to-r from-sky-500 via-blue-600 to-indigo-600" />

                  <CardHeader className="py-2.5 px-3 sm:py-3 sm:px-4 border-b border-slate-100/80 dark:border-slate-800 bg-linear-to-r from-sky-50/80 via-blue-50/40 to-white/70 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
                    {truck_hdr_str}
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4 space-y-3.5">
                    {truck_inputs_str}

                    {{/* Bottom Plate Preview & Vehicle Preset Controls */}}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
                      {{/* Vehicle Registration Plate Preview */}}
                      <div className="shrink-0 flex items-center justify-center p-2 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                        <AfghanTruckPlate value={{formData.truck_number || "38552 هرات"}} size="compact" />
                      </div>

                      {{/* Vehicle Preset Controls matching design */}}
                      <div className="flex-1 min-w-0 w-full space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex-1 min-w-[160px]">
                            <Select
                              value={{selectedNote1Id || "none"}}
                              onValueChange={{(value) => {{
                                if (value === "none") {{
                                  setSelectedNote1Id("")
                                  return
                                }}
                                applySavedNote1(value)
                              }}}}
                            >
                              <SelectTrigger className="h-7.5 text-xs border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium">
                                <SelectValue placeholder="Saved presets / الگوهای ذخیره شده" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64 dark:bg-slate-900 dark:border-slate-800">
                                <SelectItem value="none" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  📋 Choose preset... ({{savedNotes1.length}} available)
                                </SelectItem>
                                {{savedNotes1.map((opt, optIndex) => (
                                  <SelectItem key={{`truck-opt1-${{opt.id || optIndex}}`}} value={{opt.id || `opt1-${{optIndex}}`}} className="text-xs py-2">
                                    <div className="flex flex-col gap-0.5 text-left max-w-[280px]">
                                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{{opt.label}}</span>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                        {{opt.content.replace(/\\s+/g, ' ')}}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={{() => saveCurrentNote1()}}
                            disabled={{!formData.notes_1?.trim() || Boolean(selectedSavedNote1 && !isNote1PresetDirty)}}
                            className="h-7.5 px-2.5 text-xs font-bold border-blue-200 bg-white hover:bg-blue-50 text-blue-700 dark:bg-slate-900 dark:border-blue-800 dark:text-blue-300 rounded-lg shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                            title="Save preset"
                          >
                            <Save className="h-3 w-3 mr-1 text-blue-600" />
                            Save preset
                          </Button>
                        </div>

                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Custom note entry (Title, content &amp; color save with BOL)
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1">
                            <Zap className="h-3 w-3 text-amber-500 fill-amber-400" />
                            <span>1-Click VEHICLE RENT / یک‌کلیک کردن سریع:</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={{() => {{
                                startTransition(() => {{
                                  setFormData((prev) => ({{
                                    ...prev,
                                    driver_rent: "46,000 AFN - کرایه واپسی",
                                  }}))
                                  setHasUnsavedChanges(true)
                                }})
                                toast.success("Applied rent preset: تخفیف (یارمل) - کندهار")
                              }}}}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border border-blue-200/90 bg-white hover:bg-blue-50 text-blue-900 shadow-2xs hover:scale-102 transition cursor-pointer dark:bg-slate-900 dark:border-blue-800 dark:text-blue-200"
                            >
                              <span className="text-blue-600 font-mono text-[10px]">📍</span>
                              <span>تخفیف (یارمل) - کندهار</span>
                            </button>

                            <button
                              type="button"
                              onClick={{() => {{
                                startTransition(() => {{
                                  setFormData((prev) => ({{
                                    ...prev,
                                    driver_rent: "45,000 AFN - کرایه واپسی",
                                  }}))
                                  setHasUnsavedChanges(true)
                                }})
                                toast.success("Applied rent preset: دفتر مرکزی اسکای آریانا")
                              }}}}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border border-emerald-200/90 bg-white hover:bg-emerald-50 text-emerald-900 shadow-2xs hover:scale-102 transition cursor-pointer dark:bg-slate-900 dark:border-emerald-800 dark:text-emerald-200"
                            >
                              <span className="text-emerald-600 font-mono text-[10px]">🏢</span>
                              <span>دفتر مرکزی اسکای آریانا</span>
                            </button>

                            <button
                              type="button"
                              onClick={{() => {{
                                startTransition(() => {{
                                  setFormData((prev) => ({{
                                    ...prev,
                                    driver_rent: "53,000 AFN - کرایه واپسی",
                                  }}))
                                  setHasUnsavedChanges(true)
                                }})
                                toast.success("Applied rent preset: RAHMAT NAZAR LTD")
                              }}}}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs hover:scale-102 transition cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                            >
                              <User className="h-3 w-3 text-slate-500" />
                              <span>RAHMAT NAZAR LTD</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>"""

    # 3. Notes Grid (lines 6449 to 7107)
    notes_grid_str = ''.join(lines[6449:7107]).strip()

    notes_card_str = f"""{{/* Document Notes & Contacts Card */}}
                <Card id="section-notes" className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/90 dark:border-slate-800 shadow-[0_20px_50px_-15px_rgba(30,58,138,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all flex flex-col justify-between">
                  {{/* Top Accent Strip */}}
                  <div className="h-1 w-full bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500" />

                  <CardHeader className="py-2.5 px-3 sm:py-3 sm:px-4 border-b border-slate-100/80 dark:border-slate-800 bg-linear-to-r from-blue-50/80 via-indigo-50/40 to-white/70 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-blue-600 text-white shadow-xs">
                            <Bookmark className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-slate-950 dark:text-slate-100 text-xs sm:text-sm tracking-tight uppercase select-none">
                                Document Notes &amp; Contacts
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">│</span>
                              <span className="font-[vazirmatn] text-blue-700 dark:text-blue-400 font-extrabold text-xs sm:text-sm">
                                یادداشت‌ها، مستندات و تماس‌های مربوطه
                              </span>
                            </div>
                            <span className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                              BOL Reference, Serial &amp; Issue Dates • <span className="font-[vazirmatn] text-blue-700 dark:text-blue-400">شماره و تاریخ‌های بارنامه</span>
                            </span>
                          </div>
                        </div>

                        {{/* Top Action Buttons (Save to Presets, Sync with B/L, Reverse, Add Stop) */}}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={{openSaveRouteModal}}
                            className="h-7 sm:h-7.5 rounded-lg border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 text-[10.5px] sm:text-xs font-black shadow-xs cursor-pointer transition-all gap-1"
                            title="Save current route path into Quick Presets list for one-click reuse"
                          >
                            <BookmarkPlus className="h-3.5 w-3.5 text-white" />
                            <span>Save to Presets / ذخیره مسیر</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={{syncRoutesWithBOLPorts}}
                            className="h-7 sm:h-7.5 rounded-lg border-blue-200 dark:border-blue-800 bg-blue-50/90 dark:bg-blue-950/60 px-2.5 text-[10.5px] sm:text-xs font-extrabold text-blue-900 dark:text-blue-300 shadow-2xs hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer transition-all"
                            title="Synchronize Stop 1 with Port of Loading and Last Stop with Port of Discharge"
                          >
                            <ArrowLeftRight className="h-3 w-3 mr-1 text-blue-700 dark:text-blue-400" />
                            <span>Sync with B/L / همگام‌سازی</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={{reverseRoutes}}
                            className="h-7 sm:h-7.5 rounded-lg border-purple-200 dark:border-purple-800 bg-purple-50/90 dark:bg-purple-950/60 px-2.5 text-[10.5px] sm:text-xs font-extrabold text-purple-900 dark:text-purple-300 shadow-2xs hover:bg-purple-100 dark:hover:bg-purple-900/60 cursor-pointer transition-all"
                            title="Reverse the entire route sequence"
                          >
                            <RotateCcw className="h-3 w-3 mr-1 text-purple-700 dark:text-purple-400" />
                            <span>Reverse / معکوس مسیر</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={{addRouteStop}}
                            className="h-7 sm:h-7.5 rounded-lg bg-linear-to-r from-amber-500 to-orange-500 text-white px-2.5 text-[10.5px] sm:text-xs font-extrabold shadow-xs hover:from-amber-600 hover:to-orange-600 cursor-pointer transition-all"
                          >
                            <Plus className="h-3.5 w-3.5 mr-0.5 text-white" />
                            <span>Add Stop / افزودن توقف</span>
                          </Button>
                        </div>
                      </div>

                      {{/* Quick Presets Strip */}}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          QUICK PRESETS:
                        </span>

                        {{savedRoutePresets.map((preset, pIdx) => (
                          <div key={{`left-saved-preset-${{preset.id || pIdx}}`}} className="relative group inline-flex items-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={{() => applyCustomRoutePreset(preset)}}
                              className="h-6.5 rounded-lg border border-amber-300 bg-linear-to-r from-amber-50 to-orange-50/80 pr-5 pl-2 text-[10.5px] font-black text-amber-950 shadow-2xs hover:border-amber-400 hover:from-amber-100 hover:to-orange-100 cursor-pointer transition-all gap-1"
                              title={{`Click to apply ${{preset.title}} (${{preset.routes.length}} stops)`}}
                            >
                              <span className="pointer-events-none">{{preset.icon || "⭐"}}</span>
                              <span className="max-w-[130px] truncate pointer-events-none">{{preset.title}}</span>
                              <span className="rounded-full bg-amber-200/90 px-1 py-0.2 text-[8.5px] font-black text-amber-900 pointer-events-none">
                                {{preset.routes.length}}
                              </span>
                            </Button>
                            <button
                              type="button"
                              onClick={{(e) => handleDeleteRoutePreset(preset.id, e)}}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-200 text-red-600 transition-all cursor-pointer"
                              title="Delete this saved preset"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={{applyHeratIslamQalaDougharounPreset}}
                          className="h-6.5 rounded-lg border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/40 text-[10px] font-extrabold text-amber-950 dark:text-amber-200 shadow-2xs hover:bg-amber-100 cursor-pointer transition-all gap-1"
                        >
                          <span>Islam Qala, AF ➔ Nhava ...</span>
                          <span className="rounded-full bg-amber-200 dark:bg-amber-800 px-1 text-[8.5px] font-black">5</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={{applyKandaharNimrozBandarAbbasDubaiIndiaPreset}}
                          className="h-6.5 rounded-lg border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/40 text-[10px] font-extrabold text-amber-950 dark:text-amber-200 shadow-2xs hover:bg-amber-100 cursor-pointer transition-all gap-1"
                        >
                          <span>Kandahar, AF ➔ Nhava S...</span>
                          <span className="rounded-full bg-amber-200 dark:bg-amber-800 px-1 text-[8.5px] font-black">5</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={{applyDogharonToMersinReeferExportPreset}}
                          className="h-6.5 rounded-lg border border-cyan-300/80 bg-cyan-50/80 dark:bg-cyan-950/40 text-[10px] font-extrabold text-cyan-950 dark:text-cyan-200 shadow-2xs hover:bg-cyan-100 cursor-pointer transition-all"
                        >
                          <Ship className="h-3 w-3 mr-1 text-cyan-700" />
                          <span>Route 3: Dogharon ➔ Mersin Reefer ($14,494)</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={{applyDougharounToMersinExportPreset}}
                          className="h-6.5 rounded-lg border border-purple-300/80 bg-purple-50/80 dark:bg-purple-950/40 text-[10px] font-extrabold text-purple-950 dark:text-purple-200 shadow-2xs hover:bg-purple-100 cursor-pointer transition-all"
                        >
                          <Truck className="h-3 w-3 mr-1 text-purple-700" />
                          <span>TR Route 1: Dougharoun ➡️ Mersin ($3,100)</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={{applyNimrozToBandarAbbasExportPreset}}
                          className="h-6.5 rounded-lg border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/40 text-[10px] font-extrabold text-amber-950 dark:text-amber-200 shadow-2xs hover:bg-amber-100 cursor-pointer transition-all"
                        >
                          <Ship className="h-3 w-3 mr-1 text-amber-700" />
                          <span>TR Route 2: Nimroz ➡️ Bandar Abbas ($1,550)</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={{applyMazarHairatanTashkentPreset}}
                          className="h-6.5 rounded-lg border border-emerald-300/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-[10px] font-extrabold text-emerald-950 dark:text-emerald-200 shadow-2xs hover:bg-emerald-100 cursor-pointer transition-all"
                        >
                          <span>UZ Mazar ➔ Hairatan ➔ Tashkent</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={{applyKabulDubaiAirPreset}}
                          className="h-6.5 rounded-lg border border-blue-300/80 bg-blue-50/80 dark:bg-blue-950/40 text-[10px] font-extrabold text-blue-950 dark:text-blue-200 shadow-2xs hover:bg-blue-100 cursor-pointer transition-all"
                        >
                          <span>Kabul ➔ Dubai (Air)</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={{applyKandaharChamanKarachiDubaiPreset}}
                          className="h-6.5 rounded-lg border border-indigo-300/80 bg-indigo-50/80 dark:bg-indigo-950/40 text-[10px] font-extrabold text-indigo-950 dark:text-indigo-200 shadow-2xs hover:bg-indigo-100 cursor-pointer transition-all"
                        >
                          <span>PK Kandahar ➔ Karachi ➔ Dubai</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4 space-y-3">
                    {notes_grid_str}
                  </CardContent>
                </Card>"""

    # Assemble the full layout
    replacement_str = f"""{{/* ══════════════════════════════════════════════════════════════════════════════════
               REPOSITIONED LOGISTICS LAYOUT: 
               Left Column: Document Notes & Contacts
               Right Column TOP: Document Information
               Right Column BELOW: Truck & Driver Details
               ══════════════════════════════════════════════════════════════════════════════════ */}}
            <div id="section-doc" className="logistics-page-layout grid grid-cols-1 min-[1200px]:grid-cols-2 gap-[18px] items-start w-full max-w-full min-w-0">
              {{/* Left Column: Document Notes & Contacts */}}
              <div className="logistics-left-column min-w-0 w-full">
                {notes_card_str}
              </div>

              {{/* Right Column: Document Information (TOP) + Truck & Driver Details (BELOW) */}}
              <div className="logistics-right-column min-w-0 w-full flex flex-col gap-[18px]">
                {doc_card_str}
                {truck_card_str}
              </div>
            </div>\n"""

    new_lines = lines[:6061] + [replacement_str] + lines[7110:]

    with open('components/bill-of-lading/bol-editor.tsx', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print(f"Assembly completed successfully! Total new lines: {len(new_lines)}")

if __name__ == '__main__':
    main()
