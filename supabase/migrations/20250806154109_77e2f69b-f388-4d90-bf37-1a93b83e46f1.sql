-- Create books table for library management
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  published_year INTEGER,
  genre TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'checked_out')),
  checked_out_at TIMESTAMP WITH TIME ZONE,
  checked_out_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create policy for personal library (allow all operations for authenticated users)
CREATE POLICY "Personal library access" 
ON public.books 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create checkout history table
CREATE TABLE public.checkout_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('checked_out', 'checked_in')),
  borrower_name TEXT,
  action_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS for checkout history
ALTER TABLE public.checkout_history ENABLE ROW LEVEL SECURITY;

-- Create policy for checkout history
CREATE POLICY "Personal checkout history access" 
ON public.checkout_history 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better search performance
CREATE INDEX idx_books_title ON public.books USING GIN(to_tsvector('english', title));
CREATE INDEX idx_books_author ON public.books USING GIN(to_tsvector('english', author));
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_checkout_history_book_id ON public.checkout_history(book_id);
CREATE INDEX idx_checkout_history_action_date ON public.checkout_history(action_date);