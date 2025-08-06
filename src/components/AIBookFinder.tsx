import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Loader2, Sparkles } from 'lucide-react';
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

interface AIResponse {
  books: Book[];
  explanation: string;
  suggestions: string;
  total: number;
}

export const AIBookFinder = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AIResponse | null>(null);
  const { toast } = useToast();

  const searchBooks = async () => {
    if (!query.trim()) {
      toast({
        title: "Please enter a search query",
        description: "Describe what kind of books you're looking for.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('book-finder', {
        body: { query: query.trim() }
      });

      if (error) {
        console.error('Function error:', error);
        toast({
          title: "Search failed",
          description: error.message || "Failed to search books. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setResults(data);
      
      if (data.total === 0) {
        toast({
          title: "No matches found",
          description: "Try a different search term or genre.",
        });
      } else {
        toast({
          title: `Found ${data.total} book${data.total === 1 ? '' : 's'}!`,
          description: data.explanation,
        });
      }

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchBooks();
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Book Finder
          </CardTitle>
          <CardDescription>
            Ask our AI assistant to find books by genre, author, theme, or any description!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., 'science fiction books about space travel' or 'mystery novels by female authors'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={searchBooks} 
              disabled={isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          {results.explanation && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-primary">
                  {results.explanation}
                </p>
                {results.suggestions && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 {results.suggestions}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {results.books.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {results.books.map((book) => (
                <Card key={book.id} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          {book.title}
                        </CardTitle>
                        <CardDescription className="font-medium">
                          by {book.author}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        {book.genre && (
                          <Badge variant="secondary" className="text-xs">
                            {book.genre}
                          </Badge>
                        )}
                        <Badge 
                          variant={book.status === 'available' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {book.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {book.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {book.description}
                      </p>
                      {book.published_year && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Published: {book.published_year}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};