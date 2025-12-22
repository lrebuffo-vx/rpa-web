-- 1. Habilitar STORAGE (Si no está habilitado por defecto)
-- Nota: Esto se suele hacer desde la UI, pero definimos las POLÍTICAS aquí.

-- 2. Crear el Bucket 'image_news' (Si no existe)
-- Supabase gestiona esto en la tabla storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('image_news', 'image_news', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Seguridad para el Bucket

-- Permitir acceso PÚBLICO para ver imágenes (necesario para el feed de noticias)
CREATE POLICY "Public Access News Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'image_news' );

-- Permitir SUBIR imágenes solo a usuarios autenticados (cualquier usuario registrado)
-- Opcional: Restringir solo a admins si quisieras, pero pediste usuarios regulares ahora.
CREATE POLICY "Auth Users Upload Images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'image_news' 
    AND auth.role() = 'authenticated'
);

-- Permitir BORRAR/ACTUALIZAR sus propias imágenes (O solo admins)
-- Simplificación: Solo admins o el dueño podrían, por ahora dejamos subida libre para authenticated.
CREATE POLICY "Auth Users Update Images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'image_news' AND auth.role() = 'authenticated' );

CREATE POLICY "Auth Users Delete Images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'image_news' AND auth.role() = 'authenticated' );
