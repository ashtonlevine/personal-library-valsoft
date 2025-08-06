import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  published_year?: number;
  genre?: string;
  description?: string;
  status: 'available' | 'checked_out';
}

interface BookFormProps {
  book?: Book | null;
  open: boolean;
  onClose: () => void;
}

export const BookForm = ({ book, open, onClose }: BookFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    published_year: "",
    genre: "",
    description: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn || "",
        published_year: book.published_year?.toString() || "",
        genre: book.genre || "",
        description: book.description || "",
      });
    } else {
      setFormData({
        title: "",
        author: "",
        isbn: "",
        published_year: "",
        genre: "",
        description: "",
      });
    }
  }, [book, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const bookData = {
        title: data.title,
        author: data.author,
        isbn: data.isbn || null,
        published_year: data.published_year ? parseInt(data.published_year) : null,
        genre: data.genre || null,
        description: data.description || null,
      };

      if (book) {
        const { error } = await supabase.from('books').update(bookData).eq('id', book.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').insert(bookData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({
        title: "Success",
        description: book ? "Book updated successfully" : "Book added successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: book ? "Failed to update book" : "Failed to add book",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      toast({
        title: "Error",
        description: "Title and author are required",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{book ? "Edit Book" : "Add New Book"}</DialogTitle>
          <DialogDescription>
            {book ? "Update the book details below." : "Enter the details of the new book."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Book title"
                className="h-10 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleInputChange("author", e.target.value)}
                placeholder="Author name"
                className="h-10 text-base"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) => handleInputChange("isbn", e.target.value)}
                placeholder="ISBN number"
                className="h-10 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="published_year">Published Year</Label>
              <Input
                id="published_year"
                type="number"
                value={formData.published_year}
                onChange={(e) => handleInputChange("published_year", e.target.value)}
                placeholder="2023"
                min="1000"
                max="2030"
                className="h-10 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={formData.genre}
              onChange={(e) => handleInputChange("genre", e.target.value)}
              placeholder="Fiction, Non-fiction, etc."
              className="h-10 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the book"
              rows={3}
              className="text-base resize-none"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
              {mutation.isPending ? "Saving..." : book ? "Update Book" : "Add Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};