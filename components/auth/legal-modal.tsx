"use client";

import LegalDocumentView from "@/components/marketing/legal-document";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import type { LegalDocument } from "@/lib/legal";

export default function LegalModal({ doc, onClose }: { doc: LegalDocument | null; onClose: () => void }) {
  return (
    <Dialog open={doc !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex max-h-[calc(100%-4rem)] flex-col gap-0 overflow-hidden bg-paper p-0"
      >
        {/* The document shows its own title; this one names the dialog for screen readers. */}
        <DialogTitle className="sr-only">{doc?.title}</DialogTitle>
        <div className="flex-1 overflow-y-auto px-6 py-6">{doc && <LegalDocumentView doc={doc} compact />}</div>
        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button variant="ink" size="sm" autoFocus>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
