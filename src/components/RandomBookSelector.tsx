import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shuffle, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  description: string | null;
  published_year: number | null;
  status: string;
}

export const RandomBookSelector = () => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  const { data: books } = useQuery({
    queryKey: ['available-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'available');
      
      if (error) throw error;
      return data as Book[];
    },
  });

  const selectRandomBook = () => {
    if (!books || books.length === 0) {
      toast({
        title: "No books available",
        description: "Please add some books to your library first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnimating(true);
    
    // Simulate spinning animation with multiple rapid selections
    let counter = 0;
    const maxSpins = 20;
    
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * books.length);
      setSelectedBook(books[randomIndex]);
      counter++;
      
      if (counter >= maxSpins) {
        clearInterval(spinInterval);
        setIsAnimating(false);
        toast({
          title: "Book selected!",
          description: `Here's your random pick: ${books[randomIndex].title}`,
        });
      }
    }, 100);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <Button 
          onClick={selectRandomBook}
          disabled={isAnimating || !books?.length}
          size="lg"
          className={`transition-all duration-300 ${
            isAnimating 
              ? 'animate-pulse bg-primary/80 scale-105' 
              : 'hover:scale-105 hover:shadow-lg'
          }`}
        >
          <Shuffle className={`mr-2 h-5 w-5 ${isAnimating ? 'animate-spin' : ''}`} />
          {isAnimating ? 'Selecting...' : 'Pick Random Book'}
        </Button>
      </div>

      {selectedBook && (
        <Card className={`transition-all duration-500 ${
          isAnimating ? 'animate-scale-in' : 'animate-fade-in'
        }`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {selectedBook.title}
                </CardTitle>
                <CardDescription className="text-base font-medium">
                  by {selectedBook.author}
                </CardDescription>
              </div>
              {selectedBook.genre && (
                <Badge variant="secondary" className="ml-2">
                  {selectedBook.genre}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          {selectedBook.description && (
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {selectedBook.description}
              </p>
              {selectedBook.published_year && (
                <p className="text-xs text-muted-foreground mt-2">
                  Published: {selectedBook.published_year}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};