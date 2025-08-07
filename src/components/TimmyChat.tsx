import { useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  description: string | null;
  published_year: number | null;
  status: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'timmy';
  content: string;
  books?: Book[];
}

export const TimmyChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'timmy',
      content: "Hi! I'm Timmy, your AI library assistant! 📚 I can help you find books in your collection. Just tell me what you're looking for - maybe something like 'sci-fi books' or 'books by a specific author'!"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('book-finder', {
        body: { query: inputValue }
      });

      if (error) {
        throw error;
      }

      const timmyResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'timmy',
        content: data.explanation || "I found some books for you!",
        books: data.books || []
      };

      setMessages(prev => [...prev, timmyResponse]);

      if (data.total === 0) {
        const noResultsMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'timmy',
          content: "I couldn't find any books matching your request. Try asking for something else, like 'fantasy books' or 'recent publications'!"
        };
        setMessages(prev => [...prev, noResultsMessage]);
      }
    } catch (error: any) {
      console.error('Error searching books:', error);
      
      let errorMessage = "Sorry, I'm having trouble searching right now. Please try again later.";
      
      // Handle specific error types
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = "Network connection issue. Please check your internet connection and try again.";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please try again with a shorter query.";
      }
      
      if (error.message?.includes('quota') || error.message?.includes('billing') || error.message?.includes('insufficient_quota')) {
        errorMessage = "⚠️ OpenAI API quota exceeded. Please check your OpenAI billing and add credits to continue using Timmy's AI search features.";
      }

      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'timmy',
        content: errorMessage
      };

      setMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
          size="icon"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
        {!isOpen && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full animate-fade-in">
            Timmy
          </div>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-20 left-4 w-80 h-96 z-40 shadow-2xl animate-scale-in">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
              <h3 className="font-semibold">Timmy - Library Assistant</h3>
              <p className="text-xs opacity-90">Ask me about your books!</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    {message.books && message.books.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.books.slice(0, 3).map((book) => (
                          <div key={book.id} className="bg-background p-2 rounded border">
                            <p className="font-medium text-xs">{book.title}</p>
                            <p className="text-xs text-muted-foreground">by {book.author}</p>
                            {book.genre && <p className="text-xs text-muted-foreground">{book.genre}</p>}
                          </div>
                        ))}
                        {message.books.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            + {message.books.length - 3} more books found
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Timmy is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your books..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="icon"
                  disabled={isLoading || !inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};