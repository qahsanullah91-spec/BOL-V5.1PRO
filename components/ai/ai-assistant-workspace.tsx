"use client"

import React from "react"
import { AIChatInterface } from "./ai-chat-interface"

export function AiAssistantWorkspace() {
  return (
    <div className="w-full h-[calc(100vh-5.25rem)] flex flex-col">
      <AIChatInterface isFloating={false} />
    </div>
  )
}

export default AiAssistantWorkspace
