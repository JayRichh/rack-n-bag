"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "../lib/utils"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: React.ReactNode;  // Changed from string to ReactNode
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--removed-scroll-width', `${scrollbarWidth}px`);
      document.documentElement.classList.add('overflow-hidden');
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.documentElement.classList.remove('overflow-hidden');
      document.documentElement.style.paddingRight = '';
    }
    
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
      document.documentElement.style.paddingRight = '';
    };
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )} 
        />
        <Dialog.Content 
          className={cn(
            // Base styles
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
            "border bg-white dark:bg-gray-900 shadow-xl rounded-lg",
            // Animation
            "duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
          style={{
            maxHeight: 'calc(100vh - 2rem)',
            width: 'calc(100% - 2rem)'
          }}
        >
          <div className="flex flex-col max-h-[calc(100vh-2rem)]">
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-2">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </Dialog.Title>
              <Dialog.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-gray-800 dark:data-[state=open]:bg-gray-800">
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>

            {/* Content with scrolling */}
            <div className="p-6 pt-2 overflow-y-auto flex-1">
              {children}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
