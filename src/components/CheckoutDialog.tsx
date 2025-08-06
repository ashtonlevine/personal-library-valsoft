import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Book {
  id: string;
  title: string;
  author: string;
  status: 'available' | 'checked_out';
  checked_out_by?: string;
}

interface CheckoutDialogProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (borrowerName?: string) => void;
}

export const CheckoutDialog = ({ book, open, onClose, onConfirm }: CheckoutDialogProps) => {
  const [borrowerName, setBorrowerName] = useState("");

  if (!book) return null;

  const isCheckingOut = book.status === 'available';

  const handleConfirm = () => {
    if (isCheckingOut && !borrowerName.trim()) {
      return;
    }
    onConfirm(isCheckingOut ? borrowerName : undefined);
    setBorrowerName("");
  };

  const handleClose = () => {
    setBorrowerName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isCheckingOut ? "Check Out Book" : "Return Book"}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">"{book.title}"</span> by {book.author}
            {!isCheckingOut && book.checked_out_by && (
              <span className="block mt-2 text-accent">
                Currently borrowed by: {book.checked_out_by}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isCheckingOut && (
          <div className="space-y-2">
            <Label htmlFor="borrower">Borrower Name *</Label>
            <Input
              id="borrower"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="Who is borrowing this book?"
              required
            />
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isCheckingOut && !borrowerName.trim()}
          >
            {isCheckingOut ? "Check Out" : "Return Book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};