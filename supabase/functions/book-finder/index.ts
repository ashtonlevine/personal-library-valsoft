import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  description: string | null;
  published_year: number | null;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all books from the database
    const { data: books, error } = await supabase
      .from('books')
      .select('*');

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch books from database' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare books data for AI analysis
    const booksData = books.map((book: Book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      description: book.description,
      published_year: book.published_year,
      status: book.status
    }));

    // Use OpenAI to analyze the query and find relevant books
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful librarian assistant. You have access to a library's book collection. Your task is to find books that match the user's query. 

Here is the complete book collection:
${JSON.stringify(booksData, null, 2)}

When a user asks for books, analyze their request and return the most relevant books from this collection. Consider:
- Genre preferences
- Author names
- Book titles
- Themes or topics
- Publication years
- Book descriptions

Respond with a JSON object containing:
1. "matches": An array of book IDs that match the query
2. "explanation": A brief explanation of why these books were selected
3. "suggestions": Any additional suggestions or recommendations

Make sure to only return book IDs that exist in the provided collection.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.3,
      }),
    });

    const aiResponse = await response.json();
    console.log('OpenAI response:', JSON.stringify(aiResponse, null, 2));
    
    // Check if the response is valid
    if (!response.ok) {
      console.error('OpenAI API error:', aiResponse);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}` }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      console.error('Invalid OpenAI response structure:', aiResponse);
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI service' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const aiContent = aiResponse.choices[0].message.content;
    
    let aiResult;
    try {
      aiResult = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Filter books based on AI's matches
    const matchedBooks = books.filter((book: Book) => 
      aiResult.matches && aiResult.matches.includes(book.id)
    );

    return new Response(
      JSON.stringify({
        books: matchedBooks,
        explanation: aiResult.explanation,
        suggestions: aiResult.suggestions,
        total: matchedBooks.length
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in book-finder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});