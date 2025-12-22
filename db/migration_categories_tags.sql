-- Migration: Add categories, tags, and priority to news table

-- Add new columns to news table
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('Bots', 'Incidentes', 'Mejoras', 'Release', 'Comunicados')) DEFAULT 'Comunicados',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10);

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_news_tags ON public.news USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_news_priority ON public.news(priority DESC);
CREATE INDEX IF NOT EXISTS idx_news_featured ON public.news(is_featured) WHERE is_featured = true;

-- Update existing news to have default values
UPDATE public.news 
SET category = 'Comunicados', 
    tags = '{}', 
    is_featured = false, 
    priority = 0 
WHERE category IS NULL;

COMMENT ON COLUMN public.news.category IS 'Tipo de noticia: Bots, Incidentes, Mejoras, Release, Comunicados';
COMMENT ON COLUMN public.news.tags IS 'Etiquetas de la noticia (ej: UiPath, Power Automate, SAP, DIAN, Producción)';
COMMENT ON COLUMN public.news.is_featured IS 'Indica si la noticia está destacada';
COMMENT ON COLUMN public.news.priority IS 'Prioridad de la noticia (0-10), mayor número = mayor prioridad';
