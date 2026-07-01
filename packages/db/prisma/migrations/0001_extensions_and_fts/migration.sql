-- Enable PostgreSQL extensions for FTS, fuzzy search, and vector embeddings
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- Full-text search: weighted tsvector on files
CREATE OR REPLACE FUNCTION files_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER files_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, content ON files
  FOR EACH ROW EXECUTE FUNCTION files_search_vector_update();

-- Chats: title + message text (denormalized via app or periodic job)
CREATE OR REPLACE FUNCTION chats_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.title, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chats_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title ON chats
  FOR EACH ROW EXECUTE FUNCTION chats_search_vector_update();

-- Tasks
CREATE OR REPLACE FUNCTION tasks_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, notes ON tasks
  FOR EACH ROW EXECUTE FUNCTION tasks_search_vector_update();

-- Notes
CREATE OR REPLACE FUNCTION notes_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, content ON notes
  FOR EACH ROW EXECUTE FUNCTION notes_search_vector_update();

-- GIN indexes for FTS + trigram fuzzy fallback
CREATE INDEX IF NOT EXISTS files_search_vector_idx ON files USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS files_name_trgm_idx ON files USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS chats_search_vector_idx ON chats USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS tasks_search_vector_idx ON tasks USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS notes_search_vector_idx ON notes USING GIN (search_vector);

-- Vector indexes (IVFFlat — create after seeding embeddings)
-- CREATE INDEX memories_embedding_idx ON memories USING ivfflat (embedding vector_cosine_ops);
