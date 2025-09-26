"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string
}

interface FAQAccordionProps {
  items: FAQItem[]
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="border border-border rounded-lg bg-card">
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg"
          >
            <h3 className="font-medium text-foreground">{item.question}</h3>
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                openItems.has(index) && "rotate-180"
              )}
            />
          </button>
          {openItems.has(index) && (
            <div className="px-6 pb-4">
              <div className="text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}