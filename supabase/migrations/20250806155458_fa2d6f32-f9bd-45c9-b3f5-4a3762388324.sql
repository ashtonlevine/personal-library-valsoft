-- Insert 10 random sample books into the books table
INSERT INTO public.books (title, author, isbn, genre, description, published_year, status) VALUES
('The Midnight Library', 'Matt Haig', '978-0525559474', 'Fiction', 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.', 2020, 'available'),
('Atomic Habits', 'James Clear', '978-0735211292', 'Self-Help', 'An Easy & Proven Way to Build Good Habits & Break Bad Ones', 2018, 'available'),
('Dune', 'Frank Herbert', '978-0441172719', 'Science Fiction', 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.', 1965, 'available'),
('Pride and Prejudice', 'Jane Austen', '978-0141439518', 'Romance', 'A romantic novel of manners written by Jane Austen in 1813.', 1813, 'available'),
('The Hobbit', 'J.R.R. Tolkien', '978-0547928227', 'Fantasy', 'In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with the ends of worms and an oozy smell.', 1937, 'available'),
('To Kill a Mockingbird', 'Harper Lee', '978-0060935467', 'Fiction', 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.', 1960, 'available'),
('Sapiens', 'Yuval Noah Harari', '978-0062316097', 'History', 'A brief history of humankind', 2014, 'available'),
('The Girl with the Dragon Tattoo', 'Stieg Larsson', '978-0307454546', 'Mystery', 'A gripping thriller that follows journalist Mikael Blomkvist and the enigmatic hacker Lisbeth Salander.', 2005, 'available'),
('Educated', 'Tara Westover', '978-0399590504', 'Memoir', 'A memoir about a survivalist Mormon family and the struggle for education and self-invention.', 2018, 'available'),
('The Seven Husbands of Evelyn Hugo', 'Taylor Jenkins Reid', '978-1501161933', 'Historical Fiction', 'A reclusive Hollywood icon finally tells her story to a young journalist.', 2017, 'available');