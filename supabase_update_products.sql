-- Script de Atualização para a Tabela 'products'
-- Rode este comando no SQL Editor do seu Dashboard Supabase

-- 1. Adicionar colunas faltantes para o Agente de Vendas
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount TEXT,
ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Garantir que o ID seja UUID e gerado automaticamente (caso não esteja)
-- ALTER TABLE products ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Garantir coluna de data
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Comentário: A coluna 'discount' permitirá que o robô destaque promoções (ex: 15% OFF)
-- separadamente da descrição, melhorando o visual dos cards na Garagem.
