import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookForm } from "./BookForm";
import { CheckoutDialog } from "./CheckoutDialog";
import { RandomBookSelector } from "./RandomBookSelector";
import { AIBookFinder } from "./AIBookFinder";
import { TimmyChat } from "./TimmyChat";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, BookOpen, Users, CheckCircle, Clock } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  published_year?: number;
  genre?: string;
  description?: string;
  status: 'available' | 'checked_out';
  checked_out_at?: string;
  checked_out_by?: string;
  created_at: string;
  updated_at: string;
}

export const LibraryDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showBookForm, setShowBookForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch books with search
  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books', searchTerm],
    queryFn: async () => {
      let query = supabase.from('books').select('*').order('created_at', { ascending: false });
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,genre.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Book[];
    },
  });

  // Update book status mutation
  const updateBookStatus = useMutation({
    mutationFn: async ({ bookId, status, borrowerName }: { bookId: string; status: 'available' | 'checked_out'; borrowerName?: string }) => {
      const updateData: any = {
        status,
        checked_out_at: status === 'checked_out' ? new Date().toISOString() : null,
        checked_out_by: status === 'checked_out' ? borrowerName : null,
      };

      const { error } = await supabase.from('books').update(updateData).eq('id', bookId);
      if (error) throw error;

      // Add to checkout history
      const { error: historyError } = await supabase.from('checkout_history').insert({
        book_id: bookId,
        action: status === 'checked_out' ? 'checked_out' : 'checked_in',
        borrower_name: borrowerName || null,
      });
      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({
        title: "Success",
        description: "Book status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update book status",
        variant: "destructive",
      });
    },
  });

  // Delete book mutation
  const deleteBook = useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase.from('books').delete().eq('id', bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = (book: Book) => {
    setSelectedBook(book);
    setShowCheckoutDialog(true);
  };

  const handleStatusChange = (borrowerName?: string) => {
    if (!selectedBook) return;
    
    const newStatus = selectedBook.status === 'available' ? 'checked_out' : 'available';
    updateBookStatus.mutate({
      bookId: selectedBook.id,
      status: newStatus,
      borrowerName,
    });
    setShowCheckoutDialog(false);
    setSelectedBook(null);
  };

  const stats = {
    total: books.length,
    available: books.filter(book => book.status === 'available').length,
    checkedOut: books.filter(book => book.status === 'checked_out').length,
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-meadow)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <BookOpen className="text-primary" />
            Personal Library
          </h1>
          <p className="text-muted-foreground">Manage your book collection with ease</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg" style={{ boxShadow: 'var(--shadow-gentle)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg" style={{ boxShadow: 'var(--shadow-gentle)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.available}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg" style={{ boxShadow: 'var(--shadow-gentle)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.checkedOut}</div>
            </CardContent>
          </Card>
        </div>

        {/* Random Book Selector */}
        <Card className="mb-8 shadow-lg" style={{ boxShadow: 'var(--shadow-gentle)' }}>
          <CardHeader>
            <CardTitle>Feeling Lucky?</CardTitle>
            <CardDescription>
              Can't decide what to read? Let us pick a random book for you!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RandomBookSelector />
          </CardContent>
        </Card>

        {/* AI Book Finder */}
        <div className="mb-8">
          <AIBookFinder />
        </div>

        {/* Search and Add Book */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search books by title, author, or genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowBookForm(true)}
            className="bg-primary hover:bg-primary/90"
            style={{ boxShadow: 'var(--shadow-leaf)' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8">Loading books...</div>
          ) : books.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No books found matching your search." : "No books in your library yet. Add your first book!"}
              </p>
            </div>
          ) : (
            books.map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow" style={{ boxShadow: 'var(--shadow-gentle)' }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{book.title}</CardTitle>
                      <CardDescription className="text-primary font-medium">by {book.author}</CardDescription>
                    </div>
                    <Badge variant={book.status === 'available' ? 'default' : 'secondary'}>
                      {book.status === 'available' ? 'Available' : 'Checked Out'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {book.genre && <p className="text-sm text-muted-foreground">Genre: {book.genre}</p>}
                    {book.published_year && <p className="text-sm text-muted-foreground">Published: {book.published_year}</p>}
                    {book.isbn && <p className="text-sm text-muted-foreground">ISBN: {book.isbn}</p>}
                    {book.status === 'checked_out' && book.checked_out_by && (
                      <p className="text-sm text-accent font-medium">Borrowed by: {book.checked_out_by}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckout(book)}
                      className="flex-1"
                    >
                      {book.status === 'available' ? 'Check Out' : 'Return'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBook(book);
                        setShowBookForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteBook.mutate(book.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Book Form Dialog */}
        <BookForm
          book={selectedBook}
          open={showBookForm}
          onClose={() => {
            setShowBookForm(false);
            setSelectedBook(null);
          }}
        />

        {/* Checkout Dialog */}
        <CheckoutDialog
          book={selectedBook}
          open={showCheckoutDialog}
          onClose={() => {
            setShowCheckoutDialog(false);
            setSelectedBook(null);
          }}
          onConfirm={handleStatusChange}
        />
      </div>
    </div>
  );
};