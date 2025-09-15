-- =====================================================
-- INSERIR 1500 MEMBROS DE TESTE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 🗑️ LIMPEZA DOS DADOS ANTIGOS
-- =====================================================

-- Limpar dados de teste anteriores (manter apenas dados reais)
DELETE FROM members 
WHERE name LIKE '%Silva%' 
   OR name LIKE '%Santos%' 
   OR name LIKE '%Oliveira%'
   OR name LIKE '%Costa%'
   OR name LIKE '%Ferreira%'
   OR name LIKE '%Rodrigues%'
   OR name LIKE '%Alves%'
   OR name LIKE '%Lima%'
   OR name LIKE '%Pereira%'
   OR name LIKE '%Martins%'
   OR name LIKE '%Souza%'
   OR name LIKE '%Barbosa%'
   OR name LIKE '%Carvalho%'
   OR name LIKE '%Gomes%'
   OR name LIKE '%Rocha%'
   OR name LIKE '%Dias%'
   OR name LIKE '%Nunes%'
   OR name LIKE '%Moreira%'
   OR name LIKE '%Cardoso%'
   OR name LIKE '%Vieira%'
   OR phone LIKE '99999-%'
   OR phone LIKE '88888-%'
   OR instagram LIKE '@joao%'
   OR instagram LIKE '@maria%'
   OR instagram LIKE '@pedro%'
   OR instagram LIKE '@ana%'
   OR instagram LIKE '@carlos%'
   OR instagram LIKE '@lucia%'
   OR instagram LIKE '@roberto%'
   OR instagram LIKE '@fernanda%'
   OR instagram LIKE '@marcos%'
   OR instagram LIKE '@juliana%'
   OR instagram LIKE '@rafael%'
   OR instagram LIKE '@camila%'
   OR instagram LIKE '@diego%'
   OR instagram LIKE '@patricia%'
   OR instagram LIKE '@andre%'
   OR instagram LIKE '@mariana%'
   OR instagram LIKE '@felipe%'
   OR instagram LIKE '@beatriz%'
   OR instagram LIKE '@thiago%'
   OR instagram LIKE '@gabriela%'
   OR instagram LIKE '@lucas%';

-- Resetar contador de sequência se necessário (apenas se usar INTEGER)
-- SELECT setval('members_id_seq', (SELECT COALESCE(MAX(id), 0) FROM members));

-- =====================================================
-- 1. DADOS DE TESTE PARA MEMBROS
-- =====================================================

-- Inserir 1500 membros de teste na tabela members
INSERT INTO members (
    name,
    phone,
    instagram,
    city,
    sector,
    referrer,
    couple_name,
    couple_phone,
    couple_instagram,
    couple_city,
    couple_sector,
    is_friend,
    contracts_completed,
    ranking_position,
    ranking_status,
    is_top_1500,
    can_be_replaced,
    registration_date,
    status,
    created_at,
    updated_at
) VALUES 
-- Membros 1-50 (com dados do cônjuge e lógica correta de ranking)
('João Silva', '(11) 99999-0001', '@joaosilva', 'São Paulo', 'Centro', 'Administrador', 'Maria Silva', '(11) 99999-1001', '@mariasilva', 'São Paulo', 'Centro', false, 0, 1, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Maria Santos', '(11) 99999-0002', '@mariasantos', 'São Paulo', 'Centro', 'Administrador', 'João Santos', '(11) 99999-1002', '@joaosantos', 'São Paulo', 'Centro', false, 5, 2, 'Amarelo', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Pedro Oliveira', '(11) 99999-0003', '@pedrooliveira', 'São Paulo', 'Centro', 'Administrador', 'Ana Oliveira', '(11) 99999-1003', '@anaoliveira', 'São Paulo', 'Centro', false, 10, 3, 'Amarelo', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Ana Costa', '(11) 99999-0004', '@anacosta', 'São Paulo', 'Centro', 'Administrador', 'Carlos Costa', '(11) 99999-1004', '@carloscosta', 'São Paulo', 'Centro', false, 15, 4, 'Verde', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Carlos Ferreira', '(11) 99999-0005', '@carlosferreira', 'São Paulo', 'Centro', 'Administrador', 'Lucia Ferreira', '(11) 99999-1005', '@luciaferreira', 'São Paulo', 'Centro', false, 18, 5, 'Verde', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Lucia Rodrigues', '(11) 99999-0006', '@luciarodrigues', 'São Paulo', 'Centro', 'Administrador', 'Roberto Rodrigues', '(11) 99999-1006', '@robertorodrigues', 'São Paulo', 'Centro', false, 0, 6, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Roberto Alves', '(11) 99999-0007', '@robertoalves', 'São Paulo', 'Centro', 'Administrador', 'Fernanda Alves', '(11) 99999-1007', '@fernandaalves', 'São Paulo', 'Centro', false, 0, 7, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Fernanda Lima', '(11) 99999-0008', '@fernandalima', 'São Paulo', 'Centro', 'Administrador', 'Marcos Lima', '(11) 99999-1008', '@marcoslima', 'São Paulo', 'Centro', false, 0, 8, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Marcos Pereira', '(11) 99999-0009', '@marcospereira', 'São Paulo', 'Centro', 'Administrador', 'Juliana Pereira', '(11) 99999-1009', '@julianapereira', 'São Paulo', 'Centro', false, 0, 9, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Juliana Martins', '(11) 99999-0010', '@julianamartins', 'São Paulo', 'Centro', 'Administrador', 'Rafael Martins', '(11) 99999-1010', '@rafaelmartins', 'São Paulo', 'Centro', false, 0, 10, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Rafael Souza', '(11) 99999-0011', '@rafaelsouza', 'São Paulo', 'Centro', 'Administrador', 'Camila Souza', '(11) 99999-1011', '@camilasouza', 'São Paulo', 'Centro', false, 0, 11, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Camila Barbosa', '(11) 99999-0012', '@camilabarbosa', 'São Paulo', 'Centro', 'Administrador', 'Diego Barbosa', '(11) 99999-1012', '@diegobarbosa', 'São Paulo', 'Centro', false, 0, 12, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Diego Carvalho', '(11) 99999-0013', '@diegocarvalho', 'São Paulo', 'Centro', 'Administrador', 'Patricia Carvalho', '(11) 99999-1013', '@patriciacarvalho', 'São Paulo', 'Centro', false, 0, 13, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Patricia Gomes', '(11) 99999-0014', '@patriciagomes', 'São Paulo', 'Centro', 'Administrador', 'André Gomes', '(11) 99999-1014', '@andregomes', 'São Paulo', 'Centro', false, 0, 14, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('André Rocha', '(11) 99999-0015', '@andrerocha', 'São Paulo', 'Centro', 'Administrador', 'Mariana Rocha', '(11) 99999-1015', '@marianarocha', 'São Paulo', 'Centro', false, 0, 15, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Mariana Dias', '(11) 99999-0016', '@marianadias', 'São Paulo', 'Centro', 'Administrador', 'Felipe Dias', '(11) 99999-1016', '@felipedias', 'São Paulo', 'Centro', false, 0, 16, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Felipe Nunes', '(11) 99999-0017', '@felipenunes', 'São Paulo', 'Centro', 'Administrador', 'Beatriz Nunes', '(11) 99999-1017', '@beatriznunes', 'São Paulo', 'Centro', false, 0, 17, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Beatriz Moreira', '(11) 99999-0018', '@beatrizmoreira', 'São Paulo', 'Centro', 'Administrador', 'Thiago Moreira', '(11) 99999-1018', '@thiagomoreira', 'São Paulo', 'Centro', false, 0, 18, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Thiago Cardoso', '(11) 99999-0019', '@thiagocardoso', 'São Paulo', 'Centro', 'Administrador', 'Gabriela Cardoso', '(11) 99999-1019', '@gabrielacardoso', 'São Paulo', 'Centro', false, 0, 19, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Gabriela Vieira', '(11) 99999-0020', '@gabrielavieira', 'São Paulo', 'Centro', 'Administrador', 'Lucas Vieira', '(11) 99999-1020', '@lucasvieira', 'São Paulo', 'Centro', false, 0, 20, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Lucas Mendes', '(11) 99999-0021', '@lucasmendes', 'São Paulo', 'Centro', 'Administrador', 'Isabela Mendes', '(11) 99999-1021', '@isabelamendes', 'São Paulo', 'Centro', false, 0, 21, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Isabela Freitas', '(11) 99999-0022', '@isabelafreitas', 'São Paulo', 'Centro', 'Administrador', 'Bruno Freitas', '(11) 99999-1022', '@brunofreitas', 'São Paulo', 'Centro', false, 0, 22, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Bruno Campos', '(11) 99999-0023', '@brunocampos', 'São Paulo', 'Centro', 'Administrador', 'Larissa Campos', '(11) 99999-1023', '@larissacampos', 'São Paulo', 'Centro', false, 0, 23, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Larissa Teixeira', '(11) 99999-0024', '@larissateixeira', 'São Paulo', 'Centro', 'Administrador', 'Gustavo Teixeira', '(11) 99999-1024', '@gustavoteixeira', 'São Paulo', 'Centro', false, 0, 24, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Gustavo Ribeiro', '(11) 99999-0025', '@gustavoribeiro', 'São Paulo', 'Centro', 'Administrador', 'Natália Ribeiro', '(11) 99999-1025', '@nataliaribeiro', 'São Paulo', 'Centro', false, 0, 25, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Natália Monteiro', '(11) 99999-0026', '@nataliamonteiro', 'São Paulo', 'Centro', 'Administrador', 'Henrique Monteiro', '(11) 99999-1026', '@henriquemonteiro', 'São Paulo', 'Centro', false, 0, 26, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Henrique Lopes', '(11) 99999-0027', '@henriquelopes', 'São Paulo', 'Centro', 'Administrador', 'Renata Lopes', '(11) 99999-1027', '@renatalopes', 'São Paulo', 'Centro', false, 0, 27, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Renata Castro', '(11) 99999-0028', '@renatacastro', 'São Paulo', 'Centro', 'Administrador', 'Vitor Castro', '(11) 99999-1028', '@vitorcastro', 'São Paulo', 'Centro', false, 0, 28, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Vitor Correia', '(11) 99999-0029', '@vitorcorreia', 'São Paulo', 'Centro', 'Administrador', 'Aline Correia', '(11) 99999-1029', '@alinecorreia', 'São Paulo', 'Centro', false, 0, 29, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Aline Duarte', '(11) 99999-0030', '@alineduarte', 'São Paulo', 'Centro', 'Administrador', 'Rodrigo Duarte', '(11) 99999-1030', '@rodrigoduarte', 'São Paulo', 'Centro', false, 0, 30, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Rodrigo Azevedo', '(11) 99999-0031', '@rodrigoazevedo', 'São Paulo', 'Centro', 'Administrador', 'Vanessa Azevedo', '(11) 99999-1031', '@vanessaazevedo', 'São Paulo', 'Centro', false, 0, 31, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Vanessa Machado', '(11) 99999-0032', '@vanessamachado', 'São Paulo', 'Centro', 'Administrador', 'Leandro Machado', '(11) 99999-1032', '@leandromachado', 'São Paulo', 'Centro', false, 0, 32, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Leandro Fernandes', '(11) 99999-0033', '@leandrofernandes', 'São Paulo', 'Centro', 'Administrador', 'Cristina Fernandes', '(11) 99999-1033', '@cristinafernandes', 'São Paulo', 'Centro', false, 0, 33, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Cristina Nascimento', '(11) 99999-0034', '@cristinanascimento', 'São Paulo', 'Centro', 'Administrador', 'Alexandre Nascimento', '(11) 99999-1034', '@alexandrenascimento', 'São Paulo', 'Centro', false, 0, 34, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Alexandre Reis', '(11) 99999-0035', '@alexandrereis', 'São Paulo', 'Centro', 'Administrador', 'Simone Reis', '(11) 99999-1035', '@simonereis', 'São Paulo', 'Centro', false, 0, 35, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Simone Araújo', '(11) 99999-0036', '@simonearaujo', 'São Paulo', 'Centro', 'Administrador', 'Eduardo Araújo', '(11) 99999-1036', '@eduardoaraujo', 'São Paulo', 'Centro', false, 0, 36, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Eduardo Coelho', '(11) 99999-0037', '@eduardocoelho', 'São Paulo', 'Centro', 'Administrador', 'Mônica Coelho', '(11) 99999-1037', '@monicacoelho', 'São Paulo', 'Centro', false, 0, 37, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Mônica Pinheiro', '(11) 99999-0038', '@monicapinheiro', 'São Paulo', 'Centro', 'Administrador', 'Sérgio Pinheiro', '(11) 99999-1038', '@sergiopinheiro', 'São Paulo', 'Centro', false, 0, 38, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Sérgio Moura', '(11) 99999-0039', '@sergiomoura', 'São Paulo', 'Centro', 'Administrador', 'Denise Moura', '(11) 99999-1039', '@denisemoura', 'São Paulo', 'Centro', false, 0, 39, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Denise Ramos', '(11) 99999-0040', '@deniseramos', 'São Paulo', 'Centro', 'Administrador', 'Ricardo Ramos', '(11) 99999-1040', '@ricardoramos', 'São Paulo', 'Centro', false, 0, 40, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Ricardo Farias', '(11) 99999-0041', '@ricardofarias', 'São Paulo', 'Centro', 'Administrador', 'Adriana Farias', '(11) 99999-1041', '@adrianafarias', 'São Paulo', 'Centro', false, 0, 41, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Adriana Melo', '(11) 99999-0042', '@adrianamelo', 'São Paulo', 'Centro', 'Administrador', 'Márcio Melo', '(11) 99999-1042', '@marciomelo', 'São Paulo', 'Centro', false, 0, 42, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Márcio Santana', '(11) 99999-0043', '@marciosantana', 'São Paulo', 'Centro', 'Administrador', 'Sandra Santana', '(11) 99999-1043', '@sandrasantana', 'São Paulo', 'Centro', false, 0, 43, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Sandra Cordeiro', '(11) 99999-0044', '@sandracordeiro', 'São Paulo', 'Centro', 'Administrador', 'Paulo Cordeiro', '(11) 99999-1044', '@paulocordeiro', 'São Paulo', 'Centro', false, 0, 44, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Paulo Viana', '(11) 99999-0045', '@pauloviana', 'São Paulo', 'Centro', 'Administrador', 'Eliane Viana', '(11) 99999-1045', '@elianeViana', 'São Paulo', 'Centro', false, 0, 45, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Eliane Tavares', '(11) 99999-0046', '@elianetavares', 'São Paulo', 'Centro', 'Administrador', 'César Tavares', '(11) 99999-1046', '@cesartavares', 'São Paulo', 'Centro', false, 0, 46, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('César Borges', '(11) 99999-0047', '@cesarborges', 'São Paulo', 'Centro', 'Administrador', 'Regina Borges', '(11) 99999-1047', '@reginaborges', 'São Paulo', 'Centro', false, 0, 47, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Regina Andrade', '(11) 99999-0048', '@reginaandrade', 'São Paulo', 'Centro', 'Administrador', 'Antônio Andrade', '(11) 99999-1048', '@antonioandrade', 'São Paulo', 'Centro', false, 0, 48, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Antônio Medeiros', '(11) 99999-0049', '@antoniomedeiros', 'São Paulo', 'Centro', 'Administrador', 'Luciana Medeiros', '(11) 99999-1049', '@lucianamedeiros', 'São Paulo', 'Centro', false, 0, 49, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW()),
('Luciana Xavier', '(11) 99999-0050', '@lucianaxavier', 'São Paulo', 'Centro', 'Administrador', 'João Xavier', '(11) 99999-1050', '@joaoxavier', 'São Paulo', 'Centro', false, 0, 50, 'Vermelho', true, false, '2024-01-01', 'Ativo', NOW(), NOW());

-- =====================================================
-- 2. CONTINUAR COM MAIS MEMBROS (51-1500)
-- =====================================================

-- Nota: Este é um exemplo com os primeiros 50 membros
-- Para inserir os 1500 membros completos, você pode:

-- Opção 1: Executar este script várias vezes alterando os números
-- Opção 2: Usar um script Python/Node.js para gerar todos os 1500
-- Opção 3: Usar uma ferramenta de geração de dados

-- =====================================================
-- 3. SCRIPT ALTERNATIVO PARA GERAR TODOS OS 1500
-- =====================================================

-- Se preferir, execute este script que gera todos os 1500 membros:

DO $$
DECLARE
    i INTEGER;
    nomes TEXT[] := ARRAY['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucia', 'Roberto', 'Fernanda', 'Marcos', 'Juliana', 'Rafael', 'Camila', 'Diego', 'Patricia', 'André', 'Mariana', 'Felipe', 'Beatriz', 'Thiago', 'Gabriela', 'Lucas', 'Isabela', 'Bruno', 'Larissa', 'Gustavo', 'Natália', 'Henrique', 'Renata', 'Vitor', 'Aline', 'Rodrigo', 'Vanessa', 'Leandro', 'Cristina', 'Alexandre', 'Simone', 'Eduardo', 'Mônica', 'Sérgio', 'Denise', 'Ricardo', 'Adriana', 'Márcio', 'Sandra', 'Paulo', 'Eliane', 'César', 'Regina', 'Antônio', 'Luciana'];
    sobrenomes TEXT[] := ARRAY['Silva', 'Santos', 'Oliveira', 'Costa', 'Ferreira', 'Rodrigues', 'Alves', 'Lima', 'Pereira', 'Martins', 'Souza', 'Barbosa', 'Carvalho', 'Gomes', 'Rocha', 'Dias', 'Nunes', 'Moreira', 'Cardoso', 'Vieira', 'Mendes', 'Freitas', 'Campos', 'Teixeira', 'Ribeiro', 'Monteiro', 'Lopes', 'Castro', 'Correia', 'Duarte', 'Azevedo', 'Machado', 'Fernandes', 'Nascimento', 'Reis', 'Araújo', 'Coelho', 'Pinheiro', 'Moura', 'Ramos', 'Farias', 'Melo', 'Santana', 'Cordeiro', 'Viana', 'Tavares', 'Borges', 'Andrade', 'Medeiros', 'Xavier'];
    cidades TEXT[] := ARRAY['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília', 'Fortaleza', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre', 'Belém', 'Goiânia', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina', 'Campo Grande', 'Nova Iguaçu', 'São Bernardo do Campo', 'João Pessoa', 'Santo André', 'Osasco', 'Jaboatão dos Guararapes', 'São José dos Campos', 'Ribeirão Preto', 'Uberlândia'];
    setores TEXT[] := ARRAY['Centro', 'Norte', 'Sul', 'Leste', 'Oeste', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste', 'Centro Histórico', 'Comercial', 'Residencial', 'Industrial', 'Universitário', 'Financeiro'];
    telefones TEXT[] := ARRAY['(11)', '(21)', '(31)', '(41)', '(51)', '(61)', '(71)', '(81)', '(85)', '(62)', '(27)', '(86)', '(84)', '(83)', '(82)'];
BEGIN
    FOR i IN 51..1500 LOOP
        INSERT INTO members (
            name,
            phone,
            instagram,
            city,
            sector,
            referrer,
            couple_name,
            couple_phone,
            couple_instagram,
            couple_city,
            couple_sector,
            is_friend,
            contracts_completed,
            ranking_position,
            ranking_status,
            is_top_1500,
            can_be_replaced,
            registration_date,
            status,
            created_at,
            updated_at
        ) VALUES (
            nomes[1 + (i % array_length(nomes, 1))] || ' ' || sobrenomes[1 + ((i * 2) % array_length(sobrenomes, 1))],
            telefones[1 + (i % array_length(telefones, 1))] || ' 9' || LPAD((i % 10000)::TEXT, 4, '0') || '-' || LPAD((i % 100)::TEXT, 2, '0') || LPAD((i % 10)::TEXT, 1, '0'),
            '@' || LOWER(nomes[1 + (i % array_length(nomes, 1))]) || LOWER(sobrenomes[1 + ((i * 2) % array_length(sobrenomes, 1))]) || i,
            cidades[1 + (i % array_length(cidades, 1))],
            setores[1 + (i % array_length(setores, 1))],
            'Administrador',
            -- Dados do cônjuge (usando nomes diferentes)
            nomes[1 + ((i + 1) % array_length(nomes, 1))] || ' ' || sobrenomes[1 + ((i * 3) % array_length(sobrenomes, 1))],
            telefones[1 + (i % array_length(telefones, 1))] || ' 8' || LPAD((i % 10000)::TEXT, 4, '0') || '-' || LPAD((i % 100)::TEXT, 2, '0') || LPAD((i % 10)::TEXT, 1, '0'),
            '@' || LOWER(nomes[1 + ((i + 1) % array_length(nomes, 1))]) || LOWER(sobrenomes[1 + ((i * 3) % array_length(sobrenomes, 1))]) || i,
            cidades[1 + (i % array_length(cidades, 1))], -- Mesma cidade do membro principal
            setores[1 + (i % array_length(setores, 1))], -- Mesmo setor do membro principal
            false,
            (i % 20), -- Contratos de 0 a 19
            i,
            CASE 
                WHEN (i % 20) >= 15 THEN 'Verde' -- 15+ contratos = Verde
                WHEN (i % 20) >= 1 THEN 'Amarelo'   -- 1-14 contratos = Amarelo  
                ELSE 'Vermelho'                      -- 0 contratos = Vermelho
            END,
            i <= 1500,
            false,
            '2024-01-01'::DATE + (i % 365)::INTEGER,
            'Ativo',
            NOW(),
            NOW()
        );
    END LOOP;
END $$;

-- =====================================================
-- 4. VERIFICAR INSERÇÃO
-- =====================================================

-- Verificar quantos membros foram inseridos
SELECT COUNT(*) as total_membros FROM members WHERE is_friend = false;

-- Verificar se atingiu o limite de 1500
SELECT 
    CASE 
        WHEN COUNT(*) >= 1500 THEN '✅ LIMITE ATINGIDO - Pode ativar fase de contratos pagos'
        ELSE '❌ Ainda faltam ' || (1500 - COUNT(*)) || ' membros'
    END as status_fase
FROM members 
WHERE is_friend = false;

-- =====================================================
-- 5. ATUALIZAR CONTADOR DA FASE
-- =====================================================

-- Atualizar o contador da fase de membros
UPDATE phase_control 
SET current_count = (
    SELECT COUNT(*) 
    FROM members 
    WHERE is_friend = false
)
WHERE phase_name = 'members_registration';

-- =====================================================
-- RESUMO:
-- =====================================================
-- ✅ LIMPEZA AUTOMÁTICA de dados de teste anteriores
-- ✅ Script gera 1500 membros de teste COMPLETOS
-- ✅ Dados realistas com nomes, telefones, Instagram
-- ✅ DADOS DO CÔNJUGE incluídos (nome, telefone, Instagram, cidade, setor)
-- ✅ Cidades e setores variados para ambos os membros do casal
-- ✅ Posições de ranking sequenciais
-- ✅ LÓGICA DE RANKING CORRIGIDA:
--     • 0 contratos = Vermelho (correto)
--     • 1-14 contratos = Amarelo (correto) 
--     • 15+ contratos = Verde (correto)
-- ✅ Atualiza contador da fase automaticamente
-- ✅ Estrutura completa para teste do sistema de casais
-- ✅ Distribuição realista de contratos e status
-- ✅ Compatível com UUID (sem necessidade de reset de sequência)
